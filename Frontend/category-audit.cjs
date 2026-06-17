const fs = require('fs');
const data = JSON.parse(fs.readFileSync('stats-final.json', 'utf8'));

const chunks = {};

function categorize(id) {
    if (id.includes('node_modules/gsap')) return 'Home (Animation)';
    if (id.includes('node_modules/lenis')) return 'Home (Scroll)';
    if (id.includes('node_modules/framer-motion')) return 'Home/Shared (Animation)';
    if (id.includes('node_modules/firebase')) return 'Account/Auth';
    if (id.includes('node_modules/recharts')) return 'Admin';
    if (id.includes('src/components/Hero')) return 'Home';
    if (id.includes('src/components/VideoSection')) return 'Home';
    if (id.includes('src/features/auth')) return 'Account/Auth';
    if (id.includes('src/features/cart')) return 'Checkout/Cart';
    if (id.includes('src/routes/admin')) return 'Admin';
    return 'Other';
}

for (const uid in data.nodeMetas) {
    const meta = data.nodeMetas[uid];
    for (const chunkName in meta.moduleParts) {
        if (!chunks[chunkName]) chunks[chunkName] = { size: 0, categories: {} };
        const size = data.nodeParts[meta.moduleParts[chunkName]].renderedLength;
        const cat = categorize(meta.id);
        if (!chunks[chunkName].categories[cat]) chunks[chunkName].categories[cat] = 0;
        chunks[chunkName].categories[cat] += size;
        chunks[chunkName].size += size;
    }
}

console.log("=== Chunk Category Audit ===");
const mainChunk = "assets/index-CUMpUjjy.js";
const homeChunk = "assets/index-Exa92-CB.js";

function printChunk(name) {
    console.log(`\nChunk: ${name} (${(chunks[name].size/1024).toFixed(2)} KB)`);
    Object.entries(chunks[name].categories)
        .sort((a,b) => b[1] - a[1])
        .forEach(([cat, size]) => {
            console.log(`  - ${cat}: ${(size/1024).toFixed(2)} KB`);
        });
}

printChunk(mainChunk);
printChunk(homeChunk);

console.log("\n=== Isolated Chunks ===");
const firebaseChunk = Object.keys(chunks).find(c => c.includes('firebase'));
if (firebaseChunk) printChunk(firebaseChunk);

const accountChunk = Object.keys(chunks).find(c => c.includes('AccountMenu'));
if (accountChunk) printChunk(accountChunk);

const cartChunk = Object.keys(chunks).find(c => c.includes('MiniCartDrawer'));
if (cartChunk) printChunk(cartChunk);

const searchChunk = Object.keys(chunks).find(c => c.includes('SearchOverlay'));
if (searchChunk) printChunk(searchChunk);
