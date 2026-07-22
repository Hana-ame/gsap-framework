#!/usr/bin/env python3
"""
Regenerate scripts.ts from CommonEvents.json.
Extracts H-scene events, maps CG to page numbers, handles choice/branch blocks.
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
print(f"CG count: {len(cg_sorted)}", file=sys.stderr)

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

# ── Parser ──
class LineAccum:
    """Accumulates text lines with current CG and speaker context."""
    def __init__(self):
        self.current_cg = None
        self.current_speaker = ""
        self.texts = []
        self.out = []
    def flush(self):
        if self.texts:
            for t in self.texts:
                d = {"speaker": self.current_speaker, "text": t}
                if self.current_cg is not None:
                    d["bgKey"] = str(self.current_cg)
                self.out.append(d)
        self.texts = []
    def add_text(self, text):
        self.texts.append(text)
    def set_speaker(self, s):
        self.flush()
        self.current_speaker = s
    def set_cg(self, page):
        self.flush()
        self.current_cg = page

def parse_text_commands(cmds, start_idx):
    """Parse text (101+401) from a list of commands starting at start_idx.
    Returns (lines_dicts, next_idx) where next_idx is the index after the text block."""
    acc = LineAccum()
    i = start_idx
    while i < len(cmds):
        cmd = cmds[i]
        c = cmd['code']
        if c == 101:
            acc.set_speaker(cmd['parameters'][4])
        elif c == 401:
            acc.add_text(cmd['parameters'][0])
        elif c == 0 or c == 231 or c == 102 or c == 402 or c == 403 or c == 404:
            break
        i += 1
    acc.flush()
    return acc.out, i

def parse_event(ev, name):
    """Parse one event into AvdLineJSON[]. Returns lines list."""
    cmds = ev.get('list', [])
    lines = []
    current_cg_page = None
    i = 0
    choice_nest = 0  # currently inside 402 branch

    while i < len(cmds):
        cmd = cmds[i]
        c = cmd['code']

        if c == 0:
            break

        elif c == 231:
            current_cg_page = cmd['parameters'][1]
            i += 1

        elif c == 101:
            text_lines, next_i = parse_text_commands(cmds, i)
            for tl in text_lines:
                if current_cg_page is not None and 'bgKey' not in tl:
                    tl['bgKey'] = current_cg_page
            lines.extend(text_lines)
            i = next_i

        elif c == 102:
            # Show Choices: collect branches from 402 blocks
            base_indent = cmd['indent']
            choices = []  # list of (idx, text)
            branches = {}  # idx → list of command dicts
            j = i + 1
            while j < len(cmds):
                jcmd = cmds[j]
                jc = jcmd['code']
                if jc == 402:
                    idx = jcmd['parameters'][0]
                    choices.append((idx, jcmd['parameters'][1]))
                    branches[idx] = []
                    j += 1
                    while j < len(cmds):
                        ncmd = cmds[j]
                        nc = ncmd['code']
                        if nc == 402 or nc == 404:
                            break
                        if nc == 0:
                            if ncmd['indent'] == base_indent:
                                j += 1
                                break
                            # code 0 at non-base indent is e.g. end of 122; skip it
                            j += 1
                            continue
                        branches[idx].append(ncmd)
                        j += 1
                    continue
                elif jc == 404 or jc == 0:
                    j += 1
                    break
                j += 1
            i = j

            # Generate choice line BEFORE branches so linear reading shows choice first
            choice_entries = []
            for ci, ct in sorted(choices, key=lambda x: x[0]):
                seg_name = f"{name}_{ci}"
                choice_entries.append({"text": ct, "targetSegment": seg_name})
            lines.append({"text": "選択", "choices": choice_entries})

            # Parse branches (user jumps here via targetSegment)
            for ci, _ in sorted(choices, key=lambda x: x[0]):
                seg_name = f"{name}_{ci}"
                lines.append({"segment": seg_name})
                acc = LineAccum()
                acc.current_cg = current_cg_page
                for bcmd in branches[ci]:
                    bc = bcmd['code']
                    if bc == 231:
                        acc.flush()
                        acc.current_cg = bcmd['parameters'][1]
                    elif bc == 101:
                        acc.flush()
                        acc.current_speaker = bcmd['parameters'][4]
                    elif bc == 401:
                        acc.add_text(bcmd['parameters'][0])
                acc.flush()
                lines.extend(acc.out)

        elif c in (402, 403, 404):
            # Already handled by 102 scanning
            i += 1

        else:
            # Skip other commands (221, 222, 241, 242, etc.)
            i += 1

    return lines

def line_to_ts(d):
    parts = []
    for key, val in d.items():
        if key == 'end' and val == True:
            parts.append('end: true')
        elif key == 'choices':
            cparts = []
            for c in val:
                cparts.append('{ ' + ', '.join(f'{k}: {json.dumps(v, ensure_ascii=False)}' for k, v in c.items()) + ' }')
            parts.append(f'choices: [{", ".join(cparts)}]')
        else:
            parts.append(f'{key}: {json.dumps(val, ensure_ascii=False)}')
    return '{ ' + ', '.join(parts) + ' }'

def generate_export_lines(ev, export_name):
    parsed = parse_event(ev, export_name)
    ts_lines = [f'export const {export_name}: AvdLineJSON[] = [']
    for l in parsed:
        ts_lines.append(f'  {line_to_ts(l)},')
    ts_lines.append("  { speaker: '', text: '— END —', end: true },")
    ts_lines.append('];')
    return ts_lines

# ── Generate all ──
all_lines = []
all_lines.append("import type { AvdLineJSON } from '../../../components';")
all_lines.append("")

for eid, ename in sorted(EVENT_MAP.items()):
    ev = None
    for e in common:
        if e is not None and e['id'] == eid:
            ev = e
            break
    if ev is None:
        print(f"Event {eid}: {ename} — NOT FOUND", file=sys.stderr)
        continue
    print(f"Generating {ename} (event {eid}: {ev.get('name','')})...", file=sys.stderr)
    export = generate_export_lines(ev, ename)
    all_lines.extend(export)
    all_lines.append("")

# Write
output = '\n'.join(all_lines) + '\n'
with open(SCRIPTS_PATH, 'w', encoding='utf-8') as f:
    f.write(output)
print(f"Written to {SCRIPTS_PATH}", file=sys.stderr)
print(f"Total lines: {output.count(chr(10))}")
