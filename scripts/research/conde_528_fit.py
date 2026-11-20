import json, math
from datetime import datetime,timezone
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
from scipy.integrate import solve_ivp
from scipy.stats import median_abs_deviation
import matplotlib;matplotlib.use('Agg')
import matplotlib.pyplot as plt

p=Path('/kaggle/input')
# Dataset fetched on the executor; notebook remains self-contained.
import requests,io,pyarrow.parquet as pq
url='https://huggingface.co/datasets/oxzoid/space-track-tle-history/resolve/main/data/tle_1963.parquet'
response=requests.get(url,timeout=45);response.raise_for_status()
df=pq.read_table(io.BytesIO(response.content)).to_pandas()
df=df[df.norad_id==528].sort_values('epoch').drop_duplicates('epoch')
origin=datetime(1963,1,17,tzinfo=timezone.utc)
t=np.array([(v.to_pydatetime().replace(tzinfo=timezone.utc)-origin).total_seconds()/86400 for v in df.epoch]); n=df.mean_motion.to_numpy(dtype=float)
mu=398600.4418;Re=6378.137
h=lambda x:(mu/((2*np.pi*x/86400)**2))**(1/3)-Re
nfromh=lambda a:86400/(2*np.pi)*np.sqrt(mu/(Re+a)**3)
he=h(n)
# Fit only historical mean motion; no phase/RAAN or simulated geographic reentry.
# ODE: h' = -K exp((href-h)/H) sqrt((Re+h)/(Re+href)); 
# K (km/d) and H (km) are fitted independently. Constant h derivative baseline, linear n and exponential n alternatives.

def terminal_time(z,anchor_h):
 K,H=np.exp(z)
 grid=np.linspace(120.,anchor_h,4001)
 integrand=np.exp(np.clip((grid-anchor_h)/H,-200,50))*np.sqrt((Re+anchor_h)/(Re+grid))/K
 dt=np.diff(grid)*(integrand[1:]+integrand[:-1])/2
 return np.sum(dt)

def evolve(par,t_fit,anchor_t,anchor_h,strict=True):
 # Analytic time-to-altitude quadrature; avoids ODE stiffness near reentry.
 K,H=np.exp(par)
 grid=np.linspace(120.,anchor_h,4001)
 integrand=np.exp(np.clip((grid-anchor_h)/H,-200,50))*np.sqrt((Re+anchor_h)/(Re+grid))/K
 dt=np.diff(grid)*(integrand[1:]+integrand[:-1])/2
 elapsed_from_high=np.r_[0,np.cumsum(dt[::-1])]
 alt_from_high=grid[::-1]
 delta=np.asarray(t_fit)-anchor_t
 terminal=elapsed_from_high[-1]
 if strict and np.any(delta>terminal):
  raise RuntimeError(f'model reached 120 km at day {anchor_t+terminal:.3f} before validation time')
 alt=np.interp(np.minimum(delta,terminal),elapsed_from_high,alt_from_high)
 # Continuous fitting penalty for premature reentry, never used as physical forecast.
 if not strict:alt=alt-50*np.maximum(delta-terminal,0)
 return alt

def fit_physical(train):
 a=t[train];y=he[train];anchor_t=a[0];anchor_h=y[0];targ=(a-a[0]);
 def residual(z):
  try:return np.clip(evolve(z,a,anchor_t,anchor_h,strict=False)-y,-1e5,1e5)
  except Exception:return np.full_like(y,1e4)
 opt=least_squares(residual,[np.log(0.02),np.log(60.)],bounds=([np.log(1e-5),np.log(10.)],[np.log(10.),np.log(300.)]),max_nfev=130,ftol=1e-8)
 return opt.x,(anchor_t,anchor_h),float(np.sqrt(np.mean(residual(opt.x)**2)))

def fit_exponential(train):
 a=t[train];y=n[train];t0=a[-1]
 def pred(z,tt):
  c,A,tau=z;return c+A*np.exp(np.clip((tt-t0)/tau,-25,15))
 opt=least_squares(lambda z:pred(z,a)-y,[min(y)-.1,max(y)-min(y)+.1,45],bounds=([13,1e-5,3],[min(y)-1e-4,10,500]),max_nfev=1200)
 return opt.x,t0,float(np.sqrt(np.mean((pred(opt.x,a)-y)**2))),pred

def fit_quadratic(train):
 a=t[train];t0=a[-1];z=np.polyfit(a-t0,n[train],2);return z,t0

