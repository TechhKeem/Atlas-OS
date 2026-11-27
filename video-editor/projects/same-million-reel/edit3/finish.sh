#!/bin/bash
# The render already mixes voice + natural clip audio. Normalise to -14 LUFS (gain + limiter), mux, final + phone copy.
set -e; cd "$(dirname "$0")"
ffmpeg -v error -y -i render.mp4 -vn -ac 2 -ar 48000 mix_pre.wav
I=$(ffmpeg -hide_banner -i mix_pre.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14.0-($I)+0.1,2))")
ffmpeg -v error -y -i mix_pre.wav -af "volume=${G}dB,alimiter=limit=0.84:level=false" -c:a aac -b:a 192k mix.m4a
ffmpeg -v error -y -i render.mp4 -i mix.m4a -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -g 30 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a copy -movflags +faststart -shortest final.mp4
ffmpeg -v error -y -i final.mp4 -c:v libx264 -preset slow -crf 26 -vf scale=720:1280 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart final_phone.mp4
ffmpeg -hide_banner -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
ls -la final.mp4 final_phone.mp4
