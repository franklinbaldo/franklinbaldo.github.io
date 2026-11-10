"""HyperFrames cinematic composition: authored scene graph and deterministic motion."""
import json, re
from pathlib import Path
from html import escape
from art import image

DIR=Path(__file__).resolve().parent
FPS=24
SCENES=[
 ("travessia","river","O barco","Era uma vez um Mágico Sonhador. Ele chegou num barquinho pequeno, por um rio que atravessava uma floresta muito antiga."),
 ("ruinas","temple","O círculo","Nas ruínas de pedra, as árvores haviam crescido sobre um templo redondo. Ali o Mágico escondia uma missão que ninguém conhecia."),
 ("desejo","dream","O desejo","Ele não queria ouro, castelos ou poder. Queria realizar a mágica mais difícil de todas: sonhar um menino até que o sonho fosse real."),
 ("coracao","heart","Tum-tum","Primeiro, sonhou com um coração batendo. Tum-tum. Tum-tum. Dia depois de dia, o coração batia mais forte dentro do sonho."),
 ("criacao","body","Nasce um sonho","Depois vieram as mãos, os pés, o rosto e os cabelos. Passou quase um ano. Mas o menino, tão perfeito, ainda não acordava."),
 ("pacto","fire","O Fogo","Triste, o Mágico pediu ajuda ao Fogo, que morava naquele templo. O Fogo prometeu acordá-lo, com uma condição: ninguém saberia do segredo."),
 ("despertar","awake","O despertar","O menino abriu os olhos! Aprendeu a andar, a falar e a conhecer o mundo. O Mágico amava aquele filho como se fosse seu."),
 ("partida","departure","A partida","Os anos passaram. Quando o menino cresceu, partiu para outro templo. O pai guardou o segredo e ficou sozinho, cheio de saudade."),
 ("rumores","legend","O segredo","Viajantes contavam que um homem no Norte atravessava o fogo sem se queimar. O Mágico sabia quem era. Mas ficou com medo da descoberta."),
 ("incendio","inferno","A floresta arde","Até que um dia o fogo voltou. Um incêndio cercou as ruínas. O Mágico já não tinha para onde correr."),
 ("chamas","touch","O toque","Com medo, entrou nas chamas. Mas o fogo não doía. Era morno. Fazia carinho na pele, como se fosse feito de luz."),
 ("revelacao","revelation","A descoberta","O Mágico olhou para as próprias mãos. Não havia queimadura alguma. Então entendeu o segredo maior: ele também era um sonho."),
 ("infinito","recursive","Outro sonhador","Alguém, em algum lugar, estava sonhando com ele. Assim como ele sonhara com o menino. E talvez alguém sonhasse com esse outro sonhador..."),
 ("fim","recursive","Fim?","Quantos sonhos cabem dentro de um sonho?"),
]
TITLES={"travessia":"UM RIO NA FLORESTA","ruinas":"AS RUÍNAS CIRCULARES","desejo":"SONHAR UM AMIGO","coracao":"TUM · TUM","criacao":"UM ANO DE SONHOS","pacto":"A PROMESSA DO FOGO","despertar":"O MENINO ACORDOU","partida":"O TEMPO PASSOU","rumores":"NÃO SE QUEIMA","incendio":"A FLORESTA EM CHAMAS","chamas":"O FOGO NÃO DOÍA","revelacao":"ELE TAMBÉM ERA UM SONHO","infinito":"QUEM SONHA O SONHADOR?","fim":"FIM?"}

