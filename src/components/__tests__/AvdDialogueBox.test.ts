import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../framework/gsap-pixi', () => ({
  gsap: { to: vi.fn(), killTweensOf: vi.fn(), registerPlugin: vi.fn() },
  PixiPlugin: { registerPIXI: vi.fn() },
}));

import * as PIXI from 'pixi.js';
import { DialogueBox } from '../AvdDialogueBox';

const MOCK_OPTS = {
  boxX: 10, boxY: 20, boxWidth: 400, boxHeight: 150,
  boxRadius: 12, boxPadding: 20, boxBg: 0x0a0a1e, boxBgAlpha: 0.92,
  textColor: 0xffffff, textSize: 20, fontFamily: 'sans-serif',
  nameColor: 0x88ccff, nameSize: 22, arrowColor: 0x88ccff,
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
    const nameChild = db.container.children.find((c) => c instanceof PIXI.Text && (c as PIXI.Text).text === 'Alice');
    expect(nameChild).toBeDefined();
  });

  it('setSpeaker(null) clears existing name text', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setSpeaker('Alice');
    db.setSpeaker(null);
    const nameChild = db.container.children.find((c) => c instanceof PIXI.Text && (c as PIXI.Text).text === 'Alice');
    expect(nameChild).toBeUndefined();
  });

  it('getDialogueContainer returns container', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    expect(db.getDialogueContainer()).toBeDefined();
  });

  it('setAlpha changes container alpha', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setAlpha(0.5);
    expect(db.container.alpha).toBe(0.5);
  });

  it('setBoxOffsetY changes container y', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    db.setBoxOffsetY(30);
    expect(db.container.y).toBe(30);
  });

  it('redrawBox clears and redraws', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const clearSpy = vi.spyOn(db['boxBg'], 'clear');
    db.redrawBox();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('redrawArrow draws arrow only in between state', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const clearSpy = vi.spyOn(db['arrow'], 'clear');
    db.redrawArrow('typing', 0);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(db['arrow'].children.length).toBe(0);
  });

  it('redrawArrow draws arrow in between state', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const clearSpy = vi.spyOn(db['arrow'], 'clear');
    db.redrawArrow('between', 0);
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('applyOptions updates bg color', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const redrawSpy = vi.spyOn(db, 'redrawBox');
    db.applyOptions({ boxBg: 0xff0000 });
    expect(redrawSpy).toHaveBeenCalled();
  });

  it('destroy cleans up container', () => {
    const db = new DialogueBox(parent, MOCK_OPTS);
    const destroySpy = vi.spyOn(db.container, 'destroy');
    db.destroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});
