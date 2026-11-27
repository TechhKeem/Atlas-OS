#!/bin/bash
# parallel download of pending library videos (Drive "anyone with link")
cd "$(dirname "$0")/raw"
cat /tmp/claude-0/-workspace-Atlas-OS/ade95c94-58be-5bab-81a3-4ee350e7f307/scratchpad/pending.tsv | xargs -P 6 -L 1 bash -c 'id=$0; name=$1; out="${id}__${name}"; [ -s "$out" ] || curl -sL --retry 3 -o "$out" "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"; echo "$(stat -c %s "$out") $name"'