def scene_markup(slug,stage,seconds,i):
    art=image(stage,73+i*13)
    art=re.sub(r'\bid="([^"]+)"',lambda m:f'id="{slug}-{m.group(1)}"',art)
    art=re.sub(r'url\(#([^)]+)\)',lambda m:f'url(#{slug}-{m.group(1)})',art)
    art=art.replace('class="world"',f'class="world" aria-label="{escape(TITLES[slug])}"')
    return f'''<template>
<style>
#root {{position:absolute;inset:0;overflow:hidden;background:#16282a;isolation:isolate}}
#camera-{slug} {{position:absolute;inset:-5%;overflow:hidden;will-change:transform}}
#camera-{slug} .world {{height:100%;width:100%;display:block}}
#caption-{slug} {{position:absolute;z-index:4;top:80px;left:108px;color:#ffe2a5;font:700 50px/1.1 "DejaVu Sans",sans-serif;letter-spacing:.04em;text-shadow:0 2px 10px #17272b;max-width:1300px}}
#matte-{slug} {{position:absolute;inset:0;background:linear-gradient(to top,#10191c8c,transparent 24%,transparent 76%,#10191c36);pointer-events:none}}
#noise-{slug} {{position:absolute;inset:0;pointer-events:none;opacity:.18;background-image:url("assets/grain.svg");background-size:620px 620px}}
#brand-{slug} {{position:absolute;bottom:65px;left:110px;font:24px "DejaVu Sans",sans-serif;letter-spacing:.2em;color:#ebd4a766}}
</style>
<div id="root" data-composition-id="{slug}" data-width="1920" data-height="1080">
 <div id="camera-{slug}">{art}</div>
 <div id="matte-{slug}"></div>
 <div id="noise-{slug}"></div>
 <div id="caption-{slug}" class="clip" data-start="0.5" data-duration="{max(2,seconds-1):.2f}" data-var-text="subtitle">{escape(TITLES[slug])}</div>
 <div id="brand-{slug}">O MÁGICO E O FOGO</div>
</div>
<script>
const tl = gsap.timeline({{paused:true}});
tl.fromTo("#camera-{slug}",{{scale:1.025,x:-60,y:25}},{{scale:{1.12 if stage!='recursive' else 1.36},x:{70 if i%2 else -35},y:-48,duration:{seconds:.2f},ease:"power2.inOut"}},0);
tl.fromTo("#caption-{slug}",{{opacity:0,clipPath:"inset(0 100% 0 0)"}},{{opacity:.94,clipPath:"inset(0 0% 0 0)",duration:.9,ease:"power3.out"}},.35);
tl.to("#caption-{slug}",{{opacity:0,duration:.24,ease:"power2.in"}},{max(1.4,seconds-.58):.2f});
{action_tweens(slug,stage,seconds)}
window.__timelines=window.__timelines||{{}};window.__timelines["{slug}"]=tl;
</script>
</template>'''
def action_tweens(slug,stage,d):
    arr=[]
    def move(obj,a,b,t,dur):
        arr.append(f'tl.fromTo("#{slug}-{obj}",{a},{b},{t:.2f});')
    if stage=="river":
        move("boat",'{x:-440,rotation:-1}','{x:270,rotation:1,duration:'+f'{d:.2f}'+',ease:"sine.inOut"}',0,d)
    if stage in ("dream","heart","body"):
        move("heart",'{opacity:0,scale:.25,transformOrigin:"65% 38%"}',f'{{opacity:1,scale:1,duration:{min(2.1,d*.35):.2f},ease:"back.out(1.2)"}}',.7,d)
        arr.append(f'tl.to("#{slug}-heart",{{scale:1.1,transformOrigin:"65% 38%",duration:.58,repeat:3,yoyo:true,ease:"sine.inOut"}},2.0);')
    if stage in ("body","awake"):
        move("menino",'{opacity:0,y:85,scale:.82,transformOrigin:"65% 80%"}',f'{{opacity:1,y:0,scale:1,duration:2.5,ease:"power2.out"}}',d*.35,d)
    if stage=="departure":
        move("menino",'{x:0}',f'{{x:720,duration:{d*.8:.2f},ease:"power2.inOut"}}',d*.17,d)
    if stage in ("fire","inferno","touch","revelation"):
        move("flames",'{scaleY:.55,transformOrigin:"50% 100%",opacity:.35}',f'{{scaleY:1.15,opacity:.9,duration:{min(2.2,d*.4):.2f},ease:"power2.out"}}',d*.2,d)
        arr.append(f'tl.to("#{slug}-flames",{{x:80,scaleX:1.07,transformOrigin:"50% 100%",duration:1.5,repeat:2,yoyo:true,ease:"sine.inOut"}},2);')
    if stage=="touch":
        arr.append(f'tl.to("#{slug}-mago",{{x:250,scale:1.1,transformOrigin:"50% 50%",duration:{d*.72:.2f},ease:"power2.inOut"}},{d*.17:.2f});')
    if stage=="recursive":
        move("portal",'{scale:.52,rotation:-8,transformOrigin:"50% 50%"}',f'{{scale:{2.0 if slug!="fim" else 1.35},rotation:9,duration:{d:.2f},ease:"power2.inOut"}}',0,d)
        arr.append(f'tl.fromTo("#{slug}-echo",{{opacity:0,scale:.2,transformOrigin:"50% 50%"}},{{opacity:1,scale:1.4,duration:2.5,ease:"power3.out"}},{max(0,d*.30):.2f});')
    return "\n".join(arr)
