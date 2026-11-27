#!/bin/bash
# Voice only (fk-reel default: no music): gain to -14 LUFS + limiter at -1.5 dBTP, mux, H.264 final + 720p phone copy.
set -e; cd "$(dirname "$0")"
ffmpeg -v error -y -i vo/vo.wav -af "pan=stereo|c0=c0|c1=c0" vo/vo_st.wav
I=$(ffmpeg -hide_banner -i vo/vo_st.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14.0-($I)+0.1,2))")
F="volume=${G}dB,alimiter=limit=0.84:level=false"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 render.mp4)
ffmpeg -v error -y -i vo/vo_st.wav -af "$F,apad" -t "$DUR" -ar 48000 -c:a aac -b:a 192k mix.m4a
ffmpeg -v error -y -i render.mp4 -i mix.m4a -map 0:v -map 1:a -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -g 30 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a copy -movflags +faststart -shortest final.mp4
ffmpeg -v error -y -i final.mp4 -c:v libx264 -preset slow -crf 26 -vf scale=720:1280 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart final_phone.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
ls -la final.mp4 final_phone.mp4
