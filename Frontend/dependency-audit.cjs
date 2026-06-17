const fs = require('fs');

const data = JSON.parse(fs.readFileSync('stats-final.json', 'utf8'));

// Find the homepage chunk
const mainChunkName = "assets/index-CUMpUjjy.js"; // Main vendor
const homeChunkName = "assets/index-Exa92-CB.js"; // Homepage specific

const dependencyGraph = [];

// Helper to categorize module path
function categorize(id) {
    if (id.includes('node_modules/gsap')) return 'Home (Animation)';
    if (id.includes('node_modules/lenis')) return 'Home (Scroll)';
    if (id.includes('node_modules/framer-motion')) return 'Home/Shared (Animation)';
    if (id.includes('node_modules/firebase')) return 'Account/Auth';
    if (id.includes('node_modules/recharts')) return 'Admin';
    if (id.includes('node_modules/@tanstack/react-query')) return 'Shared (Data)';
    if (id.includes('node_modules/@tanstack/react-router')) return 'Shared (Routing)';
    if (id.includes('node_modules/react')) return 'Shared (Framework)';
    if (id.includes('node_modules/lucide-react')) return 'Shared (Icons)';
    if (id.includes('node_modules/@radix-ui')) return 'Shared (UI)';
    if (id.includes('node_modules/zod')) return 'Shared (Validation)';
    
    if (id.includes('src/components/Hero')) return 'Home';
    if (id.includes('src/components/VideoSection')) return 'Home';
    if (id.includes('src/components/UrbanStorytelling')) return 'Home';
    if (id.includes('src/components/CollectionSection')) return 'Collection';
    if (id.includes('src/components/CompareSection')) return 'Home';
    if (id.includes('src/components/BrandNarrative')) return 'Home';
    if (id.includes('src/features/auth')) return 'Account/Auth';
    if (id.includes('src/features/cart')) return 'Checkout/Cart';
    if (id.includes('src/routes/admin')) return 'Admin';
    
    return 'Other';
}

function getImportChain(uid, visited = new Set()) {
    if (visited.has(uid)) return '...circular...';
    visited.add(uid);
    const meta = data.nodeMetas[uid];
    if (!meta || !meta.importedBy || meta.importedBy.length === 0) return meta ? meta.id : 'unknown';
    
    // Just take the first importer for the chain
    return `${meta.id} <- ${getImportChain(meta.importedBy[0].uid, visited)}`;
}

console.log("=== Homepage Dependency Audit ===");
console.log(`Analyzing: ${mainChunkName} and ${homeChunkName}\n`);

const auditResults = [];

for (const uid in data.nodeMetas) {
    const meta = data.nodeMetas[uid];
    const inMain = meta.moduleParts[mainChunkName];
    const inHome = meta.moduleParts[homeChunkName];
    
    if (inMain || inHome) {
        const pkg = meta.id.includes('node_modules') 
            ? meta.id.split('node_modules/')[1].split('/')[0]
            : 'App Code';
            
        // If it's a large dependency or interesting app code
        const isLibrary = meta.id.includes('node_modules');
        const category = categorize(meta.id);
        
        let status = 'REQUIRED_FOR_HOME';
        if (category === 'Account/Auth' || category === 'Admin') {
            status = 'SHOULD_BE_LAZY_LOADED';
        }

        // Only report significant libraries or app features
        if (isLibrary || meta.id.includes('src/features') || meta.id.includes('src/components')) {
             auditResults.push({
                 id: meta.id,
                 category,
                 status,
                 size: data.nodeParts[inMain || inHome].renderedLength,
                 chunk: inMain ? 'Main' : 'Home'
             });
        }
    }
}

// Group by category
const grouped = {};
auditResults.forEach(r => {
    if (!grouped[r.category]) grouped[r.category] = { size: 0, items: [] };
    grouped[r.category].size += r.size;
    grouped[r.category].items.push(r);
});

Object.entries(grouped).sort((a,b) => b[1].size - a[1].size).forEach(([cat, info]) => {
    console.log(`\nCategory: ${cat} (Total: ${(info.size/1024).toFixed(2)} KB)`);
    // Find representative items
    const topItems = info.items.sort((a,b) => b.size - a.size).slice(0, 5);
    topItems.forEach(item => {
        console.log(`  - [${item.status}] ${item.id.split('/').pop()} (${(item.size/1024).toFixed(2)} KB) in ${item.chunk}`);
    });
});
