import { performance } from 'perf_hooks';

// Generate mock data
const generateData = (count) => {
  const categories = ['CategoryA', 'CategoryB', 'CategoryC', 'CategoryD'];
  const allTags = Array.from({ length: 100 }, (_, i) => `tag_${i}`);

  const values = [];
  for (let i = 0; i < count; i++) {
    // each value gets ~20 random tags
    const tags = [];
    for (let j = 0; j < 20; j++) {
      tags.push(allTags[Math.floor(Math.random() * allTags.length)]);
    }

    values.push({
      name: `Value_${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: [...new Set(tags)] // ensure unique tags per value
    });
  }
  return values;
};

const runOriginal = (values, value) => {
  return values
    .filter((candidate) => candidate.name !== value.name)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => value.tags.includes(tag)).length;
      const sameCategory = candidate.category === value.category ? 2 : 0;
      return { candidate, score: sharedTags + sameCategory };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.candidate);
};

const runOptimized = (values, value) => {
  const targetTags = new Set(value.tags);
  const targetCategory = value.category;
  const targetName = value.name;

  const scored = [];

  for (let i = 0; i < values.length; i++) {
    const candidate = values[i];
    if (candidate.name === targetName) continue;

    let sharedTags = 0;
    const candidateTags = candidate.tags;
    for (let j = 0; j < candidateTags.length; j++) {
      if (targetTags.has(candidateTags[j])) {
        sharedTags++;
      }
    }

    const sameCategory = candidate.category === targetCategory ? 2 : 0;
    const score = sharedTags + sameCategory;

    if (score > 0) {
      scored.push({ candidate, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.candidate);
};

// Benchmark
const values = generateData(10000);
const targetValue = values[0];

const iterations = 100;

console.log(`Running benchmark with ${values.length} values, ${iterations} iterations...`);

let startOriginal = performance.now();
let originalResult;
for (let i = 0; i < iterations; i++) {
  originalResult = runOriginal(values, targetValue);
}
let endOriginal = performance.now();
const originalTime = (endOriginal - startOriginal) / iterations;

let startOptimized = performance.now();
let optimizedResult;
for (let i = 0; i < iterations; i++) {
  optimizedResult = runOptimized(values, targetValue);
}
let endOptimized = performance.now();
const optimizedTime = (endOptimized - startOptimized) / iterations;

console.log(`Original average time: ${originalTime.toFixed(4)} ms`);
console.log(`Optimized average time: ${optimizedTime.toFixed(4)} ms`);
console.log(`Speedup: ${(originalTime / optimizedTime).toFixed(2)}x`);

// Check correctness
const originalNames = originalResult.map(v => v.name).join(',');
const optimizedNames = optimizedResult.map(v => v.name).join(',');
if (originalNames !== optimizedNames) {
  console.error('MISMATCH IN RESULTS!');
  console.error('Original:', originalNames);
  console.error('Optimized:', optimizedNames);
} else {
  console.log('Results match correctly.');
}
