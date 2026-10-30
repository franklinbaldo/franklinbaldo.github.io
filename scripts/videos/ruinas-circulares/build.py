#!/usr/bin/env python3
"""O menino que nasceu de um sonho: roteiro e composição Hyperframes.
Vídeo original inspirado livremente em As ruínas circulares (J. L. Borges).
Requer edge-tts (preferencial), espeak-ng/ffmpeg (alternativa), e Hyperframes.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import json, math, os, subprocess, wave, struct

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
ASSETS.mkdir(exist_ok=True)

SCENES = [
    ("O menino que nasceu de um sonho", "Uma história de sonhos dentro de sonhos.", "title", "#161b3a"),
    ("O círculo de pedras", "Era uma vez um sonhador que encontrou um jardim de pedras muito antigas. Ali, sob a lua, ele decidiu sonhar com alguém especial.", "stones", "#15283b"),
    ("Uma estrelinha cresce", "No começo, era só uma luz pequenina. A cada noite, ela ganhava olhos curiosos, mãos pequeninas e um sorriso que parecia amanhecer.", "star", "#233356"),
    ("O menino do jardim", "Assim nasceu, dentro dos sonhos, um menino. O sonhador ensinou a ele o nome das árvores, o caminho das nuvens e a alegria de perguntar.", "boy", "#253f40"),
    ("O primeiro caminho", "Quando cresceu, o menino saiu para conhecer o mundo. O sonhador sentiu saudade, mas sabia: os sonhos também precisam aprender a caminhar sozinhos.", "walk", "#32445f"),
    ("O segredo das chamas", "Certa noite, pequenas chamas dançaram entre as pedras. O sonhador percebeu que elas brilhavam sem queimá-lo. E então compreendeu um segredo inesperado.", "fire", "#50334e"),
    ("Um sonho dentro do outro", "Ele também era o sonho de alguém! E sorriu. Talvez cada sonho seja uma porta para outro sonho, e cada história, uma forma de cuidar.", "reveal", "#272a52"),
    ("E agora?", "Quem será que está sonhando esta história com você?", "end", "#192347"),
]

def run(cmd, **kwargs):
    return subprocess.run(cmd, check=True, **kwargs)

def create_voice(text, path):
    # Voz neural local, quando um modelo Piper está disponível no executor.
    model = os.environ.get("PIPER_MODEL_PATH")
    if model and Path(model).exists():
        wav = path.with_suffix(".wav")
        try:
            run(["piper", "--model", model, "--output_file", str(wav)],
                input=text.encode("utf-8"), timeout=100, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                 "-codec:a", "libmp3lame", "-q:a", "3", str(path)])
            wav.unlink(missing_ok=True)
            if path.stat().st_size > 1000:
                return "piper-pt_BR-faber-medium"
        except (OSError, subprocess.SubprocessError, TimeoutError):
            wav.unlink(missing_ok=True)
    edge = ["edge-tts", "--voice", "pt-BR-FranciscaNeural", "--rate", "-8%", "--text", text, "--write-media", str(path)]
    try:
        run(edge, timeout=55, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        if path.stat().st_size > 1000:
            return "edge-tts"
    except (OSError, subprocess.SubprocessError, TimeoutError):
        pass
    wav = path.with_suffix(".wav")
    run(["espeak-ng", "-v", "pt-br", "-s", "138", "-w", str(wav), text], stdout=subprocess.DEVNULL)
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-q:a", "4", str(path)])
    wav.unlink(missing_ok=True)
    return "espeak-ng"

def duration(path):
    result = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(path)],
        text=True)
    return float(result.strip())

def stones():
    out = []
    for i in range(12):
        a = i * math.pi / 6
        x = 480 + 320 * math.cos(a)
        y = 310 + 80 * math.sin(a)
        out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="31" ry="19" fill="#a0abb1" opacity=".76" transform="rotate({i*30} {x:.1f} {y:.1f})"/><ellipse cx="{x:.1f}" cy="{y-5:.1f}" rx="27" ry="12" fill="#d6cfc5" opacity=".48"/>')
    return "".join(out)

def dreamer(x=285, scale=1, op=1):
    return f'<g transform="translate({x} 154) scale({scale})" opacity="{op}"><path d="M-66 180 Q-54 26 0 10 Q54 26 68 180 Z" fill="#64638d" stroke="#c7b2cd" stroke-width="4"/><path d="M-45 40 Q0 -30 44 40 L24 60 Q0 48 -24 60Z" fill="#8682b1"/><circle cy="55" r="27" fill="#d9b49b"/><path d="M-25 48 Q0 12 25 48" fill="none" stroke="#42385e" stroke-width="13"/><path d="M-6 67 Q0 71 6 67" fill="none" stroke="#684a55" stroke-width="3" stroke-linecap="round"/></g>'

def boy(x=635, y=235, scale=1, op=1):
    return f'<g transform="translate({x} {y}) scale({scale})" opacity="{op}"><circle cy="-54" r="32" fill="#f5cfa7" stroke="#ffdba8" stroke-width="4"/><path d="M-29 -70 Q-1 -100 28 -67" fill="#61517e"/><circle cx="-10" cy="-54" r="3" fill="#453b66"/><circle cx="10" cy="-54" r="3" fill="#453b66"/><path d="M-9 -41 Q0 -34 9 -41" fill="none" stroke="#9f6170" stroke-width="3"/><path d="M-26 -21 L26 -21 L32 59 L-30 59 Z" fill="#f5c77e"/><path d="M-25 -8 L-60 32 M25 -8 L57 27 M-14 59 L-22 102 M14 59 L24 102" stroke="#f5cfa7" stroke-width="13" stroke-linecap="round"/></g>'

def svg_art(kind):
    stars = "".join(f'<circle cx="{(i*147+49)%960}" cy="{(i*i*29+23)%260}" r="{1+i%3}" fill="#fce9c5" opacity="{.2+(i%5)*.12}"/>' for i in range(42))
    ring = '<ellipse cx="480" cy="317" rx="350" ry="111" fill="none" stroke="#efe1bf" stroke-width="5" opacity=".45"/>' + stones()
    moon = '<circle cx="748" cy="77" r="47" fill="#f7e0a8" opacity=".94"/><circle cx="764" cy="58" r="47" fill="#29344a"/>'
    ground = '<path d="M0 382 Q220 310 460 381 T960 371 L960 500 L0 500Z" fill="#2a4950" opacity=".65"/>'
    leaves = '<g opacity=".77" fill="none" stroke="#81bca5" stroke-width="6"><path d="M110 360 Q100 230 166 170"/><path d="M123 288 Q52 272 63 208"/><path d="M121 260 Q184 233 204 185"/><path d="M864 353 Q823 272 880 180"/><path d="M849 291 Q772 266 754 212"/></g>'
    sparkle = '<circle cx="525" cy="195" r="100" fill="#fddf9c" opacity=".10"/><path d="M525 127 L541 180 L594 195 L541 210 L525 263 L509 210 L456 195 L509 180Z" fill="#faebbc"/><circle cx="525" cy="195" r="21" fill="#fff5d5"/>'
    flames = ''.join(f'<path d="M{x-18} 337 Q{x-45} 290 {x+2} 246 Q{x-2} 299 {x+23} 289 Q{x+41} 326 {x+6} 351Z" fill="{col}" opacity=".85"/>' for x,col in [(350,"#ed947e"),(470,"#f7c47e"),(590,"#db8bb4")])
    if kind == "title": inner = f'{ground}{ring}{moon}{stars}{dreamer(430,1.05,.7)}'
    elif kind == "stones": inner = f'{ground}{ring}{moon}{stars}{dreamer(470,1)}'
    elif kind == "star": inner = f'{ground}{ring}{stars}{dreamer(235,.9)}{sparkle}'
    elif kind == "boy": inner = f'{ground}{ring}{leaves}{dreamer(270,.8)}{boy(600,225,.88)}{stars}'
    elif kind == "walk": inner = f'{ground}{ring}{leaves}{dreamer(280,.84,.8)}{boy(710,230,.86)}{moon}'
    elif kind == "fire": inner = f'{ground}{ring}{dreamer(475,.95)}{flames}{stars}'
    elif kind == "reveal": inner = f'{ground}{ring}{dreamer(330,.82,.8)}{boy(625,240,.7,.7)}{sparkle}{stars}'
    else: inner = f'{ground}{ring}{moon}{stars}{sparkle}'
    return f'<svg class="illustration" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="v"><stop offset="0" stop-color="#7d8db2" stop-opacity=".26"/><stop offset="1" stop-color="#151829" stop-opacity="0"/></radialGradient></defs><ellipse cx="480" cy="255" rx="450" ry="220" fill="url(#v)"/>{inner}</svg>'

def audio_music(seconds):
    path = ASSETS / "ambient.mp3"
    # Trilha sintetizada original, discreta, sem uso de material de terceiros.
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", f"sine=frequency=196:sample_rate=22050:duration={seconds}",
        "-f", "lavfi", "-i", f"sine=frequency=294:sample_rate=22050:duration={seconds}",
        "-filter_complex", f"[0:a]volume=0.012[a];[1:a]volume=0.005[b];[a][b]amix=inputs=2:duration=longest,afade=t=in:st=0:d=3,afade=t=out:st={max(0,seconds-3)}:d=3[out]",
        "-map", "[out]", "-codec:a", "libmp3lame", "-b:a", "40k", str(path)]
    run(cmd)

def main():
    starts, lengths, providers = [], [], []
    clock = 0.0
    for i, (title, narration, motif, bg) in enumerate(SCENES):
        clip = ASSETS / f"narration-{i}.mp3"
        providers.append(create_voice(narration, clip))
        d = duration(clip) + 1.7
        starts.append(round(clock, 2))
        lengths.append(round(d, 2))
        clock += d
    total = round(clock + 0.2, 2)
    audio_music(total)
    head = '''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>O menino que nasceu de um sonho — Hyperframes</title>
<style>
*{box-sizing:border-box}html,body{margin:0;background:#14182b;color:#fff;font-family:Georgia,"Times New Roman",serif;overflow:hidden}
#root{position:relative;overflow:hidden;background:#10172b;width:960px;height:540px}
.scene{position:absolute;inset:0;overflow:hidden;isolation:isolate}
.scene:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,#52628a55,transparent 68%),linear-gradient(180deg,var(--bg),#12172d);z-index:-2}
.illustration{position:absolute;top:-12px;width:100%;height:425px;filter:drop-shadow(0 0 16px #d6cbb329)}
.copy{position:absolute;left:62px;right:62px;bottom:30px;text-align:center;z-index:4}
.copy h1{font-size:55px;line-height:1.09;margin:0 0 14px;color:#fff0cc;text-shadow:0 2px 16px #13132e}
.copy h2{font-size:36px;line-height:1.08;margin:0 0 12px;color:#f5dbae;text-shadow:0 3px 10px #181529}
.copy p{font-size:25px;line-height:1.31;color:#faf8f3;margin:0 auto;max-width:840px;text-shadow:0 2px 8px #080c19,0 0 12px #080c19}
.copy:before{content:"";position:absolute;inset:-23px -16px;z-index:-1;background:linear-gradient(90deg,transparent,#10162dbe 13%,#10162ddc 50%,#10162dbe 87%,transparent);filter:blur(9px)}
.top{position:absolute;left:34px;top:26px;font:17px system-ui,sans-serif;letter-spacing:.24em;color:#f8dba8;text-transform:uppercase}
.credit{position:absolute;right:34px;top:28px;font:14px system-ui,sans-serif;color:#ffffff94}
</style></head><body>'''
    pieces=[head, f'<div id="root" data-composition-id="ruinas-sonhadas" data-start="0" data-duration="{total}" data-width="960" data-height="540">']
    for i, (title, narration, motif, bg) in enumerate(SCENES):
        pieces.append(f'<section id="scene-{i}" class="scene clip" data-start="{starts[i]}" data-duration="{lengths[i]}" data-track-index="0" style="--bg:{bg}">'
            + f'<div class="top">UM CONTO PARA SONHAR</div><div class="credit">Inspirado livremente em Jorge Luis Borges</div>'
            + svg_art(motif)
            + f'<div class="copy"><{"h1" if i == 0 else "h2"}>{escape(title)}</{"h1" if i == 0 else "h2"}><p>{escape(narration)}</p></div></section>')
        pieces.append(f'<audio id="voice-{i}" src="./assets/narration-{i}.mp3" data-start="{starts[i]}" data-duration="{round(lengths[i]-1.7,2)}" data-track-index="2" data-volume="1"></audio>')
    pieces.append(f'<audio id="music" src="./assets/ambient.mp3" data-start="0" data-duration="{total}" data-track-index="3" data-volume=".8"></audio>')
    pieces.append('''</div><script src="./assets/gsap.min.js"></script><script>
const tl = gsap.timeline({paused:true});
''')
    for i,s in enumerate(starts):
        pieces.append(f'tl.fromTo("#scene-{i} .illustration",{{scale:1.035,opacity:0.15}},{{scale:1,opacity:1,duration:2.0,ease:"power1.out"}},{s});')
        pieces.append(f'tl.fromTo("#scene-{i} .copy",{{y:22,opacity:0}},{{y:0,opacity:1,duration:1.3,ease:"power2.out"}},{s+0.35});')
    pieces.append('window.__timelines=window.__timelines||{};window.__timelines["ruinas-sonhadas"]=tl;</script></body></html>')
    (HERE / "index.html").write_text("\n".join(pieces),encoding="utf-8")
    (HERE / "meta.json").write_text(json.dumps({"name":"O menino que nasceu de um sonho","description":"Conto infantil inspirado livremente em As ruínas circulares","version":"1.0"}, ensure_ascii=False,indent=2),encoding="utf-8")
    (HERE / "render-metadata.json").write_text(json.dumps({"duration":total,"scene_starts":starts,"scene_lengths":lengths,"tts":providers},ensure_ascii=False,indent=2))
    print(json.dumps({"total":total,"voices":providers},ensure_ascii=False))

if __name__=="__main__":
    main()
