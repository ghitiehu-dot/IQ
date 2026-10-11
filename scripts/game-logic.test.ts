import test from "node:test";
import assert from "node:assert/strict";
import { countUniqueIdeas, makePattern, scoreTargetTaps } from "../src/game-logic";

test("makePattern returns the requested number of unique valid positions", () => {
  const pattern = makePattern(9, 4, () => 0.5);
  assert.equal(pattern.length, 4);
  assert.equal(new Set(pattern).size, 4);
  assert.ok(pattern.every((position) => position >= 0 && position < 9));
});

test("makePattern validates its bounds", () => {
  assert.throws(() => makePattern(0, 1), RangeError);
  assert.throws(() => makePattern(5, 6), RangeError);
});

test("focus scoring counts only unique target taps", () => {
  const targets = ["◆", "●", "◆", "▲"];
  assert.equal(scoreTargetTaps(targets, [0, 0, 1, 2, 8, -1]), 2);
});

test("idea counting trims and deduplicates case-insensitively", () => {
  assert.deepEqual(countUniqueIdeas(" Bookmark, bookmark; RESET button\n paper clip "), [
    "bookmark",
    "reset button",
    "paper clip",
  ]);
});

test("empty idea input produces no ideas", () => {
  assert.deepEqual(countUniqueIdeas(" , ; \n "), []);
});
