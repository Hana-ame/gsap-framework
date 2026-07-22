#!/usr/bin/env python3
"""
Full re-porting tool for CommonEvents.json → scripts.ts _LINES arrays.
Extracts events, maps CG filenames to page numbers, and generates TypeScript _LINES exports.
"""
import json, re, sys
from pathlib import Path

CE_PATH = Path("/mnt/c/Users/lumin/Downloads/otomi-games.com_1N3M2UKO/堎悽奅桬幰/data/CommonEvents.json")
SCRIPTS_PATH = Path(__file__).parent.parent / "src/example/h-scenes/rj01222693/scripts.ts"

with open(CE_PATH, 'r', encoding='utf-8') as f:
    common = json.load(f)

# ── CG filename → page map ──
cg_set = set()
for ev in common:
    if ev is None: continue
    for cmd in ev.get('list', []):
        if cmd['code'] == 231:
            cg_set.add(cmd['parameters'][1])
cg_sorted = sorted(cg_set)
fn_to_page = {fn: i+1 for i, fn in enumerate(cg_sorted)}
print(f"CG count: {len(cg_sorted)}", file=sys.stderr)

# ── Event ID → export name mapping ──
EVENT_MAP = {
    13: "HA11_LINES", 14: "HA12_LINES", 16: "HB11_LINES", 19: "HB12_LINES",
    21: "T1_LINES", 22: "T2_LINES",
    25: "HA21_LINES", 26: "HA22_LINES", 27: "HA23_LINES", 28: "HA24_LINES",
    29: "HA25_LINES", 30: "HA26_LINES",
    34: "HB21_LINES", 35: "HB22_LINES", 36: "HB23_LINES", 37: "HB24_LINES",
    39: "T21_LINES", 40: "T22_LINES",
    44: "HC1_LINES", 45: "HC2_LINES",
    48: "T3_LINES",
    52: "HD1_LINES", 53: "HD2_LINES", 54: "HD3_LINES", 55: "HE1_LINES",
}

def parse_event(ev):
    """Parse CommonEvents.json event → list of AvdLineJSON dicts."""
    lines = []
    current_cg = None
    current_speaker = ""
    current_texts = []

    def flush():
        nonlocal current_texts
        if current_texts:
            for t in current_texts:
                d = {"speaker": current_speaker, "text": t}
                if current_cg is not None:
                    d["bgKey"] = str(current_cg)
                lines.append(d)
        current_texts = []

    for cmd in ev.get('list', []):
        c = cmd['code']
        if c == 0:
            flush()
            break
        if c == 231:
            flush()
            current_cg = fn_to_page[cmd['parameters'][1]]
        elif c == 101:
            flush()
            current_speaker = cmd['parameters'][4]
        elif c == 401:
            current_texts.append(cmd['parameters'][0])
        else:
            flush()
    return lines

def line_to_ts(d):
    """Convert a line dict to TypeScript object literal string."""
    parts = []
    for key, val in d.items():
        if key == 'end' and val == True:
            parts.append('end: true')
        else:
            parts.append(f'{key}: {json.dumps(val, ensure_ascii=False)}')
    return '{ ' + ', '.join(parts) + ' }'

def generate_export(ev, export_name):
    """Generate the full _LINES export for one event."""
    parsed = parse_event(ev)
    ts_lines = []
    ts_lines.append(f'export const {export_name}: AvdLineJSON[] = [')
    for l in parsed:
        ts_lines.append(f'  {line_to_ts(l)},')
    ts_lines.append("  { speaker: '', text: '— END —', end: true },")
    ts_lines.append('];')
    return '\n'.join(ts_lines)

# ── Compare each event against current scripts.ts ──
# Parse existing scripts.ts by converting TS to JSON-compatible format
with open(SCRIPTS_PATH, 'r', encoding='utf-8') as f:
    scripts_content = f.read()

def ts_literal_to_dict(ts_str):
    """Convert TypeScript object literal to Python dict."""
    s = ts_str.strip()
    if s.endswith(','):
        s = s[:-1]
    # Quote property names (word before colon)
    s = re.sub(r'(\b\w+)(?=\s*:)', r'"\1"', s)
    # Single quotes → double quotes
    s = s.replace("'", '"')
    try:
        return json.loads(s)
    except:
        return None

def parse_ts_export(name, content):
    """Extract and parse one _LINES export from TypeScript source."""
    pattern = re.compile(
        rf'export const {re.escape(name)}\s*:\s*AvdLineJSON\[\]\s*=\s*\[\n(.*?)\];',
        re.DOTALL
    )
    m = pattern.search(content)
    if not m:
        return None
    body = m.group(1)
    entries = []
    # Split by top-level commas (between objects)
    buf = ''
    depth = 0
    for ch in body:
        if ch == '{':
            depth += 1
            buf += ch
        elif ch == '}':
            depth -= 1
            buf += ch
        elif ch == ',' and depth == 0:
            if buf.strip():
                obj = ts_literal_to_dict(buf)
                if obj:
                    entries.append(obj)
            buf = ''
        else:
            buf += ch
    if buf.strip():
        obj = ts_literal_to_dict(buf)
        if obj:
            entries.append(obj)
    return entries

print("Comparing events...", file=sys.stderr)
total_diffs = 0

for eid, ename in sorted(EVENT_MAP.items()):
    ev = None
    for e in common:
        if e is not None and e['id'] == eid:
            ev = e
            break
    if ev is None:
        print(f"Event {eid}: {ename} — NOT FOUND", file=sys.stderr)
        continue

    fresh = parse_event(ev)
    existing = parse_ts_export(ename, scripts_content)

    if existing is None:
        print(f"\n{ename}: Could not parse from scripts.ts")
        continue

    diffs = []
    max_i = min(len(fresh), len(existing))
    for i in range(max_i):
        f = fresh[i]
        e = existing[i]
        if f.get('speaker','') != e.get('speaker',''):
            diffs.append(f"  L{i}: speaker {f.get('speaker','')!r} vs {e.get('speaker','')!r}")
        if f.get('text','') != e.get('text',''):
            diffs.append(f"  L{i}: text differs")
            diffs.append(f"    expected: {f.get('text','')[:50]}")
            diffs.append(f"    actual:   {e.get('text','')[:50]}")
        if f.get('bgKey') != e.get('bgKey'):
            diffs.append(f"  L{i}: bgKey {f.get('bgKey')} vs {e.get('bgKey')} (text: {f.get('text','')[:30]})")

    if len(fresh) != len(existing):
        diffs.append(f"  LENGTH: {len(fresh)} expected vs {len(existing)} actual")

    if diffs:
        total_diffs += 1
        print(f"\n{'='*60}")
        print(f"Event {eid}: {ename} ({ev.get('name','')}) — {len(diffs)} diff(s)")
        for d in diffs:
            print(d)
    else:
        print(f"Event {eid:2d}: {ename:15s} — OK ({len(fresh)} lines)")

print(f"\nTotal events with diffs: {total_diffs}")
