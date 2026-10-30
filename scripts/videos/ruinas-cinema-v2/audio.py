"""Offline Brazilian narration and original instrumental bed (no Suno download bypass)."""
import json, math, random, subprocess
from pathlib import Path
from film import DIR, SCENES, build

ASSETS=DIR/"assets"
ASSETS.mkdir(exist_ok=True)
def run(args):
    subprocess.run(args,check=True)
def voice():
    import soundfile as sf
    from misaki.espeak import EspeakG2P
    from kokoro_onnx import Kokoro
    g2p=EspeakG2P(language="pt-br")
    k=Kokoro(str(DIR/"models/kokoro-v1.0.onnx"),str(DIR/"models/voices-v1.0.bin"))
    durations=[]
    for i,(_,_,_,text) in enumerate(SCENES):
        phonemes,_=g2p(text)
        samples,sr=k.create(phonemes,"pm_alex",speed=.92,is_phonemes=True)
        fp=ASSETS/f"narration-{i:02}.wav"
        sf.write(str(fp),samples,sr)
        d=max(3.8,round(len(samples)/sr+1.20,3))
        durations.append(d)
        print(f"voice {i:02} {d:.2f}s",flush=True)
    return durations
def soundtrack(seconds):
    import mido
    midi=mido.MidiFile(ticks_per_beat=480)
    acoustic=mido.MidiTrack();midi.tracks.append(acoustic)
    acoustic.append(mido.Message("program_change",program=24,channel=0,time=0))
    chords=[
        [52,59,64,67,71,67,64,59],
        [48,55,60,64,67,64,60,55],
        [50,57,62,66,69,66,62,57],
        [47,54,59,62,66,62,59,54],
    ]
    r=random.Random(1937);sec_per_note=.38;whole=int(seconds/sec_per_note)+8
    for i in range(whole):
        bar=i//8;note=chords[bar%4][i%8]
        vel=46+r.randint(-9,8)
        acoustic.append(mido.Message("note_on",note=note,velocity=vel,channel=0,time=0 if i==0 else 0))
        acoustic.append(mido.Message("note_off",note=note,velocity=0,channel=0,time=365))
    # A sustained low cello supports the fire and recognition without jump-scare.
    # A separate track uses delta time ticks and overlaps piano chords.
    pad=mido.MidiTrack();midi.tracks.append(pad)
    pad.append(mido.Message("program_change",program=48,channel=1,time=0))
    for i in range(max(1,int(seconds/12))):
        note=[40,36,38,35][i%4]
        pad.append(mido.Message("note_on",note=note,velocity=28,channel=1,time=0))
        pad.append(mido.Message("note_off",note=note,velocity=0,channel=1,time=11520))
    midi.save(ASSETS/"trilha.mid")
    sf2="/usr/share/sounds/sf2/FluidR3_GM.sf2"
    run(["fluidsynth","-ni",sf2,str(ASSETS/"trilha.mid"),"-F",str(ASSETS/"raw-music.wav"),"-r","22050"])
    run(["ffmpeg","-y","-loglevel","error","-i",str(ASSETS/"raw-music.wav"),
         "-f","lavfi","-i",f"anoisesrc=duration={seconds}:color=brown:sample_rate=22050",
         "-filter_complex",f"[0:a]volume=.45,lowpass=f=5600,afade=t=in:st=0:d=3,afade=t=out:st={max(1,seconds-4)}:d=4[g];[1:a]highpass=f=900,lowpass=f=3200,volume=.003[n];[g][n]amix=inputs=2:duration=first:normalize=0[a]",
         "-map","[a]","-codec:a","libmp3lame","-q:a","5",str(ASSETS/"trilha.mp3")])
def grain_svg():
    r=random.Random(42)
    ds=[]
    for i in range(115):
        x=r.randrange(620);y=r.randrange(620);d=r.randrange(3,14)
        ds.append(f'<path d="M{x} {y} l{d} 0" stroke="#caab7f" stroke-opacity=".12" stroke-width="{r.choice([1,2])}"/>')
    (ASSETS/"grain.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="620" height="620">{"".join(ds)}</svg>')
if __name__=="__main__":
    durations=voice()
    meta=build(durations)
    soundtrack(meta["duration"]+1)
    grain_svg()
    (DIR/"voice-report.json").write_text(json.dumps({"engine":"kokoro-onnx","voice":"pm_alex","times":durations,"film":meta},ensure_ascii=False,indent=2))
    print(json.dumps(meta,ensure_ascii=False))