def build(durations):
    comp=DIR/"compositions";comp.mkdir(exist_ok=True)
    starts=[];time=0.
    for i,((slug,stage,title,spoken),dur) in enumerate(zip(SCENES,durations)):
        starts.append(round(time,3)); time+=dur
        (comp/f"{slug}.html").write_text(scene_markup(slug,stage,dur,i),encoding="utf8")
    total=round(time,3)
    (DIR/"meta.json").write_text(json.dumps({"name":"O Mágico e o Fogo","description":"Filme infantil independente baseado na adaptação de Franklin Baldo","width":1920,"height":1080,"fps":24,"duration":total},ensure_ascii=False,indent=2),encoding="utf8")
    hosts=[]
    for i,((slug,stage,title,spoken),d) in enumerate(zip(SCENES,durations)):
        hosts.append(f'<div id="{slug}" class="clip" data-composition-id="{slug}" data-composition-src="compositions/{slug}.html" data-start="{starts[i]}" data-duration="{d:.3f}" data-width="1920" data-height="1080" data-track-index="1" data-track-kind="graphics"></div>')
        hosts.append(f'<audio id="nar-{i}" src="assets/narration-{i:02}.wav" data-start="{starts[i]}" data-duration="{max(.1,d-1.2):.3f}" data-track-index="3" data-volume="1.35"></audio>')
    hosts.append(f'<audio id="trilha" src="assets/trilha.mp3" data-start="0" data-duration="{total:.3f}" data-track-index="4" data-volume=".75" data-fade-in="2.4" data-fade-out="3.2"></audio>')
    hosts.append(f'<div id="fx-host" class="clip" data-start="0" data-duration="{total}" data-track-index="5"><div id="iris"></div><div id="flash"></div></div>')
    transition=[]
    for i,start in enumerate(starts[1:]):
        kind=i%3
        tt=max(.1,start-.28)
        if kind==0:
            transition.append(f'tl.fromTo("#iris",{{opacity:0,scale:.01}},{{opacity:1,scale:1,duration:.24,ease:"power4.in"}},{tt:.3f});tl.to("#iris",{{opacity:0,scale:1.8,duration:.35,ease:"power3.out"}},{start:.3f});')
        elif kind==1:
            transition.append(f'tl.fromTo("#flash",{{opacity:0}},{{opacity:.78,duration:.15,ease:"power4.in"}},{tt:.3f});tl.to("#flash",{{opacity:0,duration:.35,ease:"power2.out"}},{start:.3f});')
        else:
            transition.append(f'tl.fromTo("#iris",{{opacity:0,scale:1.4}},{{opacity:1,scale:.2,duration:.20,ease:"power4.in"}},{tt:.3f});tl.to("#iris",{{opacity:0,duration:.3,ease:"power3.out"}},{start:.3f});')
    doc=f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>O Mágico e o Fogo — Cinema de sombras</title>
<style>
*{{box-sizing:border-box}}html,body{{margin:0;background:#10191c;overflow:hidden}}
#root{{position:relative;width:1920px;height:1080px;background:#23342f;isolation:isolate;overflow:hidden}}
#fx-host{{position:absolute;inset:0;z-index:30;pointer-events:none}}
#iris{{position:absolute;top:50%;left:50%;width:180px;height:180px;border-radius:50%;transform:translate(-50%,-50%);opacity:0;background:radial-gradient(circle,#f1b85d 0%,#a36c41 52%,#151d20 83%);filter:blur(4px)}}
#flash{{position:absolute;inset:0;opacity:0;background:linear-gradient(105deg,#e9b45f,#a34830)}}
</style>
<script src="assets/gsap.min.js"></script></head><body><div id="root" data-composition-id="sonhador" data-start="0" data-duration="{total}" data-width="1920" data-height="1080" data-motion-blur="on" data-motion-blur-shutter="180">
{''.join(hosts)}
</div><script>window.__timelines=window.__timelines||{{}};const tl=gsap.timeline({{paused:true}});{''.join(transition)}window.__timelines["sonhador"]=tl;</script></body></html>'''
    (DIR/"index.html").write_text(doc,encoding="utf8")
    lines=["WEBVTT",""]
    for i,((slug,stage,title,spoken),d) in enumerate(zip(SCENES,durations)):
        begin=starts[i];end=begin+d-1.0
        def stamp(v):
            h=int(v//3600);m=int(v%3600//60);s=int(v%60);ms=int((v-int(v))*1000)
            return f"{h:02}:{m:02}:{s:02}.{ms:03}"
        lines.extend([f"{stamp(begin)} --> {stamp(end)}",spoken,""])
    (DIR/"legendas.vtt").write_text("\n".join(lines),encoding="utf8")
    return {"duration":total,"scene_starts":starts,"scenes":len(SCENES)}
if __name__=="__main__":
    print(build([9]*len(SCENES)))
