export function makePattern(gridSize = 9, count = 4, random: () => number = Math.random): number[] {
  if (!Number.isInteger(gridSize) || gridSize < 1) throw new RangeError("gridSize must be a positive integer");
  if (!Number.isInteger(count) || count < 0 || count > gridSize) throw new RangeError("count must be between zero and gridSize");
  const values = Array.from({ length: gridSize }, (_, index) => index);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values.slice(0, count);
}

export function scoreTargetTaps(targets: string[], tappedIndexes: number[], target = "◆"): number {
  const uniqueIndexes = new Set(tappedIndexes);
  let score = 0;
  for (const index of uniqueIndexes) {
    if (Number.isInteger(index) && index >= 0 && index < targets.length && targets[index] === target) score += 1;
  }
  return score;
}

export function countUniqueIdeas(input: string): string[] {
  const seen = new Set<string>();
  const ideas: string[] = [];
  for (const raw of input.split(/[,\n;]/)) {
    const normalized = raw.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      ideas.push(normalized);
    }
  }
  return ideas;
}
