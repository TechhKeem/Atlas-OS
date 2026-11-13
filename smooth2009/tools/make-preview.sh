#!/bin/sh
# Writes preview/site-body.html: site/index.html without the <html>, <head>, and <body> wrapper tags,
# for preview tools that wrap a page themselves. Edit only site/index.html; this output is rebuilt each time.
cd "$(dirname "$0")/.." && mkdir -p preview
sed -e '/^<!doctype/d' -e '/^<html/d' -e '/^<\/html>/d' -e '/^<head>$/d' -e '/^<\/head>$/d' \
    -e '/^<body>$/d' -e '/^<\/body>$/d' -e '/^<meta charset/d' -e '/^<meta name="viewport"/d' \
    site/index.html > preview/site-body.html
echo "wrote preview/site-body.html"
