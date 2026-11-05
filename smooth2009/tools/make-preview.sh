#!/bin/sh
# Writes preview/site-body.html: index.html without the <html>, <head>, and <body> wrapper tags,
# for tools that wrap a page themselves. index.html is the only file to edit; never edit the output.
cd "$(dirname "$0")/.." && mkdir -p preview
sed -e '/^<!doctype/d' -e '/^<html/d' -e '/^<\/html>/d' -e '/^<head>$/d' -e '/^<\/head>$/d' \
    -e '/^<body>$/d' -e '/^<\/body>$/d' -e '/^<meta charset/d' -e '/^<meta name="viewport"/d' \
    site/index.html > preview/site-body.html
echo "wrote preview/site-body.html"
