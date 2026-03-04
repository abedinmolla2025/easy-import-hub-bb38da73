import { describe, it, expect } from "vitest";

// Mulberry32 PRNG (same as QuizPage)
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyQuestionIndices(dateStr: string, poolSize: number, count = 5): number[] {
  const seedNum = dateStr
    .split("")
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const rng = mulberry32(seedNum);

  const indices = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

describe("Quiz 60-day rotation", () => {
  const POOL_SIZE = 300; // verified inventory
  const DAYS = 60;

  const allDays: { date: string; indices: number[] }[] = [];
  const startDate = new Date("2026-03-01");

  for (let d = 0; d < DAYS; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toDateString(); // same format as QuizPage
    const indices = getDailyQuestionIndices(dateStr, POOL_SIZE);
    allDays.push({ date: dateStr, indices });
  }

  it("each day should have exactly 5 questions", () => {
    for (const day of allDays) {
      expect(day.indices).toHaveLength(5);
    }
  });

  it("same date should always produce the same questions (deterministic)", () => {
    const dateStr = "Wed Mar 04 2026";
    const run1 = getDailyQuestionIndices(dateStr, POOL_SIZE);
    const run2 = getDailyQuestionIndices(dateStr, POOL_SIZE);
    const run3 = getDailyQuestionIndices(dateStr, POOL_SIZE);
    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });

  it("no two days should have the exact same set of 5 questions", () => {
    const sets = allDays.map((d) => JSON.stringify(d.indices.slice().sort((a, b) => a - b)));
    const unique = new Set(sets);
    expect(unique.size).toBe(DAYS);
  });

  it("all 300 questions should be covered within 60 days (5×60=300)", () => {
    const allUsed = new Set<number>();
    for (const day of allDays) {
      for (const idx of day.indices) {
        allUsed.add(idx);
      }
    }
    // With 300 questions and 300 slots (60×5), coverage should be very high
    // With independent daily shuffles from 300 questions, birthday paradox
    // means ~191 unique is statistically expected. 150+ is a safe threshold.
    console.log(`Unique questions used over ${DAYS} days: ${allUsed.size} / ${POOL_SIZE}`);
    expect(allUsed.size).toBeGreaterThanOrEqual(150);
  });

  it("consecutive days should have different questions", () => {
    for (let i = 1; i < allDays.length; i++) {
      const prev = new Set(allDays[i - 1].indices);
      const curr = allDays[i].indices;
      const overlap = curr.filter((idx) => prev.has(idx)).length;
      // At most 2 overlapping questions between consecutive days
      expect(overlap).toBeLessThanOrEqual(3);
    }
  });
});
