#!/usr/bin/env python3
"""
将三个 RMMZ 游戏的 H-scene 事件转换为新 VN 框架剧本 (VnScript)。

用法: python3 scripts/rmmz2vn.py
输出: src/vn/scenes/<prefix>_<evid>.ts (每个事件一个场景文件)

转换规则（同 WebGAL rmmz2webgal.py 的正确方法）：
  231 显示图片      -> pic_map 记录 + bg 指令（连续 231 压缩只留第一张）
  232 移动图片      -> 切到对应图（bg 指令）
  101/401 对话      -> say
  224 白闪          -> effect:'flash'
  102/402/403/404  -> choice + label
  111/411/412      -> 只保留 true 分支，跳过 else
  118 label / 119 jump -> label / jump
  117 切公共事件(10) -> end（清除画面）
  其它（音频/变量/脚本）-> 忽略
"""
import json, re, sys
from pathlib import Path

REPO = Path('/home/lumin/Hana-ame')
OUT = REPO / 'src/vn/scenes'

GAMES = [
    {
        'prefix': 'isekai',
        'name': '異世界戦争',
        'ce': '/mnt/c/Users/lumin/Downloads/otomi-games.com_1N3M2UKO/堎悽奅桬幰/data/CommonEvents.json',
        'cg': '/tmp/opencode/cg_isekai.json',
    },
    {
        'prefix': 'azusa',
        'name': '魔法少女アズサ',
        'ce': '/mnt/c/Users/lumin/Downloads/otomi-games.com_RX4HK2OG/杺朄彮彈傾僘僒/data/CommonEvents.json',
        'cg': '/tmp/opencode/cg_mahou.json',
    },
    {
        'prefix': 'iru',
        'name': 'イルと貧乳の国',
        'ce': '/mnt/c/Users/lumin/Downloads/otomi-games.com_KGB6FSSY0/RJ01353427/イルと貧乳の国/data/CommonEvents.json',
        'cg': '/tmp/opencode/cg_iru.json',
    },
]

def load_cg(path):
    raw = json.load(open(path, encoding='utf-8'))
    return {name: info['url'] for name, info in raw.items()}

def cg_url(cg_map, rmmz_name):
    """游戏图名(HA1-3 / HA1-3^ / '1') → gallery URL"""
    # 数字或字母命名的直接匹配，带 -/_ 转义的匹配 gallery 名
    for cand in (rmmz_name, rmmz_name.replace('-', '_'), rmmz_name.replace('-', '_').replace('^', ''),
                 rmmz_name + '.png', rmmz_name.replace('-', '_') + '.png'):
        if cand in cg_map:
            return cg_map[cand], cand
    return None, None

def convert_event(ev, cg_map, prefix):
    cmds = ev['list']
    out = []
    pic_map = {}
    labels = set()
    for c in cmds:
        if c['code'] == 118:
            labels.add(c['parameters'][0])

    i = 0
    while i < len(cmds):
        c = cmds[i]
        code = c['code']
        p = c['parameters']
        if code == 0:
            i += 1; continue
        elif code == 101:
            speaker = p[4] if len(p) > 4 else ''
            i += 1
            texts = []
            while i < len(cmds) and cmds[i]['code'] == 401:
                texts.append(cmds[i]['parameters'][0]); i += 1
            full = '\n'.join(texts)
            out.append({'type': 'say', 'speaker': speaker, 'text': full})
        elif code == 231:
            pid, name = p[0], p[1]
            pic_map[pid] = name
            url, _ = cg_url(cg_map, name)
            if url:
                # 连续 bg 压缩：只保留第一张（232 差分切换后续）
                if not (out and out[-1].get('type') == 'bg'):
                    out.append({'type': 'bg', 'key': name})
            i += 1
        elif code == 232:
            target = pic_map.get(p[0])
            if target:
                url, _ = cg_url(cg_map, target)
                if url and not (out and out[-1].get('type') == 'bg'):
                    out.append({'type': 'bg', 'key': target})
            i += 1
        elif code == 224:
            if len(p) >= 1 and p[0]:
                out.append({'type': 'say', 'speaker': '', 'text': '', 'effect': 'flash'})
            i += 1
        elif code == 102:
            choices_raw = [x for x in p[0] if x]
            seg_prefix = f"{prefix}_{ev['id']}"
            entries = []
            branch_bodies = {}
            j = i + 1
            while j < len(cmds):
                jc = cmds[j]
                if jc['code'] == 402:
                    idx = jc['parameters'][0]
                    entries.append((idx, jc['parameters'][1]))
                    branch_bodies[idx] = []
                    j += 1
                    while j < len(cmds) and cmds[j]['code'] not in (402, 403, 404, 0):
                        branch_bodies[idx].append(cmds[j]); j += 1
                    continue
                elif jc['code'] in (403, 404):
                    j += 1; continue
                elif jc['code'] == 0 and jc['indent'] <= c['indent']:
                    break
                else:
                    j += 1
            i = j
            out.append({'type': 'choice', 'options': [
                {'text': t, 'to': f"{seg_prefix}_c{idx}"} for idx, t in sorted(entries)
            ]})
            for idx, _ in sorted(entries):
                out.append({'type': 'label', 'name': f"{seg_prefix}_c{idx}"})
                for sub in convert_sub(branch_bodies.get(idx, []), cg_map):
                    out.append(sub)
        elif code == 111:
            i += 1
        elif code == 411:
            else_indent = c['indent']
            i += 1
            while i < len(cmds):
                ic = cmds[i]
                if ic['code'] == 412 and ic['indent'] <= else_indent:
                    break
                i += 1
            i += 1
        elif code in (412, 404, 403):
            i += 1
        elif code == 118:
            out.append({'type': 'label', 'name': p[0]})
            i += 1
        elif code == 119:
            target = p[0]
            if target in labels:
                out.append({'type': 'jump', 'to': target})
            i += 1
        elif code == 117:
            if p[0] == 10:
                out.append({'type': 'end'})
                # 后面可能还有收尾对话，不 break，继续
            i += 1
        elif code in (121, 122, 250, 241, 245, 246, 221, 222, 357, 355, 108, 408, 233, 234, 205, 212, 301, 351):
            i += 1
        else:
            i += 1
    return out

