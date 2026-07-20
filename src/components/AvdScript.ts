/** Script parser and runtime for ADV visual-novel commands and branching. */
import type { AvdLine, AvdRoster, AvdRosterMode } from './Avd';
import type { AvdPortraitPos } from './AvdPortraitLayer';
import type { AvdTextSegment } from './AvdInlineLayout';
import * as PIXI from 'pixi.js';

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
  [k: string]: unknown;
}

export interface AvdRosterEntryJSON {
  pos: AvdPortraitPos;
  textureKey: string;
  textureWidth?: number;
  textureHeight?: number;
}

export type AvdTextSegmentJSON =
  | { kind: 'text'; text: string }
  | { kind: 'image'; textureKey: string; width?: number; height?: number };

export interface AvdLineJSON {
  speaker?: string;
  text: string | AvdTextSegmentJSON[];
  portraitKey?: string;
  portraitPos?: AvdPortraitPos;
}

export interface AvdScriptJSON {
  meta?: AvdMetaJSON;
  roster?: Record<string, AvdRosterEntryJSON>;
  lines: AvdLineJSON[];
}

export interface AvdAssetResolver {
  loadTexture(key: string): Promise<PIXI.Texture>;
}

export interface AvdParsedScript {
  lines: AvdLine[];
  roster: AvdRoster;
  meta: AvdMetaJSON;
  rosterMode: AvdRosterMode;
}

export async function parseAvdScriptJSON(
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
    if (Array.isArray(line.text)) {
      for (const seg of line.text) {
        if (seg.kind === 'image') keys.add(seg.textureKey);
      }
    }
  }

  const textureMap = new Map<string, PIXI.Texture>();
  await Promise.all(
    Array.from(keys).map(async (k) => {
      const tex = await resolver.loadTexture(k);
      textureMap.set(k, tex);
    }),
  );

  const roster: AvdRoster = {};
  for (const [name, entry] of Object.entries(json.roster ?? {})) {
    roster[name] = {
      pos: entry.pos,
      texture: textureMap.get(entry.textureKey) ?? null,
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
          texture: textureMap.get(seg.textureKey) ?? PIXI.Texture.EMPTY,
          width: seg.width,
          height: seg.height,
        };
      });
    }
    return {
      speaker: line.speaker,
      text,
      portrait: line.portraitKey ? textureMap.get(line.portraitKey) ?? null : undefined,
      portraitPos: line.portraitPos,
    };
  });

  return { lines, roster, meta, rosterMode };
}
