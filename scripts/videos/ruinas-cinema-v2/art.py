"""Procedural storybook theatre for HyperFrames.
All geometry is original. Scene elements are designed to move on separate planes.
"""
import math, random
from html import escape

W,H=1920,1080
def twig(x,y,reach,seed,shade):
    r=random.Random(seed)
    parts=[f'<path d="M{x} 1120 Q{x+reach*.3:.0f} {y+200:.0f} {x+reach:.0f} {y:.0f}" stroke="{shade}" stroke-width="{int(22+r.random()*35)}" fill="none" stroke-linecap="round"/>']
    bx=x+reach
    for j in range(9):
        a=j*2.38
        xx=bx+math.cos(a)*(110+24*j)
        yy=y+math.sin(a)*(65+20*j)-j*13
        parts.append(f'<path d="M{bx:.0f} {y:.0f} Q{xx-75:.0f} {yy+60:.0f} {xx:.0f} {yy:.0f}" fill="none" stroke="{shade}" stroke-width="{max(4,17-j)}" stroke-linecap="round"/>')
        for k in range(7):
            theta=k*6.28/7
            lx=xx+math.cos(theta)*29
            ly=yy+math.sin(theta)*21
            parts.append(f'<ellipse cx="{lx:.0f}" cy="{ly:.0f}" rx="{12+r.randrange(7)}" ry="{5+r.randrange(5)}" transform="rotate({int(theta*180/math.pi)} {lx:.0f} {ly:.0f})" fill="{shade}"/>')
    return ''.join(parts)
def inkgrain(seed, n=120):
    r=random.Random(seed)
    return ''.join(f'<path d="M{r.randrange(W)} {r.randrange(H)}l{r.randrange(5,23)} {r.randrange(-7,7)}" opacity="{r.uniform(.05,.18):.2f}" stroke="#f8db9e" stroke-width="{r.choice([1,2])}"/>' for _ in range(n))
def stone_circle(seed, cx=960,cy=750, sx=720, sy=120):
    r=random.Random(seed)
    out=[f'<ellipse cx="{cx}" cy="{cy+10}" rx="{sx}" ry="{sy}" fill="none" stroke="#bfae91" stroke-width="45" opacity=".37"/>']
    for i in range(16):
        a=2*math.pi*i/16
        x=cx+sx*math.cos(a);y=cy+sy*math.sin(a)
        wd=r.randrange(68,114);ht=r.randrange(100,190)
        out.append(f'<path d="M{x-wd/2:.0f} {y:.0f} l{r.randint(-15,15)} {-ht} l{wd*.55:.0f} {-r.randrange(12,42)} l{wd*.58:.0f} {ht+r.randrange(20,52)} Z" fill="#687c74" stroke="#bcb8a1" stroke-width="7" opacity="{.66+.13*math.sin(a):.2f}"/>')
    return "".join(out)
def mago(x=880,y=450,s=1):
    return f'''<g transform="translate({x} {y}) scale({s})">
    <path d="M-85 270 Q-71 66 -45 10 Q0 -35 45 10 Q80 65 105 270 L60 315 L-48 315Z" fill="#27332c" stroke="#9d8a77" stroke-width="8"/>
    <path d="M-57 62 Q-21 -32 0 -64 Q46 -32 59 62 Q25 6 0 5 Q-23 7 -57 62" fill="#1d2423" stroke="#a29a85" stroke-width="7"/>
    <ellipse cx="0" cy="34" rx="40" ry="53" fill="#b99979"/>
    <path d="M-27 21Q0 -8 28 20 M-25 63Q0 87 25 63" fill="none" stroke="#292727" stroke-width="9"/>
    <path d="M-49 120 Q-114 196 -131 215 M60 108 Q93 159 142 170" fill="none" stroke="#534c43" stroke-width="31" stroke-linecap="round"/>
    <path d="M-2 110 Q-24 175 6 244" fill="none" stroke="#a28e72" stroke-width="10"/>
    </g>'''
def menino(x=1170,y=565,s=1):
    return f'''<g transform="translate({x} {y}) scale({s})">
    <path d="M-44 -42 Q-25 -92 18 -86 Q70 -76 54 -20 L53 11 L-43 13Z" fill="#40372d"/>
    <ellipse cx="5" cy="-11" rx="49" ry="59" fill="#b18a62"/>
    <path d="M-23 -25 Q-8 -32 3 -24 M27 -24Q42 -31 52 -23" stroke="#332e26" stroke-width="8" fill="none"/>
    <path d="M-47 68 Q8 35 62 73 L88 256 L-67 256Z" fill="#9f8558" stroke="#e0bb82" stroke-width="9"/>
    <path d="M-38 102 Q-83 161 -120 176 M60 103 Q116 154 120 168" stroke="#ad835e" stroke-width="32" fill="none" stroke-linecap="round"/>
    <path d="M-25 255 L-53 340 M55 255 L69 340" stroke="#322e29" stroke-width="34" stroke-linecap="round"/>
    </g>'''
def flames():
    r=random.Random(91)
    ss=[]
    for i in range(24):
        x=190+i*69
        h=r.randrange(250,610)
        tip=x+r.randrange(-160,170)
        col=["#c84e32","#ed943f","#f7c771","#ed6736"][i%4]
        ss.append(f'<path d="M{x-90} 1100 Q{x-128} {1030-h*.7:.0f} {tip} {1100-h} Q{x-20} {1000-h*.35:.0f} {x+84} 1100Z" fill="{col}" opacity="{.4+i%4*.12:.2f}"/>')
    return "".join(ss)
