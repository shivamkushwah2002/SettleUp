// utils/pairwiseHelper.js
import Group from "../models/Group.js";
import mongoose from "mongoose";

// Helper: recursively convert Map (or Mongoose Map/doc) -> plain object
// Adds cycle protection to avoid maximum call stack errors on unexpected circular refs.
function deepMapToObject(value, visited = new WeakSet()) {
  // primitives
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  // protect against circular references
  if (visited.has(value)) return null;
  visited.add(value);

  // If this is a Mongoose document or has toObject, convert first
  if (typeof value.toObject === "function") {
    try {
      return deepMapToObject(value.toObject(), visited);
    } catch (e) {
      // fallback to safe stringify
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (e2) {
        return null;
      }
    }
  }

  // Map-like objects (native Map or objects exposing entries)
  if (value instanceof Map || (typeof value.entries === "function" && typeof value.get === "function")) {
    const obj = {};
    for (const [k, v] of value.entries()) {
      obj[k] = deepMapToObject(v, visited);
    }
    return obj;
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.map((v) => deepMapToObject(v, visited));
  }

  // Plain object
  const out = {};
  for (const k of Object.keys(value)) {
    out[k] = deepMapToObject(value[k], visited);
  }
  return out;
}

// Ensure all keys (top-level and nested) are strings and nested values are numbers
function normalizePairwiseKeys(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    const inner = obj[k] || {};
    const innerOut = {};
    for (const ik of Object.keys(inner || {})) {
      innerOut[ik.toString()] = Number(inner[ik] || 0);
    }
    out[k.toString()] = innerOut;
  }
  return out;
}

/**
 * Ensure pairwise entries exist for all members (initialize zeros).
 * Useful when group created or a new member is added.
 */
export async function initPairwiseForGroup(groupId, memberIds) {
  // memberIds: array of ObjectId or strings
  const g = await Group.findById(groupId);
  if (!g) throw new Error("Group not found");

  memberIds = memberIds.map(m => m.toString());

  // Convert Map (or nested Maps) to plain object and normalize keys
  let pairwise = g.pairwise ? deepMapToObject(g.pairwise) : {};
  pairwise = normalizePairwiseKeys(pairwise);

  for (const debtor of memberIds) {
    if (!pairwise[debtor]) pairwise[debtor] = {};
    for (const creditor of memberIds) {
      if (debtor === creditor) continue;
      if (pairwise[debtor][creditor] === undefined) pairwise[debtor][creditor] = 0;
    }
  }

  // optionally compute balances
  const balancesObj = computeBalancesFromPairwise(pairwise);

  g.pairwise = new Map(Object.entries(pairwise));
  // Convert to Map for MongoDB
  g.balances = new Map(Object.entries(balancesObj));
  await g.save();
  return g;
}

/**
 * Compute aggregate balances from pairwise map.
 * returns { userId: number } where positive = user gets money (credit), negative = user owes.
 */
export function computeBalancesFromPairwise(pairwise) {
  const balances = {};
  // pairwise: { debtorId: { creditorId: amount, ... }, ... }
  for (const debtor in pairwise) {
    for (const creditor in pairwise[debtor]) {
      const amt = Number(pairwise[debtor][creditor] || 0);
      // debtor owes amt -> debtor balance decreases, creditor increases
      balances[debtor] = (balances[debtor] || 0) - amt;
      balances[creditor] = (balances[creditor] || 0) + amt;
    }
  }
  return balances;
}

/**
 * Apply an expense to the pairwise ledger.
 * - paidBy: userId string
 * - splits: array of { userId, owed } where owed is amount that user owes (including payer possibly 0)
 *
 * Behavior:
 * For each split entry { userId: X, owed: a }:
 *   - If X === paidBy -> skip (payer doesn't owe to self).
 *   - Increase pairwise[X][paidBy] by a (X owes paidBy)
 *
 * After applying, recompute balances and save.
 */
