"""Batch upload H-scene images from E-Hentai gallery to p.sda1.dev."""
import pickle, requests, sys, time, re, os, json

COOKIE_FILE = '/home/lumin/Hana-ame/moonchan_cookies.txt'
GALLERY_ID = '3631029'
BASE = 'https://ex.moonchan.xyz'

tokens = [
    '13b781ead8','dc9613d148','0a5bcc761a','af4e6ed741','c75093a667',
    'c1491b9616','4dd8df8987','e36c56dcfd','02e1207368','0f580b0d53',
    '1c9ac39ec7','87276f0df2','f1d9d6d691','32b52670c4','2c47bd60e2',
    '10adf89f2b','8a54ffc5e6','0cb53a175e','3b41b81641','9fb81f336b',
    '277d0ecac4','a13139c517','7d1a837940','9bb900a41a','a21414e238',
    '39a3de7a28','1533e41a81','2857f8673c','3195d12602','f75b650daf',
    '3fcb2c376a','944f484a0e','a0255a7e7a','d00c790032','8f7063ec2d',
    '289f3fa693','0deaa49e4a','40030a081a','16ea759a5e','eac37e7c65',
    '045c6e3728','7baaad46a9','a554792d8d','ef9e03bc0a','01bee094d2',
    'cdf14c8109','ebcb37fd5a','8d765924a1','2d5cada725','b06c917973',
    'b37824e07d','22ae110a67','0b52d35906','a76f9cfe25','93fb64fe93',
    '1c02dcab08','3fc7677979','78c833d084','b122c8a2ba','02260d435b',
    '0f69954bab','947e28bf6c','dd332b2f57','73283a9d71','1d15041ed9',
    'b43e8b40cd','1b65b9d7f9','1d19bc7de4','2a21f4f0e7','49b8a87abe',
    '701fc59364','6fdf522b19','9f9ea94b5e','963b8ff326','7b1600df4a',
    '047baf0014','a06bbd149b','d3094a726d','499603d7d2','6893e76b59',
    '49080bd0b1','bc03e53e15','04ebff8783','7c68e095f3','ad3a3bbab3',
    'a9c5cbf61e','a3e2286c7b','5fc2b10d5d','5dcfd26749','d33dd1330f',
    'f3319b6bc2','f7da9341ec','2d9af99584','64fda42b4d','242c17b857',
    '4f82d87a18','4273c119ca','15a3b7d2bb','4302397f15','acc2d7e36a',
    '122d5e313f','a6c311a505','c3e66c03fd','b7d894de07','ac69bf9bf0',
    '06246ae989','de3b77a887','0a1f42c2cb','37d93d9ac0','ec99806176',
    'b2c84757b0','dda51f38ed','fa2980f542','1f675aa53a','fc382888b0',
    'ba9d25c15a','4e2a6f3870','f8c14dac5c','871f437378','2a3e6bad62',
    'f4f2863867','8ca7420351','cb2d51e86c','cb12c63de5','fde13da668',
    'e734c4182f','775511cb33','1176c5be5d','875454f691','28cddb5456',
    '7bb53ddaf2','560362909c','b46d40eba5','3b164676f3','5be911eaee',
    'c44cf8f45c','391e0590f6','7e0048637e','7038da03f6','66c3d91486',
    'c7b9e7950c','b70b915de7','1f88d31b08','948f4123bb','53a5dcaec2',
    '5a1e551e6e','67d8513fa8','33229f67ea','abf7c0f13e','b59805d336',
    '94866d0e64','1bbe71da76','97454eb004','cbb28d040b','a8ac77e5e9',
    'c89fa48ac9','97ec9819b5','b71f6d9016','988b90e7e5','5515ad763e',
    '028680f21a','c5f439819e','371fbfa41f','62c07a8898','dc8a9d070e',
]

def build_filenames():
    fnames = []
    fnames.extend(['title', 'title2', 'title3', 'title4'])
    for i in range(1, 4): fnames.append(f'T1-{i}')
    for i in range(1, 6): fnames.append(f'T3-{i}')
    for i in range(0, 5): fnames.append(f'T21-{i}')
    for i in range(0, 5): fnames.append(f'T22-{i}')
    for i in range(1, 25): fnames.append(f'HA1-{i}')
    for i in range(1, 9): fnames.append(f'HA2-{i}')
    for i in range(1, 13): fnames.append(f'HB1-{i}')
    for i in range(1, 20): fnames.append(f'HC1-{i}')
    for i in range(1, 13): fnames.append(f'HD1-{i}')
    for i in range(1, 8): fnames.append(f'HD2-{i}')
    for i in range(1, 15): fnames.append(f'HE1-{i}')
    for i in range(1, 7): fnames.append(f'HE2-{i}')
    for i in range(1, 8): fnames.append(f'HF1-{i}')
    for i in range(1, 6): fnames.append(f'HG1-{i}')
    for i in range(1, 30): fnames.append(f'extra-{i}')
    return fnames

