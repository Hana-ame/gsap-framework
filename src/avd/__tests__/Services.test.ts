import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── AudioService ──

describe('AudioService', () => {
  let mockAudioManager: any;

  beforeEach(() => {
    mockAudioManager = {
      playBgm: vi.fn(),
      playSfx: vi.fn(),
      playVoice: vi.fn(),
      setBgmVolume: vi.fn(),
      setSfxVolume: vi.fn(),
      destroy: vi.fn(),
    };
    vi.resetModules();
  });

  it('delegates playBgm to AudioManager and tracks current key', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    svc.setAudioMap({ bgm1: {} as AudioBuffer });
    svc.playBgm('bgm1');
    expect(mockAudioManager.playBgm).toHaveBeenCalledWith({});
    expect(svc.currentBgmKey).toBe('bgm1');
  });

  it('playBgm with null stops bgm', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    svc.setAudioMap({ bgm1: {} as AudioBuffer });
    svc.playBgm(null);
    expect(mockAudioManager.playBgm).toHaveBeenCalledWith(null);
    expect(svc.currentBgmKey).toBeNull();
  });

  it('playSfx looks up audio map and calls AudioManager', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    svc.setAudioMap({ sfx1: {} as AudioBuffer });
    svc.playSfx('sfx1');
    expect(mockAudioManager.playSfx).toHaveBeenCalledWith({});
  });

  it('playVoice looks up audio map and calls AudioManager', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    svc.setAudioMap({ voice1: {} as AudioBuffer });
    svc.playVoice('voice1');
    expect(mockAudioManager.playVoice).toHaveBeenCalledWith({});
  });

  it('playSfx does nothing for missing key', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    svc.playSfx('missing');
    expect(mockAudioManager.playSfx).not.toHaveBeenCalled();
  });

  it('delegates volume and destroy', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    svc.setBgmVolume(0.5);
    expect(mockAudioManager.setBgmVolume).toHaveBeenCalledWith(0.5);
    svc.setSfxVolume(0.8);
    expect(mockAudioManager.setSfxVolume).toHaveBeenCalledWith(0.8);
    svc.destroy();
    expect(mockAudioManager.destroy).toHaveBeenCalledOnce();
  });

  it('exposes manager getter', async () => {
    const { AudioService } = await import('../AudioService');
    const svc = new AudioService(mockAudioManager);
    expect(svc.manager).toBe(mockAudioManager);
  });
});

// ── EventBus ──