export async function applyExpenseToPairwise(groupId, paidBy, splits) {
  const g = await Group.findById(groupId);
  if (!g) throw new Error("Group not found");

  // Convert Map (or nested Maps) to plain object and normalize keys
  let pairwise = g.pairwise ? deepMapToObject(g.pairwise) : {};
  pairwise = normalizePairwiseKeys(pairwise);
  const paidById = paidBy.toString();

  // ensure structure exists
  if (!pairwise[paidById]) pairwise[paidById] = {};

  for (const s of splits) {
    const uid = s.userId.toString();
    const owed = Number(s.owed || 0);
    if (!pairwise[uid]) pairwise[uid] = {};
    if (uid === paidById) continue; // payer owes themselves nothing

    pairwise[uid][paidById] = (Number(pairwise[uid][paidById] || 0) + owed);
  }

  // Local netting: for each participant in this expense, net only between
  // that participant and the payer. This reduces reciprocal entries for the
  // directly involved pair without doing a global simplification.
  for (const s of splits) {
    const uid = s.userId.toString();
    if (uid === paidById) continue;
    // ensure nested structure exists
    if (!pairwise[uid]) pairwise[uid] = {};
    if (!pairwise[paidById]) pairwise[paidById] = {};
    // run pair-level normalization which keeps only one direction positive
    normalizePairwise(pairwise, uid, paidById);
  }

  // recompute balances
  g.pairwise = new Map(Object.entries(pairwise));
  const balancesObj = computeBalancesFromPairwise(pairwise);
  // Convert to Map for MongoDB
  g.balances = new Map(Object.entries(balancesObj));
  await g.save();
  return g;
}

/**
 * Apply settlement (payer pays receiver) -> reduce debt.
 * If payer owes receiver, subtract amount from pairwise[payer][receiver].
 * If payer had negative (i.e., receiver owed payer), increase accordingly.
 *
 * We must support both directions. Convention: pairwise[debtor][creditor] = positive amount debtor owes creditor.
 */
export async function applySettlement(groupId, payerId, receiverId, amount) {
  const g = await Group.findById(groupId);
  if (!g) throw new Error("Group not found");

  // Convert Map (or nested Maps) to plain object and normalize keys
  let pairwise = g.pairwise ? deepMapToObject(g.pairwise) : {};
  pairwise = normalizePairwiseKeys(pairwise);
  const a = Number(amount);

  const p = payerId.toString();
  const r = receiverId.toString();

  // ensure entries
  if (!pairwise[p]) pairwise[p] = {};
  if (!pairwise[r]) pairwise[r] = {};

  // If payer owes receiver -> reduce that debt
  const payerOwesReceiver = Number(pairwise[p][r] || 0);
  if (payerOwesReceiver >= a) {
    // reduce payer->receiver
    pairwise[p][r] = payerOwesReceiver - a;
  } else {
    // payer didn't owe that much. Net-off both sides:
    // there may be some receiver->payer as well; but by convention pairwise[r][p] records receiver owes payer
    // If payerOwesReceiver < a, set pairwise[p][r]=0 and increase pairwise[r][p] by (a - payerOwesReceiver) negative meaning reverse debt
    pairwise[p][r] = 0;
    const remaining = a - payerOwesReceiver;
    // remaining means receiver should owe payer now (receiver negative), so we reduce pairwise[r][p] by remaining:
    pairwise[r][p] = Math.max(0, Number(pairwise[r][p] || 0) - remaining);
    // If pairwise[r][p] was smaller than remaining, then this will set to 0; if any leftover, it becomes reversed direction - but we keep non-negative invariants.
    // Another approach is to allow negative values; I prefer to keep pairwise entries non-negative and represent net direction by which key has positive value.
    // If you want netting to always keep only one direction positive, run `normalizePairwise` after updates.
  }

  // Note: we intentionally DO NOT normalize pairwise entries here.
  // Keeping both directions (A->B and B->A) preserves raw settlement history
  // and avoids automatic pair-level netting. Frontend can present raw
  // pairwise debts to users without collapsing reciprocal entries.

  // recalc balances
  g.pairwise = new Map(Object.entries(pairwise));
  const balancesObj = computeBalancesFromPairwise(pairwise);
  // Convert to Map for MongoDB
  g.balances = new Map(Object.entries(balancesObj));
  await g.save();
  return g;
}

/**
 * Normalize two entries pairwise[a][b] and pairwise[b][a] to ensure only one side holds value.
 */
export function normalizePairwise(pairwise, a, b) {
  const ab = Number((pairwise[a] && pairwise[a][b]) || 0);
  const ba = Number((pairwise[b] && pairwise[b][a]) || 0);

  if (ab > 0 && ba > 0) {
    if (ab > ba) {
      // keep ab-ab, set ba=0
      pairwise[a][b] = ab - ba;
      pairwise[b][a] = 0;
    } else {
      pairwise[b][a] = ba - ab;
      pairwise[a][b] = 0;
    }
  }
}
