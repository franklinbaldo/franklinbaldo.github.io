#!/usr/bin/env sh
# Uso: tools/stills.sh Cena1 60,250,640 → out/stills/Cena1.png (mosaico 3 colunas)
set -eu
comp=$1; frames=$2
rm -rf out/stills/$comp && mkdir -p out/stills/$comp
for f in $(echo $frames | tr ',' ' '); do
  npx remotion still $comp out/stills/$comp/$(printf %05d $f).png --frame=$f --scale=0.5 --log=error >/dev/null
done
n=$(ls out/stills/$comp | wc -l)
rows=$(( (n + 2) / 3 ))
ffmpeg -v error -y -pattern_type glob -i "out/stills/$comp/*.png" -vf "drawtext=text='%{eif\:n\:d}':x=10:y=10:fontsize=24:fontcolor=white,tile=3x$rows:padding=6" -frames:v 1 out/stills/$comp.png
echo out/stills/$comp.png
