#!/usr/bin/env node
// Recomputes the headline figures of the study from pairs.csv.
//   node verify.mjs            (Node 18 or later, no dependencies)
import { readFileSync } from "node:fs";

const rows = readFileSync(new URL("./pairs.csv", import.meta.url), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [pair, category, winner, loser, winnerSwapped, loserSwapped] = line.split(",");
    return { pair, category, winner: +winner, loser: +loser, winnerSwapped: +winnerSwapped, loserSwapped: +loserSwapped };
  });

// log C(n, k) by summing logs: n is 321, so this is exact enough and needs nothing else.
const logChoose = (n, k) => {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
};
const pmf = (n, k, p) => Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
const upperTail = (n, k, p) => {
  let s = 0;
  for (let i = k; i <= n; i++) s += pmf(n, i, p);
  return s;
};
const lowerTail = (n, k, p) => {
  let s = 0;
  for (let i = 0; i <= k; i++) s += pmf(n, i, p);
  return s;
};
// Exact two-sided test against 50%: the tails are symmetric, so double the smaller one.
const exactP = (n, k) => Math.min(1, 2 * Math.min(upperTail(n, k, 0.5), lowerTail(n, k, 0.5)));
// Clopper-Pearson 95% interval, found by bisection on the binomial tails.
const bisect = (f) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid)) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};
const interval = (n, k) => [
  k === 0 ? 0 : bisect((p) => upperTail(n, k, p) > 0.025),
  k === n ? 1 : bisect((p) => lowerTail(n, k, p) < 0.025),
];

const report = (label, winnerKey, loserKey) => {
  const n = rows.length;
  const wins = rows.filter((r) => r[winnerKey] > r[loserKey]).length;
  const ties = rows.filter((r) => r[winnerKey] === r[loserKey]).length;
  const [lo, hi] = interval(n, wins);
  console.log(`${label}`);
  console.log(`  pairs                  ${n}`);
  console.log(`  winner scored higher   ${wins}  (${((wins / n) * 100).toFixed(1)}%)`);
  console.log(`  ties, counted as misses ${ties}`);
  console.log(`  95% interval           ${(lo * 100).toFixed(1)}% to ${(hi * 100).toFixed(1)}%`);
  console.log(`  exact p against 50%    ${exactP(n, wins).toFixed(6)}`);
};

report("Original titles", "winner", "loser");
report("\nTitles swapped between the two videos of each pair", "winnerSwapped", "loserSwapped");

console.log("\nBy category (original titles)");
for (const category of [...new Set(rows.map((r) => r.category))].sort()) {
  const group = rows.filter((r) => r.category === category);
  const wins = group.filter((r) => r.winner > r.loser).length;
  console.log(`  ${category.padEnd(10)} ${String(group.length).padStart(3)} pairs  ${((wins / group.length) * 100).toFixed(1)}%`);
}
