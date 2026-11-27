#!/bin/bash
# Final mix: VO + lo-fi bed (sidechain-ducked under the voice), two-pass loudnorm to -14 LUFS, limiter.
set -e; cd "$(dirname "$0")"
ffmpeg -v error -y -i vo/vo.wav -i music_raw.wav -filter_complex \
 "[1]atrim=0:44.5,afade=t=in:d=0.4,afade=t=out:st=42:d=2.5,volume=0.32,aformat=channel_layouts=stereo[m];\
  [0]atrim=0:44.5,acompressor=threshold=0.1:ratio=3:attack=5:release=120,aformat=channel_layouts=stereo,asplit[v][sc];\
  [m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];\
  [v][md]amix=inputs=2:normalize=0,alimiter=limit=0.79[o]" -map "[o]" -ar 48000 mix_pre.wav
J=$(ffmpeg -hide_banner -i mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
F=$(python3 -c "import json,sys;j=json.loads(sys.argv[1]);print('loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true'%(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'],j['target_offset']))" "$J")
ffmpeg -v error -y -i mix_pre.wav -af "$F" -ar 48000 -c:a aac -b:a 192k mix.m4a
ffmpeg -hide_banner -i mix.m4a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