splits=[('train_to_Aug31',datetime(1963,8,31,tzinfo=timezone.utc)),('train_to_Sep28',datetime(1963,9,29,tzinfo=timezone.utc)),('train_to_Oct11',datetime(1963,10,12,tzinfo=timezone.utc)),('train_to_Oct21',datetime(1963,10,22,tzinfo=timezone.utc))]
results=[]
for name,cut in splits:
 bound=(cut-origin).total_seconds()/86400
 train=np.where(t<=bound)[0];test=np.where(t>bound)[0]
 if len(train)<8:continue
 row={'split':name,'train_count':len(train),'holdout_count':len(test),'first_holdout':str(df.epoch.iloc[test[0]]),'last_holdout':str(df.epoch.iloc[test[-1]])}
 for method in ('physical','exponential','quadratic'):
  try:
   if method=='physical':
    par,(tt,hh),insample=fit_physical(train)
    hp=evolve(par,t[test],tt,hh)
    predictions=nfromh(hp)
    row['physical_K_kmd']=float(np.exp(par[0]));row['physical_H_km']=float(np.exp(par[1]))
    row['physical_train_rmse_alt_km']=insample
   elif method=='exponential':
    par,t0,insample,predict=fit_exponential(train)
    predictions=predict(par,t[test]);row['exponential_tau_days']=float(par[2])
   else:
    par,t0=fit_quadratic(train);predictions=np.polyval(par,t[test]-t0)
   err=predictions-n[test]
   row[method+'_rmse_revday']=float(np.sqrt(np.mean(err**2)))
   row[method+'_mae_revday']=float(np.mean(abs(err)))
   row[method+'_last_error_revday']=float(err[-1])
  except Exception as e:row[method+'_error']=str(e)
 results.append(row)

# Last 20 historical TLEs, fit without last 5, report predictions and then last full fit to forecast.
train=np.arange(len(t)-5);test=np.arange(len(t)-5,len(t));z,(ta,ha),_ = fit_physical(train)
try:
 pred=nfromh(evolve(z,t[test],ta,ha))
 last5=[{'epoch':str(df.epoch.iloc[j]),'observed':float(n[j]),'predicted':float(pred[k]),'error':float(pred[k]-n[j])} for k,j in enumerate(test)]
except Exception as e:
 last5={'status':'no_valid_forecast','cause':str(e),'fit_K':float(np.exp(z[0])),'fit_H':float(np.exp(z[1]))}

# Fit with all 45. The model might have different extrapolation depending on training window.
windows=[('all_45',0),('last_25',len(t)-25),('last_15',len(t)-15),('last_10',len(t)-10)]
forecasts=[]
t_final=(datetime(1963,11,8,12,tzinfo=timezone.utc)-origin).total_seconds()/86400
for name,start in windows:
 try:
  sub=np.arange(start,len(t));z,(ta,ha),rmse=fit_physical(sub)
  hf=float(evolve(z,np.array([t_final]),ta,ha)[0]);nm=float(nfromh(hf)) if hf>-Re else None
  forecasts.append({'model':name,'train_count':len(sub),'K_km_per_day':float(np.exp(z[0])),'H_km':float(np.exp(z[1])),'insample_rmse_alt_km':rmse,'terminal_120km_day_after_origin':float(ta+terminal_time(z,ha)),'nov8_altitude_km':hf,'nov8_mean_motion':nm})
 except Exception as e:forecasts.append({'model':name,'error':str(e)})

out={'method':'exponential-density circular-orbit model with independent fits and holdouts','source_sha256':__import__('hashlib').sha256(response.content).hexdigest(),'count':len(df),'splits':results,'last5':last5,'forecasts_extrapolation_NOT_VALIDATED':forecasts,'limitations':['No SGP4, no TEME phase validation, no BSTAR drag','Do not use forecasts to assert reentry longitude/time','Per-TLE mean motion is model-fitted and contains errors and changes in atmospheric density','Nov 8 extrapolation has no terminal observation']}
Path('/kaggle/working/conde-fit-results.json').write_text(json.dumps(out,indent=2))
print('SPLIT_REPORT',json.dumps(results,indent=2),flush=True)
print('LAST5',json.dumps(last5,indent=2),flush=True)
print('FORECASTS',json.dumps(forecasts,indent=2),flush=True)
plt.figure(figsize=(12,6));plt.plot(df.epoch,n,'o',label='Historical TLE mean motion',markersize=4)
plt.axvline(datetime(1963,10,12),linestyle='--',label='Validation cutoff Oct 11')
plt.xlabel('1963 epoch UTC');plt.ylabel('Mean motion (revolutions/day)');plt.title('NORAD 528: Historical TLE mean motion, Jan–Oct 1963');plt.legend();plt.tight_layout();plt.savefig('/kaggle/working/conde-528-history.png',dpi=180)
print('DONE',flush=True)