def night(stage):
    if stage in ("fire","inferno","touch"): return ("#7b3829","#160e16","#d79543")
    if stage in ("awake","departure"): return ("#c2a675","#4e664c","#e2caa0")
    if stage in ("dream","heart","revelation","recursive"): return ("#3f4f5a","#17252d","#dfb76b")
    return ("#657f83","#13242a","#c6a88b")
def image(stage, seed):
    top,bottom,accent=night(stage)
    r=random.Random(seed)
    defs=f'''<defs>
    <linearGradient id="sky" x2="0" y2="1"><stop stop-color="{top}"/><stop offset=".65" stop-color="{bottom}"/><stop offset="1" stop-color="#101c1d"/></linearGradient>
    <radialGradient id="moon"><stop stop-color="#fff2c9" stop-opacity=".95"/><stop offset=".3" stop-color="{accent}" stop-opacity=".7"/><stop offset="1" stop-color="{accent}" stop-opacity="0"/></radialGradient>
    <linearGradient id="water" x2="0" y2="1"><stop stop-color="#405f63"/><stop offset="1" stop-color="#162b30"/></linearGradient>
    <radialGradient id="ember"><stop stop-color="#fff6cb"/><stop offset=".36" stop-color="#f6c36c"/><stop offset="1" stop-color="#d65d29" stop-opacity=".1"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="24"/></filter>
    </defs>'''
    far=['<g id="far">',f'<rect width="{W}" height="{H}" fill="url(#sky)"/>']
    far.append('<circle cx="1440" cy="210" r="330" fill="url(#moon)" opacity=".6"/>')
    far.append(f'<circle cx="1440" cy="210" r="108" fill="{accent}" opacity=".76"/>')
    for i in range(75):
        x=r.randint(0,W);y=r.randint(0,650)
        far.append(f'<circle cx="{x}" cy="{y}" r="{r.choice([1,2,3])}" fill="#e8caa0" opacity="{r.uniform(.1,.48):.2f}"/>')
    far.append('<path d="M0 750 Q320 520 580 648 T1230 601 T1920 695 L1920 1080 H0Z" fill="#43665d" opacity=".63"/>')
    far.append('<path d="M0 840 Q260 690 580 760 T1100 732 T1920 820 L1920 1080 H0Z" fill="#1e3737" opacity=".79"/>')
    far.append('</g>')
    mid=['<g id="mid">']
    for i in range(9):
        x=(i*219+56)%W
        mid.append(twig(x, 300+r.randrange(240), (-1 if i%2 else 1)*r.randrange(90,210),seed+i,"#172d2e" if i%2 else "#244038"))
    mid.append('<ellipse cx="960" cy="820" rx="800" ry="220" fill="#ddd1a2" opacity=".12" filter="url(#blur)"/>')
    mid.append('</g>')
    front=['<g id="front">']
    if stage in ("river","arrival"):
        front.append('<path d="M0 810Q420 744 850 808T1920 780V1080H0Z" fill="url(#water)"/>')
        for i in range(33):
            x=r.randrange(W);y=790+r.randrange(290)
            front.append(f'<path d="M{x} {y} q40 -7 105 0" stroke="#b7baa2" opacity=".28" stroke-width="4" fill="none"/>')
        front.append('<g id="boat"><path d="M420 800 L930 800 Q850 948 525 892Z" fill="#302e27" stroke="#ad9372" stroke-width="10"/><path d="M645 798L645 456" stroke="#cbb48e" stroke-width="12"/><path d="M645 473Q818 570 645 715Z" fill="#d6b57e" opacity=".82"/>')
        front.append(mago(580,606,.5)+'</g>')
    else:
        front.append('<path d="M0 870Q460 780 940 838T1920 830V1080H0Z" fill="#233b33"/>')
        front.append('<g id="stones">'+stone_circle(seed)+'</g>')
        if stage in ("arrival","temple","dream","heart","body","fire","departure","legend","inferno","touch","revelation"):
            front.append(f'<g id="mago">{mago(730 if stage in ("departure","legend") else 940,530,.9)}</g>')
        if stage in ("awake","departure","legend","body","fire","revelation"):
            front.append(f'<g id="menino">{menino(1270 if stage in ("awake","departure") else 1240,615,.72)}</g>')
    if stage in ("heart","body","dream"):
        front.append(f'<g id="heart"><circle cx="1180" cy="400" r="160" fill="url(#ember)" opacity=".65"/><path d="M1180 485 C930 330 1080 218 1180 300 C1295 207 1430 335 1180 485Z" fill="#d47e55" stroke="#f8dfb0" stroke-width="16"/><path d="M1030 382H1130L1160 345L1192 413L1228 371H1318" stroke="#fff2c8" stroke-width="13" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>')
    if stage in ("fire","inferno","touch","revelation"):
        front.append(f'<g id="flames">{flames()}</g>')
    if stage=="recursive":
        front.append('<g id="portal">')
        for i in range(7):
            rr=700-i*95
            front.append(f'<ellipse cx="960" cy="540" rx="{rr}" ry="{rr*.65:.0f}" fill="none" stroke="{["#e3bb7f","#aa704d","#66867d"][i%3]}" stroke-width="{43-i*4}" opacity=".75"/>')
        front.append('<path d="M960 540L960 1080" stroke="#d7bf9b" stroke-width="2" opacity=".6"/>')
        front.append(f'<g id="echo">{mago(970,565,.58)}</g>')
        front.append('</g>')
    front.append(inkgrain(seed,140))
    front.append('</g>')
    return f'<svg class="world" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">{defs}{"".join(far)}{"".join(mid)}{"".join(front)}</svg>'
