import fs from 'fs';

const traceData = JSON.parse(fs.readFileSync('trace.json', 'utf8'));
const events = traceData.traceEvents;

let firstNavStartTime = 0;
for (const event of events) {
  if (event.name === 'navigationStart') {
    firstNavStartTime = event.ts;
    break;
  }
}

// Map of event names to duration
const timeByEvent = {};

for (const event of events) {
  if (event.ph === 'X' || event.ph === 'B') {
    const dur = event.dur || 0;
    if (!timeByEvent[event.name]) {
      timeByEvent[event.name] = 0;
    }
    timeByEvent[event.name] += dur;
  }
}

console.log('--- Time by Trace Event Type ---');
const sortedEvents = Object.entries(timeByEvent).sort((a, b) => b[1] - a[1]).slice(0, 15);
sortedEvents.forEach(([name, dur]) => {
  console.log(`${name}: ${(dur / 1000).toFixed(2)} ms`);
});