def convert_sub(cmds, cg_map):
    out = []
    pic_map = {}
    i = 0
    while i < len(cmds):
        c = cmds[i]; code = c['code']; p = c['parameters']
        if code == 101:
            speaker = p[4] if len(p) > 4 else ''
            i += 1
            texts = []
            while i < len(cmds) and cmds[i]['code'] == 401:
                texts.append(cmds[i]['parameters'][0]); i += 1
            out.append({'type': 'say', 'speaker': speaker, 'text': '\n'.join(texts)})
        elif code == 231:
            pid, name = p[0], p[1]
            pic_map[pid] = name
            url, _ = cg_url(cg_map, name)
            if url and not (out and out[-1].get('type') == 'bg'):
                out.append({'type': 'bg', 'key': name})
            i += 1
        elif code == 232:
            target = pic_map.get(p[0])
            if target:
                url, _ = cg_url(cg_map, target)
                if url and not (out and out[-1].get('type') == 'bg'):
                    out.append({'type': 'bg', 'key': target})
            i += 1
        else:
            i += 1
    return out

def sanitize_name(name):
    """事件名 → ASCII 场景名（取前缀字母数字，如 'HA11茶羅井敗北' -> HA11）"""
    m = re.match(r'([A-Za-z]+[0-9]*\.?[0-9]*)', name)
    return m.group(1) if m else ''

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for game in GAMES:
        common = json.load(open(game['ce'], encoding='utf-8'))
        cg_map = load_cg(game['cg'])
        events = [ev for ev in common if ev and any(c['code'] == 231 for c in ev.get('list', []))]
        for ev in sorted(events, key=lambda e: e['id']):
            lines = convert_event(ev, cg_map, game['prefix'])
            if not lines:
                continue
            # 收集 bg 用到的 key 生成 preload
            bg_keys = []
            for l in lines:
                if l.get('type') == 'bg':
                    bg_keys.append(l['key'])
            assets = []
            for k in dict.fromkeys(bg_keys):
                url, _ = cg_url(cg_map, k)
                if url:
                    assets.append({'key': k, 'url': url})
            # say 里空文本且非 end/choice 的过滤（flash 占位有 effect，保留）
            clean = []
            for l in lines:
                if l.get('type') == 'say' and not l.get('text') and not l.get('effect'):
                    continue
                clean.append(l)
            all_lines = [{'type': 'preload', 'wait': True, 'assets': assets}] + clean
            base = sanitize_name(ev['name']) or f"ev{ev['id']}"
            fname = f"{game['prefix']}_{base}_{ev['id']}"
            code = f"import type {{ VnScript }} from '../types';\n\nexport const {fname}: VnScript = {{\n  meta: {{ strictLoad: true }},\n  lines: {json.dumps(all_lines, ensure_ascii=False, indent=1)},\n}};\n"
            (OUT / f'{fname}.ts').write_text(code, encoding='utf-8')
            total += 1
            print(f"  {fname}.ts ({len(all_lines)} lines, {len(assets)} assets)", file=sys.stderr)
    print(f"done: {total} scenes", file=sys.stderr)

if __name__ == '__main__':
    main()
