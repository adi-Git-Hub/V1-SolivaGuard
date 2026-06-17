import fs from 'fs';

const traceData = JSON.parse(fs.readFileSync('trace.json', 'utf8'));
const events = traceData.traceEvents;

let longTasks = [];
let totalScriptEvalTime = 0;
let totalParseHTMLTime = 0;
let fcpTime = 0;
let lcpTime = 0;
let firstNavStartTime = 0;

for (const event of events) {
  if (event.name === 'navigationStart') {
    if (firstNavStartTime === 0) firstNavStartTime = event.ts;
  }
  
  if (event.name === 'firstContentfulPaint' && fcpTime === 0) {
    fcpTime = event.ts;
  }
  if (event.name === 'largestContentfulPaint::Candidate' && event.ph === 'I') {
    lcpTime = Math.max(lcpTime, event.ts);
  }

  // Calculate durations for specific phases
  if (event.name === 'EvaluateScript' && event.ph === 'X') {
    totalScriptEvalTime += event.dur || 0;
  }
  if (event.name === 'ParseHTML' && event.ph === 'X') {
    totalParseHTMLTime += event.dur || 0;
  }

  // Find long tasks (Main thread tasks > 50ms)
  if (event.name === 'RunTask' && event.ph === 'X' && event.dur > 50000) {
    longTasks.push(event);
  }
}

console.log('--- Trace Analysis ---');
console.log(`Navigation Start: 0 ms`);
console.log(`First Contentful Paint (FCP): ${((fcpTime - firstNavStartTime) / 1000).toFixed(2)} ms`);
console.log(`Largest Contentful Paint (LCP): ${((lcpTime - firstNavStartTime) / 1000).toFixed(2)} ms`);
console.log(`Total Script Evaluation Time: ${(totalScriptEvalTime / 1000).toFixed(2)} ms`);
console.log(`Total Parse HTML Time: ${(totalParseHTMLTime / 1000).toFixed(2)} ms`);

console.log(`\n--- Long Tasks (> 50ms) ---`);
console.log(`Found ${longTasks.length} long tasks.`);
const sortedLongTasks = longTasks.sort((a, b) => b.dur - a.dur);
sortedLongTasks.forEach((task, index) => {
  console.log(`Task ${index + 1}: ${(task.dur / 1000).toFixed(2)} ms (Starts at ${((task.ts - firstNavStartTime) / 1000).toFixed(2)} ms)`);
});
