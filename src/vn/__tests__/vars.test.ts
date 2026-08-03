import { describe, it, expect } from 'vitest';
import { evalCond } from '../vars';

describe('evalCond', () => {
  const vars = { flag: 'a', count: 2, done: true, name: '伊露', zero: 0 };

  it('empty expr is always true', () => {
    expect(evalCond('', {})).toBe(true);
    expect(evalCond('   ', {})).toBe(true);
  });

  it('compares variable to string literal (== / !=)', () => {
    expect(evalCond("$flag == 'a'", vars)).toBe(true);
    expect(evalCond("$flag == 'b'", vars)).toBe(false);
    expect(evalCond("$flag != 'b'", vars)).toBe(true);
    expect(evalCond("$name == '伊露'", vars)).toBe(true);
  });

  it('compares numbers and numeric strings', () => {
    expect(evalCond('$count == 2', vars)).toBe(true);
    expect(evalCond('$count != 3', vars)).toBe(true);
    expect(evalCond("$count == '2'", vars)).toBe(true);
  });

  it('handles strict equality operators', () => {
    expect(evalCond('$flag === "a"', vars)).toBe(true);
    expect(evalCond('$flag !== "b"', vars)).toBe(true);
  });

  it('truthy check without operator', () => {
    expect(evalCond('$flag', vars)).toBe(true);
    expect(evalCond('$zero', vars)).toBe(false);
    expect(evalCond('$done', vars)).toBe(true);
  });

  it('combines with && and ||', () => {
    expect(evalCond("$flag == 'a' && $count == 2", vars)).toBe(true);
    expect(evalCond("$flag == 'a' && $count == 3", vars)).toBe(false);
    expect(evalCond("$flag == 'x' || $count == 2", vars)).toBe(true);
    expect(evalCond("$flag == 'x' || $count == 3", vars)).toBe(false);
    expect(evalCond("$flag == 'x' || ($count == 2)", vars)).toBe(true);
  });

  it('undefined variable does not crash', () => {
    expect(evalCond('$missing == 1', vars)).toBe(false);
    expect(evalCond('$missing', vars)).toBe(false);
    expect(evalCond('$missing != 1', vars)).toBe(false);
  });

  it('compares two variables', () => {
    expect(evalCond('$flag == $other', { flag: 'x', other: 'x' })).toBe(true);
    expect(evalCond('$flag != $other', { flag: 'x', other: 'y' })).toBe(true);
  });
});
