#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read historical test results
const testResultsPath = path.join(__dirname, '../test-results/test-results.json');
if (!fs.existsSync(testResultsPath)) {
  console.log('No test results found. Run tests first to generate timing data.');
  process.exit(0);
}

const results = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
const testDurations = new Map();

// Calculate average duration for each test
results.suites.forEach(suite => {
  const specs = suite.specs || [];
  specs.forEach(spec => {
    const testId = `${suite.file}:${spec.line}:${spec.column}`;
    const duration = spec.tests.reduce((sum, test) => sum + (test.duration || 0), 0);
    
    if (!testDurations.has(testId)) {
      testDurations.set(testId, { 
        durations: [], 
        file: suite.file,
        line: spec.line,
        column: spec.column 
      });
    }
    testDurations.get(testId).durations.push(duration);
  });
});

// Calculate averages and sort tests by duration
const testAverages = Array.from(testDurations.entries()).map(([testId, data]) => {
  const avg = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
  return {
    testId,
    file: data.file,
    line: data.line,
    column: data.column,
    avgDuration: avg
  };
}).sort((a, b) => b.avgDuration - a.avgDuration);

// Group tests by file
const fileGroups = testAverages.reduce((groups, test) => {
  if (!groups[test.file]) groups[test.file] = [];
  groups[test.file].push(test);
  return groups;
}, {});

// Create optimized test groups for parallel execution
const numWorkers = require('os').cpus().length;
const testGroups = Array(numWorkers).fill().map(() => []);
let totalDuration = 0;

// Distribute tests evenly across workers
Object.values(fileGroups).flat().forEach((test, i) => {
  const targetGroup = i % numWorkers;
  testGroups[targetGroup].push(test);
  totalDuration += test.avgDuration;
});

// Generate configuration for test sharding
const shardConfig = testGroups.map((group, i) => ({
  shard: i + 1,
  total: numWorkers,
  tests: group.map(t => t.testId),
  estimatedDuration: group.reduce((sum, t) => sum + t.avgDuration, 0)
}));

// Save shard configuration
const configPath = path.join(__dirname, '../test-results/shard-config.json');
fs.writeFileSync(configPath, JSON.stringify(shardConfig, null, 2));

console.log(`Optimized test distribution across ${numWorkers} workers:`);
shardConfig.forEach(shard => {
  console.log(`\nShard ${shard.shard}/${shard.total}:`);
  console.log(`Estimated duration: ${Math.round(shard.estimatedDuration / 1000)}s`);
  console.log(`Tests: ${shard.tests.length}`);
});

console.log(`\nTotal estimated duration: ${Math.round(totalDuration / 1000)}s`);
console.log(`Average duration per shard: ${Math.round(totalDuration / numWorkers / 1000)}s`);
console.log(`\nConfiguration saved to: ${configPath}`);
