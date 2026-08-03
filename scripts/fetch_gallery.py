#!/usr/bin/env python3
"""抓取 ex.moonchan.xyz gallery 全部图片：文件名 -> URL。
用法: python3 fetch_gallery.py <gid> <token> <out.json> [total_pages]
"""
import json, re, sys, time, urllib.request

def fetch(url, headers):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

gid, token, out = sys.argv[1], sys.argv[2], sys.argv[3]
pages = int(sys.argv[4]) if len(sys.argv) > 4 else 9
BASE = "https://ex.moonchan.xyz"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    "Referer": f"{BASE}/g/{gid}/{token}/",
}
THUMB = re.compile(r'<a href="(/s/[a-f0-9]+/' + gid + r'-(\d+))"><div title="Page \d+: ([^"]+)"')
files = {}
for p in range(pages):
    url = f"{BASE}/g/{gid}/{token}/" + (f"?p={p}" if p > 0 else "")
    html = fetch(url, HEADERS)
    for path, num, fname in THUMB.findall(html):
        files[fname] = {"url": f"{BASE}{path}?redirect_to=image", "page": int(num)}
    time.sleep(0.6)
    print(f"page {p+1}: total {len(files)}", file=sys.stderr)
with open(out, "w", encoding="utf-8") as f:
    json.dump(files, f, ensure_ascii=False, indent=1)
print(f"done: {len(files)} files -> {out}", file=sys.stderr)
