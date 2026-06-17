import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Images known to be used on the homepage components
const usedImages = [
  { section: 'CollectionSection', file: 'beige-1.webp' },
  { section: 'CollectionSection', file: 'blue-1.webp' },
  { section: 'CollectionSection', file: 'lime-1.webp' },
  { section: 'CollectionSection', file: 'olive-1.webp' },
  { section: 'CollectionSection', file: 'pink-1.webp' },
  { section: 'CompareSection', file: 'adjust-1.webp' },
  { section: 'CompareSection', file: 'adjust-2.webp' },
  { section: 'CompareSection', file: 'adjust-3.webp' },
  { section: 'CompareSection', file: 'adjust-4.webp' },
  { section: 'CompareSection', file: 'adjust-5.webp' },
  { section: 'Hero/Root', file: 'hero-desktop.webp' },
  { section: 'Hero/Root', file: 'hero-poster.webp' },
  { section: 'IntroLoader', file: 'ChatGPT_Image_Jun_11__2026__02_46_40_AM-removebg-preview.png' },
  { section: 'Header', file: 'soliva-nav-new.webp' },
  { section: 'ParticleLogo', file: 'soliva-particle-logo.png' },
  { section: 'UrbanStorytelling', file: 'constant-slipping.webp' },
  { section: 'UrbanStorytelling', file: 'dust.webp' },
  { section: 'UrbanStorytelling', file: 'everyday-protection-new.webp' },
  { section: 'UrbanStorytelling', file: 'hidden-exposure-new.webp' },
  { section: 'UrbanStorytelling', file: 'sun.webp' },
  { section: 'UrbanStorytelling', file: 'trapped-heat-new.webp' },
  { section: 'Global/Root', file: 'luxury-bg.webp' },
  { section: 'Global/Root', file: 'new_BG.webp' }, // Already optimized
  { section: 'Global/Root', file: 'soliva logo_high resolution.webp' },
  { section: 'Global/Mobile', file: 'new_BG-mobile.webp' }
];

const results = [];

function getDimensions(file) {
    try {
        const out = execSync(`ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "${file}"`).toString().trim();
        return out || 'Unknown';
    } catch (e) {
        return 'Unknown';
    }
}

for (const img of usedImages) {
    let filePath = path.join('public', img.file);
    if (!fs.existsSync(filePath)) {
        if (fs.existsSync(path.join('public', 'product_images', img.file))) {
            filePath = path.join('public', 'product_images', img.file);
        } else {
             continue; // skip if not found
        }
    }

    try {
        const stats = fs.statSync(filePath);
        const sizeInKB = stats.size / 1024;
        const dimensions = getDimensions(filePath);
        const ext = path.extname(filePath).replace('.', '').toUpperCase();
        
        // Define strategy based on visual audit
        let strategy = 'Lazy';
        if (img.section.includes('Hero') || img.section === 'Global/Root' || img.section === 'Header' || img.section === 'IntroLoader') {
            strategy = 'Eager/Preload';
        }

        results.push({
            Section: img.section,
            'File Name': img.file,
            'Dimensions (WxH)': dimensions,
            'File Size (KB)': parseFloat(sizeInKB.toFixed(2)),
            Format: ext,
            'Above the Fold?': strategy === 'Eager/Preload' ? 'Yes' : 'No',
            'Loading Strategy': strategy,
            'Used at Startup?': strategy === 'Eager/Preload' ? 'Yes' : 'No'
        });
    } catch (e) {
        console.error("Could not read " + img.file, e.message);
    }
}

// Sort by size
results.sort((a, b) => b['File Size (KB)'] - a['File Size (KB)']);

console.log('| Section | File Name | Dimensions (WxH) | File Size (KB/MB) | Format | Above the Fold? | Loading Strategy | Used at Startup? |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of results) {
    let sizeStr = r['File Size (KB)'] > 1024 ? `${(r['File Size (KB)'] / 1024).toFixed(2)} MB` : `${r['File Size (KB)']} KB`;
    console.log(`| ${r.Section} | ${r['File Name']} | ${r['Dimensions (WxH)']} | ${sizeStr} | ${r.Format} | ${r['Above the Fold?']} | ${r['Loading Strategy']} | ${r['Used at Startup?']} |`);
}
