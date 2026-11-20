import io, hashlib, json
from datetime import datetime,timezone
from pathlib import Path
import numpy as np, pandas as pd, requests, pyarrow.parquet as pq
from scipy.optimize import least_squares
from scipy.integrate import solve_ivp

u='https://huggingface.co/datasets/oxzoid/space-track-tle-history/resolve/main/data/tle_1963.parquet'
w='https://celestrak.org/SpaceData/SW-All.csv'
b1=requests.get(u,timeout=45);b1.raise_for_status();b2=requests.get(w,timeout=45);b2.raise_for_status()
tle=pq.read_table(io.BytesIO(b1.content)).to_pandas();tle=tle[tle.norad_id==528].sort_values('epoch').drop_duplicates('epoch')
sw=pd.read_csv(io.BytesIO(b2.content));sw=sw[(sw.DATE>='1963-01-01')&(sw.DATE<='1963-11-10')].copy();sw['DATE']=pd.to_datetime(sw.DATE,utc=True)
origin=datetime(1963,1,17,tzinfo=timezone.utc)
t=np.array([(p.to_pydatetime().replace(tzinfo=timezone.utc)-origin).total_seconds()/86400 for p in tle.epoch]);obs=tle.mean_motion.to_numpy(float)
swdays=np.array([(p.to_pydatetime()-origin).total_seconds()/86400 for p in sw.DATE]); fobs=sw['F10.7_ADJ'].to_numpy(float); ap=sw['AP_AVG'].to_numpy(float)
# Only no-future data for fitted estimates; explanatory exogenous observations supplied per date.
# A 1-day lag Ap is a defensible toy response, but still not a physical thermosphere model.
mu=398600.4418;re=6378.137
height=lambda n:(mu/((2*np.pi*n/86400)**2))**(1/3)-re
nfromheight=lambda h:86400/(2*np.pi)*np.sqrt(mu/(re+h)**3)
h=height(obs)
# Set 120 km terminal; if curve falls below before validation, mark failure as a valid model rejection.
# Integrate log-metric n dynamics with exponential altitude dependence.
Fref=float(np.median(fobs)); Apref=float(np.median(ap))
def weather(tt):
 # stepwise daily historical values; Ap delayed 1 day; prevents future leakage in parameter calibration
 F=np.interp(tt,swdays,fobs)
 A=np.interp(tt-1,swdays,ap)
 return F,A

def integrate(params,ttimes,anchor_t,anchor_h,weather_on=True):
 # params: lnK, lnH, betaF, betaAp. K km/day at anchor reference altitude
 lnK,lnH,bf,ba=params; K=np.exp(lnK);H=np.exp(lnH)
 def rhs(tt,y):
  alt=float(y[0]);F,A=weather(tt)
  forcing=np.exp(np.clip(bf*(F-Fref)/100+ba*(A-Apref)/40,-4,4)) if weather_on else 1.
  return [-K*np.exp(np.clip((anchor_h-alt)/H,-100,40))*np.sqrt(max((re+alt)/(re+anchor_h),.001))*forcing]
 def event(tt,y):return y[0]-120.
 event.terminal=True;event.direction=-1
 end=max(ttimes)
 if end==anchor_t:return np.full(len(ttimes),anchor_h),None
 sol=solve_ivp(rhs,(anchor_t,end),[anchor_h],dense_output=True,events=event,rtol=8e-7,atol=1e-7,max_step=1.0,method='RK45')
 if not sol.success: raise RuntimeError(sol.message)
 terminal=float(sol.t_events[0][0]) if len(sol.t_events[0]) else None
 evaluate=np.clip(ttimes,anchor_t,terminal if terminal is not None else end)
 alt=sol.sol(evaluate)[0]
 if terminal is not None: alt=alt-50*np.maximum(np.asarray(ttimes)-terminal,0)
 return alt,terminal

splits=[('Aug31','1963-08-31'),('Sep28','1963-09-28'),('Oct11','1963-10-11'),('Oct21','1963-10-21')]
reports=[]
for label,cut in splits:
 cutoff=(datetime.fromisoformat(cut).replace(tzinfo=timezone.utc)-origin).total_seconds()/86400
 train=np.where(t<=cutoff)[0];test=np.where(t>cutoff)[0]
 data={'cutoff':label,'train_n':len(train),'test_n':len(test)}
 for mode in ('constant','solar'):
  initial=[np.log(.18),np.log(55),0.,0.]
  def fn(z):
   p=list(z)+([0.,0.] if mode=='constant' else [])
   try:
    hh,terminal=integrate(p,t[train],t[train][0],h[train][0],mode=='solar')
    err=(hh-h[train])
    if mode=='solar':return np.r_[err,2.5*z[2],2.5*z[3]]
    return err
   except Exception:return np.full(len(train)+(2 if mode=='solar' else 0),1e4)
  start=initial if mode=='solar' else initial[:2]
  lower=[np.log(1e-5),np.log(12)]+([-2,-2] if mode=='solar' else [])
  upper=[np.log(12),np.log(200)]+([2,2] if mode=='solar' else [])
  fit=least_squares(fn,start,bounds=(lower,upper),max_nfev=120,ftol=1e-6,xtol=1e-6)
  params=list(fit.x)+([0,0] if mode=='constant' else [])
  data[mode+'_parameters']={'K_kmday':float(np.exp(params[0])),'H_km':float(np.exp(params[1])),'beta_F':float(params[2]),'beta_A':float(params[3])}
  try:
   hh,terminal=integrate(params,t[test],t[train][0],h[train][0],mode=='solar')
   if terminal is not None and terminal<t[test][-1]:
    data[mode+'_status']='premature_reentry';data[mode+'_terminal_day']=terminal
   else:
    predicted=nfromheight(hh)
    err=predicted-obs[test]
    data[mode+'_status']='valid'
    data[mode+'_rmse_revday']=float(np.sqrt(np.mean(err**2)))
    data[mode+'_last_error_revday']=float(err[-1])
  except Exception as e:data[mode+'_status']='error';data[mode+'_error']=str(e)
 reports.append(data)
 print('SPLIT',json.dumps(data),flush=True)

out={'model':'time-varying empirical weather multiplier of simple circular-decay law; NOT NRLMSISE-00 or JB2008','sources':{'tle':u,'tle_sha256':hashlib.sha256(b1.content).hexdigest(),'celestrak':w,'weather_sha256':hashlib.sha256(b2.content).hexdigest()},'weather_oct27':sw.loc[sw.DATE.dt.strftime('%Y-%m-%d')=='1963-10-27',['DATE','F10.7_ADJ','AP_AVG']].astype(str).to_dict('records'),'weather_nov8':sw.loc[sw.DATE.dt.strftime('%Y-%m-%d')=='1963-11-08',['DATE','F10.7_ADJ','AP_AVG']].astype(str).to_dict('records'),'splits':reports,'notes':['No use of Conde coordinates, no phase, no longitude','4 parameters vs 2; regularized solar terms','Ap one-day lag, daily sampled; solar effects empirical, not causal identification','TLEs are mean elements without covariance. No valid reentry prediction yet.']}
Path('/kaggle/working/conde-528-solar-validation.json').write_text(json.dumps(out,indent=2))
print('DONE',flush=True)
