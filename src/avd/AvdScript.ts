/** Parser and types for AVD script JSON (meta, lines, rosters). */
import type { AvdChoice, AvdLine, AvdRoster, AvdRosterMode, AvdPortraitPos, AvdTextSegment } from './types';

export interface AvdMetaJSON {
  width?: number;
  height?: number;
  boxWidth?: number;
  boxHeight?: number;
  boxX?: number;
  boxY?: number;
  textSize?: number;
  nameSize?: number;
  portraitMaxH?: number;
  portraitY?: number;
  typewriterSpeed?: number;
  textFadeMs?: number;
  portraitFadeMs?: number;
  boxEnterMs?: number;
  fontFamily?: string;
  rosterMode?: AvdRosterMode;
}

export interface AvdRosterEntryJSON {
  pos: AvdPortraitPos;
  textureKey: string;
  expressions?: Record<string, string>;
}

export type AvdTextSegmentJSON =
  | { kind: 'text'; text: string }
  | { kind: 'image'; textureKey: string; width?: number; height?: number };

export interface AvdChoiceJSON {
  text: string;
  targetLine?: number;
  targetSegment?: string;
  conditionFlag?: string;
  conditionNotFlag?: string;
}

export interface AvdLineJSON {
  speaker?: string;
  text?: string | AvdTextSegmentJSON[];
  portraitKey?: string;
  portraitPos?: AvdPortraitPos;
  expression?: string;
  bgKey?: string;
  bgmKey?: string;
  sfxKey?: string;
  voiceKey?: string;
  effect?: 'shake' | 'flash';
  choices?: AvdChoiceJSON[];
  segment?: string;
  end?: boolean;
}

export interface AvdScriptJSON {
  meta?: AvdMetaJSON;
  roster?: Record<string, AvdRosterEntryJSON>;
  lines: AvdLineJSON[];
}

export interface AvdAssetResolver {
  loadTexture(key: string): Promise<any>;
}

export interface AvdParsedScript {
  lines: AvdLine[];
  roster: AvdRoster;
  meta: AvdMetaJSON;
  rosterMode: AvdRosterMode;
}

export async function parseScript(
  json: AvdScriptJSON,
  resolver: AvdAssetResolver,
): Promise<AvdParsedScript> {
  const meta = json.meta ?? {};
  const rosterMode: AvdRosterMode = meta.rosterMode === 'persistent' ? 'persistent' : 'speaker-only';

  const keys = new Set<string>();
  for (const entry of Object.values(json.roster ?? {})) {
    keys.add(entry.textureKey);
  }
  for (const line of json.lines) {
    if (line.portraitKey) keys.add(line.portraitKey);
    if (line.bgKey) keys.add(line.bgKey);
    if (Array.isArray(line.text)) {
      for (const seg of line.text) {
        if (seg.kind === 'image') keys.add(seg.textureKey);
      }
    }
  }

  const textureMap = new Map<string, any>();
  await Promise.all(
    Array.from(keys).map(async (k) => {
      const tex = await resolver.loadTexture(k);
      textureMap.set(k, tex);
    }),
  );

  const roster: AvdRoster = {};
  for (const [name, entry] of Object.entries(json.roster ?? {})) {
    const expressions: Record<string, any> | undefined = entry.expressions
      ? Object.fromEntries(
          Object.entries(entry.expressions).map(([k, v]) => [k, textureMap.get(v) ?? null]),
        )
      : undefined;
    roster[name] = {
      pos: entry.pos,
      texture: textureMap.get(entry.textureKey) ?? null,
      expressions,
    };
  }

  const lines: AvdLine[] = json.lines.map((line) => {
    let text: string | AvdTextSegment[];
    if (typeof line.text === 'string') {
      text = line.text;
    } else {
      text = line.text.map((seg) => {
        if (seg.kind === 'text') return { kind: 'text' as const, text: seg.text };
        return {
          kind: 'image' as const,
          texture: textureMap.get(seg.textureKey) ?? null,
          width: seg.width,
          height: seg.height,
        };
      });
    }
    const choices: AvdChoice[] | undefined = line.choices?.map((c) => {
      const out: AvdChoice = { text: c.text };
      if (c.targetSegment != null) out.targetSegment = c.targetSegment;
      if (c.targetLine != null) out.targetLine = c.targetLine;
      if (c.conditionFlag != null) out.conditionFlag = c.conditionFlag;
      if (c.conditionNotFlag != null) out.conditionNotFlag = c.conditionNotFlag;
      return out;
    });
    return {
      speaker: line.speaker,
      text,
      choices: choices?.length ? choices : undefined,
      portrait: line.portraitKey ? (textureMap.get(line.portraitKey) ?? null) : undefined,
      portraitPos: line.portraitPos,
      expression: line.expression,
      bg: line.bgKey ? (textureMap.get(line.bgKey) ?? null) : undefined,
      bgKey: line.bgKey ?? null,
      bgmKey: line.bgmKey,
      sfxKey: line.sfxKey,
      voiceKey: line.voiceKey,
      effect: line.effect,
      segment: line.segment,
      end: line.end,
    };
  });

  return { lines, roster, meta, rosterMode };
}