describe('EventBus', () => {
  it('emits to registered listeners', async () => {
    const { EventBus } = await import('../EventBus');
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('line:enter', fn);
    bus.emit('line:enter', { index: 0, line: { text: 'hello' } as any });
    expect(fn).toHaveBeenCalledWith({ index: 0, line: { text: 'hello' } });
  });

  it('does not emit to unregistered listeners', async () => {
    const { EventBus } = await import('../EventBus');
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('state:change', fn);
    bus.off('state:change', fn);
    bus.emit('state:change', { state: 'typing' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('supports multiple listeners on same event', async () => {
    const { EventBus } = await import('../EventBus');
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('choice:select', fn1);
    bus.on('choice:select', fn2);
    bus.emit('choice:select', { choice: { text: 'a' } as any, index: 0 });
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it('removeAll clears all listeners', async () => {
    const { EventBus } = await import('../EventBus');
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('typing:complete', fn);
    bus.removeAll();
    bus.emit('typing:complete', {});
    expect(fn).not.toHaveBeenCalled();
  });
});

// ── FlagService ──

describe('FlagService', () => {
  it('add, has, delete round-trip', async () => {
    const { FlagService } = await import('../FlagService');
    const svc = new FlagService();
    expect(svc.has('foo')).toBe(false);
    svc.add('foo');
    expect(svc.has('foo')).toBe(true);
    svc.delete('foo');
    expect(svc.has('foo')).toBe(false);
  });

  it('toArray returns snapshot', async () => {
    const { FlagService } = await import('../FlagService');
    const svc = new FlagService();
    svc.add('a'); svc.add('b');
    expect(svc.toArray().sort()).toEqual(['a', 'b']);
  });

  it('clear removes all flags', async () => {
    const { FlagService } = await import('../FlagService');
    const svc = new FlagService();
    svc.add('a'); svc.add('b');
    svc.clear();
    expect(svc.toArray()).toEqual([]);
  });

  it('getSnapshot returns same Set reference', async () => {
    const { FlagService } = await import('../FlagService');
    const svc = new FlagService();
    svc.add('x');
    const s = svc.getSnapshot();
    expect(s.has('x')).toBe(true);
    svc.add('y');
    expect(s.has('y')).toBe(true);
  });

  it('setFromArray replaces contents', async () => {
    const { FlagService } = await import('../FlagService');
    const svc = new FlagService();
    svc.add('old');
    svc.setFromArray(['a', 'b', 'c']);
    expect(svc.toArray().sort()).toEqual(['a', 'b', 'c']);
    expect(svc.has('old')).toBe(false);
  });
});

// ── BacklogService ──

describe('BacklogService', () => {
  it('add stores entries', async () => {
    const { BacklogService } = await import('../BacklogService');
    const svc = new BacklogService();
    svc.add('Alice', 'Hello');
    expect(svc.entries).toHaveLength(1);
    expect(svc.entries[0]).toEqual({ speaker: 'Alice', text: 'Hello' });
  });

  it('clear empties entries', async () => {
    const { BacklogService } = await import('../BacklogService');
    const svc = new BacklogService();
    svc.add('Alice', 'Hello');
    svc.clear();
    expect(svc.entries).toHaveLength(0);
  });

  it('getSnapshot returns current array reference', async () => {
    const { BacklogService } = await import('../BacklogService');
    const svc = new BacklogService();
    svc.add('A', 'text');
    const snap = svc.getSnapshot();
    expect(snap).toHaveLength(1);
    svc.add('B', 'more');
    expect(snap).toHaveLength(2);
  });

  it('setFromArray deep-copies entries', async () => {
    const { BacklogService } = await import('../BacklogService');
    const svc = new BacklogService();
    svc.setFromArray([{ speaker: 'A', text: 'hi' }]);
    expect(svc.entries).toHaveLength(1);
    expect(svc.entries[0].text).toBe('hi');
  });
});

// ── AutoSkipService ──

describe('AutoSkipService', () => {
  it('starts with autoMode and skipMode off', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    expect(svc.autoMode).toBe(false);
    expect(svc.skipMode).toBe(false);
  });

  it('setAutoMode enables auto and disables skip', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    svc.setSkipMode(true);
    svc.setAutoMode(true);
    expect(svc.autoMode).toBe(true);
    expect(svc.skipMode).toBe(false);
  });

  it('setSkipMode enables skip and auto', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    svc.setSkipMode(true);
    expect(svc.skipMode).toBe(true);
    expect(svc.autoMode).toBe(true);
  });

  it('onChoiceEnter disables skip', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    svc.setSkipMode(true);
    svc.onChoiceEnter();
    expect(svc.skipMode).toBe(false);
  });

  it('startAutoTimer schedules callback', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    vi.useFakeTimers();
    const fn = vi.fn();
    svc.startAutoTimer(1000, fn);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('clearAutoTimer cancels pending timer', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    vi.useFakeTimers();
    const fn = vi.fn();
    svc.startAutoTimer(1000, fn);
    svc.clearAutoTimer();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('startAutoTimer clears previous timer', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    vi.useFakeTimers();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    svc.startAutoTimer(1000, fn1);
    svc.startAutoTimer(500, fn2);
    vi.advanceTimersByTime(500);
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('serialize and restore preserves state', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    svc.setAutoMode(true);
    const state = svc.getSerializedState();
    expect(state).toEqual({ autoMode: true, skipMode: false });
    const svc2 = new AutoSkipService();
    svc2.restoreState(state.autoMode, state.skipMode);
    expect(svc2.autoMode).toBe(true);
    expect(svc2.skipMode).toBe(false);
  });

  it('destroy clears timer', async () => {
    const { AutoSkipService } = await import('../AutoSkipService');
    const svc = new AutoSkipService();
    vi.useFakeTimers();
    const fn = vi.fn();
    svc.startAutoTimer(1000, fn);
    svc.destroy();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

// ── SaveLoadService ──

describe('SaveLoadService', () => {
  let mockState: any;

  beforeEach(() => {
    mockState = {
      lineIndex: 5,
      flags: new Set(['f1']),
      backlog: [{ speaker: 'A', text: 'hello' }],
      autoMode: false,
      skipMode: false,
      currentBgKey: 'bg1',
      currentBgmKey: null,
    };
    localStorage.clear();
  });

  it('save returns AvdSaveData with correct shape', async () => {
    const { SaveLoadService } = await import('../SaveLoadService');
    const svc = new SaveLoadService();
    const data = svc.save(mockState, 'test save');
    expect(data.lineIndex).toBe(5);
    expect(data.flags).toEqual(['f1']);
    expect(data.backlog).toEqual([{ speaker: 'A', text: 'hello' }]);
    expect(data.label).toBe('test save');
    expect(data.bgKey).toBe('bg1');
    expect(data.version).toBe(1);
    expect(typeof data.timestamp).toBe('number');
  });

  it('quickSave stores to localStorage and notifies', async () => {
    const { SaveLoadService } = await import('../SaveLoadService');
    const notify = vi.fn();
    const svc = new SaveLoadService({ notify });
    svc.quickSave(mockState);
    const raw = localStorage.getItem('avd_quicksave');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.lineIndex).toBe(5);
    expect(notify).toHaveBeenCalledWith('Quick Save', 'success');
  });

  it('quickLoad retrieves data and notifies', async () => {
    const { SaveLoadService } = await import('../SaveLoadService');
    const notify = vi.fn();
    const svc = new SaveLoadService({ notify });
    svc.quickSave(mockState);
    const loaded = svc.quickLoad();
    expect(loaded).not.toBeNull();
    expect(loaded!.lineIndex).toBe(5);
    expect(notify).toHaveBeenCalledWith('Quick Load', 'info');
  });

  it('quickLoad returns null when no save exists and warns', async () => {
    const { SaveLoadService } = await import('../SaveLoadService');
    const notify = vi.fn();
    const svc = new SaveLoadService({ notify });
    const loaded = svc.quickLoad();
    expect(loaded).toBeNull();
    expect(notify).toHaveBeenCalledWith('No Save Data', 'warn');
  });

  it('setCallbacks updates callbacks', async () => {
    const { SaveLoadService } = await import('../SaveLoadService');
    const notify = vi.fn();
    const svc = new SaveLoadService();
    svc.setCallbacks({ notify });
    svc.quickSave(mockState);
    expect(notify).toHaveBeenCalled();
  });
});

// ── ChoiceService ──

describe('ChoiceService', () => {
  let mockLayer: any;
  let mockOpts: any;
  let mockParent: any;
  let onSelected: any;

  beforeEach(() => {
    mockLayer = {
      createContainer: vi.fn(() => ({
        addChild: vi.fn(),
        eventMode: null,
        cursor: null,
        x: 0,
        y: 0,
        el: null,
        on: vi.fn(),
        destroy: vi.fn(),
      })),
      createGraphics: vi.fn(() => ({
        clear: vi.fn(() => ({ roundRect: vi.fn(() => ({ fill: vi.fn() })) })),
      })),
      createText: vi.fn(() => ({ x: 0, y: 0, width: 50, height: 20 })),
    };
    mockOpts = {
      boxX: 100,
      boxY: 500,
      boxPadding: 10,
      boxWidth: 600,
      nameSize: 16,
      fontFamily: 'sans-serif',
    };
    mockParent = {
      addChild: vi.fn(),
      removeChild: vi.fn(),
    };
    onSelected = vi.fn();
  });

  it('init stores layer, opts, parent, callback', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    svc.init(mockLayer, mockOpts, mockParent, onSelected);
    expect(svc).toBeDefined();
  });

  it('show creates choice buttons', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    svc.init(mockLayer, mockOpts, mockParent, onSelected);
    svc.show([{ text: 'Choice A', targetLine: 3 }]);
    expect(mockLayer.createContainer).toHaveBeenCalled();
    expect(mockLayer.createGraphics).toHaveBeenCalled();
    expect(mockParent.addChild).toHaveBeenCalled();
  });

  it('hide removes all choice buttons', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    svc.init(mockLayer, mockOpts, mockParent, onSelected);
    svc.show([{ text: 'A', targetLine: 1 }]);
    svc.hide();
    // after hide, buttons should be cleared
    const { ChoiceService: CS } = await import('../ChoiceService');
    expect(svc['_choiceButtons']!.length).toBe(0);
  });

  it('filterChoices by conditionFlag', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    const flags = new Set(['has_key']);
    svc.setFlags(flags);
    const choices = [
      { text: 'A', targetLine: 1, conditionFlag: 'has_key' },
      { text: 'B', targetLine: 2, conditionFlag: 'missing' },
    ];
    const visible = svc.filterChoices(choices);
    expect(visible).toHaveLength(1);
    expect(visible[0].text).toBe('A');
  });

  it('filterChoices by conditionNotFlag', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    const flags = new Set(['blocked']);
    svc.setFlags(flags);
    const choices = [
      { text: 'A', targetLine: 1, conditionNotFlag: 'blocked' },
      { text: 'B', targetLine: 2 },
    ];
    const visible = svc.filterChoices(choices);
    expect(visible).toHaveLength(1);
    expect(visible[0].text).toBe('B');
  });

  it('resolveTarget uses segmentMap when targetSegment is set', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    const segMap = new Map<string, number>([['intro', 10]]);
    svc.setSegmentMap(segMap);
    const idx = svc.resolveTarget({ text: 'A', targetSegment: 'intro' });
    expect(idx).toBe(10);
  });

  it('resolveTarget falls back to targetLine', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    const idx = svc.resolveTarget({ text: 'A', targetLine: 5 });
    expect(idx).toBe(5);
  });

  it('startTimer and clearTimer lifecycle', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    svc.init(mockLayer, mockOpts, mockParent, onSelected);
    vi.useFakeTimers();
    svc.startTimer(1000, { text: 'A', targetLine: 1 } as any, 0);
    expect(svc['_choiceTimer']).not.toBeNull();
    svc.clearTimer();
    expect(svc['_choiceTimer']).toBeNull();
    vi.useRealTimers();
  });

  it('destroy cleans up', async () => {
    const { ChoiceService } = await import('../ChoiceService');
    const svc = new ChoiceService();
    svc.init(mockLayer, mockOpts, mockParent, onSelected);
    svc.show([{ text: 'A', targetLine: 1 }]);
    svc.destroy();
    expect(svc['_choiceButtons']!.length).toBe(0);
  });
});
