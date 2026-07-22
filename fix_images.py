"""Re-upload all images as raw binary (fix multipart wrapping)."""
import requests, json, time

URLS_FILE = '/home/lumin/Hana-ame/image_urls.json'

with open(URLS_FILE) as f:
    urls = json.load(f)

fixed = {}
for i, (name, url) in enumerate(urls.items()):
    print(f"[{i+1}/{len(urls)}] {name}...", end=' ', flush=True)
    try:
        r = requests.get(url, timeout=30)
        body = r.content

        # Extract inner image from multipart if wrapped
        if body[:2] == b'--':
            parts = body.split(b'\r\n\r\n', 1)
            if len(parts) > 1:
                inner = parts[1].rsplit(b'\r\n--', 1)[0]
            else:
                print("bad multipart")
                fixed[name] = url
                continue
        else:
            inner = body

        # Determine extension from actual data
        if inner[:4] == b'RIFF':
            ext = 'webp'
        elif inner[:2] == b'\xff\xd8':
            ext = 'jpg'
        elif inner[:8] == b'\x89PNG\r\n\x1a\n':
            ext = 'png'
        elif inner[:6] == b'GIF89a' or inner[:6] == b'GIF87a':
            ext = 'gif'
        else:
            ext = 'jpg'

        # Re-upload as raw binary
        resp = requests.post(
            f'https://p.sda1.dev/api/v1/upload_external_noform?filename={name}.{ext}',
            data=inner,
            timeout=60
        )
        if resp.status_code == 200:
            new_url = resp.json()['data']['url']
            print(f"OK -> {new_url.split('/')[-1]}")
            fixed[name] = new_url
        else:
            print(f"FAIL {resp.status_code}")
            fixed[name] = url
    except Exception as e:
        print(f"ERROR {e}")
        fixed[name] = url
    time.sleep(0.2)

with open(URLS_FILE, 'w') as f:
    json.dump(fixed, f, indent=2)

print(f"\nDone. Fixed {len(fixed)} URLs.")
