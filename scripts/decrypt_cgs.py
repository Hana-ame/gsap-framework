import json
from pathlib import Path

GAME_DIR = Path("/mnt/c/Users/lumin/Downloads/otomi-games.com_1N3M2UKO/堎悽奅桬幰")
PICS_DIR = GAME_DIR / "img/pictures"
OUT_DIR = Path("public/game-cgs")

# Encryption key (hex decoded)
KEY = bytes.fromhex("d41d8cd98f00b204e9800998ecf8427e")


def decrypt_png(data: bytes) -> bytes:
    body = bytearray(data[16:])
    for i in range(min(16, len(body))):
        body[i] ^= KEY[i % len(KEY)]
    return bytes(body)


def main():
    # Collect all H-scene CG filenames from CommonEvents.json
    with open(GAME_DIR / "data/CommonEvents.json", "r") as f:
        common_events = json.load(f)

    referenced = set()
    for ev in common_events:
        if not ev or not isinstance(ev, dict):
            continue
        lst = ev.get("list", [])
        if not lst:
            continue
        for line in lst:
            if not isinstance(line, dict):
                continue
            if line.get("code") == 231:
                params = line.get("parameters", [])
                if len(params) >= 2:
                    name = str(params[1])
                    if not name.startswith("$"):
                        referenced.add(name)

    ref_sorted = sorted(referenced)
    print(f"Total H-scene CGs referenced: {len(ref_sorted)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    ok = 0
    fail = 0
    for name in ref_sorted:
        src = PICS_DIR / f"{name}.png_"
        dst = OUT_DIR / f"{name}.png"
        if not src.exists():
            print(f"  MISSING: {src.name}")
            fail += 1
            continue
        with open(src, "rb") as f:
            raw = f.read()
        decrypted = decrypt_png(raw)
        with open(dst, "wb") as f:
            f.write(decrypted)
        print(f"  OK: {name}.png ({len(raw)} -> {len(decrypted)} bytes)")
        ok += 1

    print(f"\nDone: {ok} decrypted, {fail} missing")


if __name__ == "__main__":
    main()
