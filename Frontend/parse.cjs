const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./stats.json', 'utf8'));

const modules = {};
const chunks = {};

// Aggregate nodeParts via nodeMetas
for (const [metaUid, meta] of Object.entries(data.nodeMetas)) {
  const id = meta.id;
  
  // Find which package it belongs to
  let pkgName = id;
  if (id.includes('node_modules/')) {
    const parts = id.split('node_modules/');
    const pathAfter = parts[parts.length - 1];
    if (pathAfter.startsWith('@')) {
      pkgName = pathAfter.split('/').slice(0, 2).join('/');
    } else {
      pkgName = pathAfter.split('/')[0];
    }
  } else {
    // Application code
    pkgName = 'App Code (src)';
  }

  if (!modules[pkgName]) {
    modules[pkgName] = { parsedSize: 0, chunks: new Set() };
  }

  for (const [chunkName, uid] of Object.entries(meta.moduleParts)) {
    const part = data.nodeParts[uid];
    if (part) {
      modules[pkgName].parsedSize += part.renderedLength || 0;
      modules[pkgName].chunks.add(chunkName);
      
      if (!chunks[chunkName]) {
        chunks[chunkName] = { modules: {}, totalParsed: 0 };
      }
      if (!chunks[chunkName].modules[pkgName]) {
        chunks[chunkName].modules[pkgName] = 0;
      }
      chunks[chunkName].modules[pkgName] += part.renderedLength || 0;
      chunks[chunkName].totalParsed += part.renderedLength || 0;
    }
  }
}

console.log("=== TOP 20 LARGEST MODULES ===");
const sortedModules = Object.entries(modules)
  .sort((a, b) => b[1].parsedSize - a[1].parsedSize)
  .slice(0, 20);

sortedModules.forEach(([name, info], index) => {
  console.log(`${index + 1}. ${name}`);
  console.log(`   Parsed Size: ${(info.parsedSize / 1024).toFixed(2)} KB`);
  console.log(`   Chunks: ${Array.from(info.chunks).join(', ')}`);
});

console.log("\n=== CHUNK CONTENTS ===");
const targetChunks = [
  "assets/index-BYyK8pyt.js", // ~579KB chunk
  "assets/index-Bvu5h5rJ.js"  // ~197KB chunk
];

targetChunks.forEach(chunk => {
  if (chunks[chunk]) {
    console.log(`\nChunk: ${chunk}`);
    const mods = Object.entries(chunks[chunk].modules)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    mods.forEach(([mod, size]) => {
      console.log(`  - ${mod}: ${(size / 1024).toFixed(2)} KB`);
    });
  }
});