TARGET_FILES = [
    'title', 'title2', 'title3', 'title4',
    'T1-1', 'T1-2', 'T1-3',
    'T3-1', 'T3-2', 'T3-3', 'T3-4', 'T3-5',
    'T21-0', 'T21-1', 'T21-2', 'T21-3', 'T21-4',
    'T22-0', 'T22-1', 'T22-2', 'T22-3', 'T22-4',
    'HD2-1', 'HD2-2', 'HD2-3', 'HD2-4', 'HD2-5', 'HD2-6', 'HD2-7',
    'HE1-1', 'HE1-2', 'HE1-3', 'HE1-4', 'HE1-5', 'HE1-6', 'HE1-7',
    'HE1-8', 'HE1-9', 'HE1-10', 'HE1-11', 'HE1-12', 'HE1-13', 'HE1-14',
    'HE2-1', 'HE2-2', 'HE2-3', 'HE2-4', 'HE2-5', 'HE2-6',
    'HF1-1', 'HF1-2', 'HF1-3', 'HF1-4', 'HF1-5', 'HF1-6', 'HF1-7',
    'HG1-1', 'HG1-2', 'HG1-3', 'HG1-4', 'HG1-5',
]

def load_cookies(s):
    with open(COOKIE_FILE, 'rb') as f:
        cookies = pickle.load(f)
    for c in cookies:
        s.cookies.set(c.name, c.value, domain=c.domain, path=c.path)

def main():
    all_fnames = build_filenames()
    name_to_index = {name: idx for idx, name in enumerate(all_fnames)}
    
    to_upload = list(dict.fromkeys(TARGET_FILES))
    print(f"Target files: {len(to_upload)}")
    
    s = requests.Session()
    load_cookies(s)
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    
    results = {}
    
    for fname in to_upload:
        idx = name_to_index.get(fname)
        if idx is None or idx >= len(tokens):
            print(f"  SKIP {fname}: no mapping")
            results[fname] = None
            continue
        
        token = tokens[idx]
        page_num = idx + 1
        page_url = f'{BASE}/s/{token}/{GALLERY_ID}-{page_num}'
        
        print(f"[{idx:3d}] {fname} → page {page_num}", end=' ')
        
        try:
            r = s.get(page_url, timeout=30,
                      headers={'Referer': f'{BASE}/g/{GALLERY_ID}/8a2a08b248/'})
            if r.status_code != 200:
                print(f"FAIL: HTTP {r.status_code}")
                results[fname] = None
                continue
            
            # Find the hath.network image URL
            img_urls = re.findall(r'(https?://[^\s<>"\']+hath\.network:\d+[^"\']+)', r.text)
            if not img_urls:
                print("no image URL in page")
                results[fname] = None
                continue
            
            img_url = img_urls[0]
            
            # Download image
            h2 = {'Referer': page_url, 'User-Agent': s.headers['User-Agent']}
            img_r = s.get(img_url, headers=h2, timeout=60)
            if img_r.status_code != 200:
                print(f"download FAIL: HTTP {img_r.status_code}")
                results[fname] = None
                continue
            
            # Upload to p.sda1.dev
            ext = 'jpg' if '.jpg' in img_url else 'png'
            upload_r = requests.post(
                f'https://p.sda1.dev/api/v1/upload_external_noform?filename={fname}.{ext}',
                files={'image': (f'{fname}.{ext}', img_r.content, f'image/{ext}')},
                timeout=60
            )
            
            if upload_r.status_code == 200:
                data = upload_r.json()
                url = data['data']['url']
                print(f"OK → {url}")
                results[fname] = url
            else:
                print(f"upload FAIL: HTTP {upload_r.status_code}")
                results[fname] = None
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"ERROR: {e}")
            results[fname] = None
    
    # Summary
    print("\n\n============ RESULTS ============")
    success = {k: v for k, v in results.items() if v}
    failed = [k for k, v in results.items() if v is None]
    print(f"Success: {len(success)}, Failed: {len(failed)}")
    
    # Save mapping
    with open('/home/lumin/Hana-ame/image_urls.json', 'w') as f:
        json.dump(success, f, indent=2)
    print(f"\nSaved {len(success)} URLs to image_urls.json")
    
    print("\nURL map:\n")
    for name, url in success.items():
        print(f"  '{name}': '{url}',")

if __name__ == '__main__':
    main()
