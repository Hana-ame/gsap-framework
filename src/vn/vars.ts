/**
 * 剧本变量 + 条件表达式求值 — 纯函数，支持 showWhen / jump.if。
 *
 * 表达式语法（不 eval，安全）：
 *   - 原子：$name（取变量）、字面量（'...' / "..." 字符串、true/false、数字）
 *   - 比较：==、===、!=、!==   （变量与字面量、或变量与变量）
 *   - 精确：无操作符时 "$name" = 真值判断
 *   - 组合：&&（且）、||（或） —— || 优先级最低
 */

import type { VnValue } from './types';

/** 解析字面量 token → 值；无法解析返回 null。 */
function parseLiteral(tok: string): VnValue | null {
  const t = tok.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  return null;
}

/** 数字 vs 数字字符串 归一化，便于比较。 */
function normalize(a: VnValue, b: VnValue): [VnValue, VnValue] {
  const toNum = (v: VnValue): VnValue =>
    typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) ? Number(v) : v;
  if (typeof a === 'number' || typeof b === 'number') return [toNum(a), toNum(b)];
  return [a, b];
}

function valuesEqual(a: VnValue, b: VnValue): boolean {
  if (typeof a === 'boolean' || typeof b === 'boolean') return a === b;
  const [x, y] = normalize(a, b);
  return x === y || String(x) === String(y);
}

function isTruthy(v: VnValue | undefined): boolean {
  if (v === undefined) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return v !== '' && v !== '0' && v !== 'false';
}

/** 求值一个原子条件（无 || / &&，可含完整外层括号）。 */
function evalAtom(atom: string, vars: Record<string, VnValue>): boolean {
  const a = atom.trim();
  if (!a) return true;

  // 支持整体括号包裹（如 "($flag == 'a')"），剥一层后递归
  if (a.startsWith('(') && a.endsWith(')')) {
    return evalCond(a.slice(1, -1), vars);
  }

  const m = a.match(/^(.+?)(!==|===|==|!=)\s*(.+)$/);
  if (m) {
    const [, lhs, op, rhs] = m;
    const ltoken = lhs.trim();
    const rtoken = rhs.trim();
    const lhsV = ltoken.startsWith('$') ? vars[ltoken.slice(1)] : parseLiteral(ltoken);
    const rhsV = rtoken.startsWith('$') ? vars[rtoken.slice(1)] : parseLiteral(rtoken);
    if (lhsV === undefined || rhsV === null) return false;
    const equal = valuesEqual(lhsV, rhsV);
    return op === '==' || op === '===' ? equal : !equal;
  }

  // 无比较操作符：$var 真值，字面量直接求值
  if (a.startsWith('$')) return isTruthy(vars[a.slice(1)]);
  const lit = parseLiteral(a);
  return lit !== null ? isTruthy(lit) : false;
}

/** 求值完整条件表达式；expr 为空始终为 true。 */
export function evalCond(expr: string, vars: Record<string, VnValue>): boolean {
  const exprTrim = expr.trim();
  if (!exprTrim) return true;
  // || 优先级最低，&& 次之
  return exprTrim
    .split('||')
    .some((or) => or.split('&&').every((atom) => evalAtom(atom, vars)));
}