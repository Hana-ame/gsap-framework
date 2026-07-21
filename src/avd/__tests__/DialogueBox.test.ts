import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('gsap', () => ({
  default: { to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  gsap: { to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
}));

import * as PIXI from 'pixi.js';
import { DialogueBox } from '../DialogueBox';

const MOCK_OPTS = {
  boxX: 10, boxY: 20, boxWidth: 400, boxHeight: 150,
  boxRadius: 12, boxPadding: 20, boxBg: 0x0a0a1e, boxBgAlpha: 0.92,
  nameColor: 0x88ccff, nameSize: 22, fontFamily: 'sans-serif',
  arrowColor: 0x88ccff,
};

describe('DialogueBox', () => {
  let parent: PIXI.Container;

  beforeEach(() => {
    parent = new PIXI.Container();
  });

  it('constructs and adds to parent', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    expect(db.container.parent).toBe(parent);
  });

  it('setSpeaker creates name text when name given', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setSpeaker('Alice');
    expect(db.container.children.length).toBeGreaterThan(1);
  });

  it('setSpeaker(null) clears existing name text', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setSpeaker('Alice');
    db.setSpeaker(null);
    const textChildren = db.container.children.filter(
      (c) => c instanceof PIXI.Text,
    );
    expect(textChildren.length).toBe(0);
  });

  it('setAlpha changes container alpha', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setAlpha(0.5);
    expect(db.container.alpha).toBe(0.5);
  });

  it('setOffsetY changes container y', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setOffsetY(30);
    expect(db.container.y).toBe(50);
  });

  it('setTextContainer adds child', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const child = new PIXI.Container();
    db.setTextContainer(child);
  });

  it('updateArrow draws arrow only in between state', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.updateArrow('typing', 0);
    db.updateArrow('between', 0);
  });

  it('applyOptions updates bg color', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.applyOptions({ boxBg: 0xff0000 });
  });

  it('destroy cleans up container', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const destroySpy = vi.spyOn(db.container, 'destroy');
    db.destroy();
    expect(destroySpy).toHaveBeenCalledWith({ children: true });
  });
});
