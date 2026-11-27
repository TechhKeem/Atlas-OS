#!/bin/bash
# Voice only (fk-reel default: no music): two-pass loudnorm -14 LUFS / -1.5 dBTP, mux, H.264 final + 720p phone copy.
set -e; cd "$(dirname "$0")"
J=$(ffmpeg -hide_banner -i vo/vo.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
F=$(python3 -c "import json,sys;j=json.loads(sys.argv[1]);print('loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true'%(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'],j['target_offset']))" "$J")
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 render.mp4)
ffmpeg -v error -y -i vo/vo.wav -af "$F,apad" -t "$DUR" -ar 48000 -ac 2 -c:a aac -b:a 192k mix.m4a
ffmpeg -v error -y -i render.mp4 -i mix.m4a -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -g 30 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a copy -movflags +faststart -shortest final.mp4
ffmpeg -v error -y -i final.mp4 -c:v libx264 -preset slow -crf 26 -vf scale=720:1280 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart final_phone.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
ls -la final.mp4 final_phone.mp4
