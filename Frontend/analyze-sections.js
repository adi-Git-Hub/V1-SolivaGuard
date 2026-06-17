import fs from 'fs';

const data = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
const components = [
  'Hero.tsx', 
  'VideoSection.tsx', 
  'UrbanStorytelling.tsx', 
  'CollectionSection.tsx', 
  'CompareSection.tsx', 
  'BrandNarrative.tsx', 
  'layout/Header.tsx',
  'ParticleLogo.tsx',
  'Particles.tsx',
  'AtmosphericEngine.tsx'
];

console.log("--- Component JS Size (Parsed from Build) ---");
components.forEach(comp => {
    let size = 0;
    for (const uid in data.nodeMetas) {
        const meta = data.nodeMetas[uid];
        if (meta.id.includes(comp)) {
            for (const chunk in meta.moduleParts) {
                const partUid = meta.moduleParts[chunk];
                if (data.nodeParts[partUid]) {
                    size += data.nodeParts[partUid].renderedLength;
                }
            }
        }
    }
    console.log(`${comp.padEnd(25)}: ${(size/1024).toFixed(2)} KB`);
});
