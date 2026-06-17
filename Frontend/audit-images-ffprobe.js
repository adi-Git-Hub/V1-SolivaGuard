import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const imageReferences = [
  { section: 'CompareSection', file: 'IMG_6255.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CompareSection', file: 'IMG_3739.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'Global/Root', file: 'new_BG.webp', fold: 'Above', strategy: 'Preload/CSS', usedAtStartup: 'Yes' },
  { section: 'UrbanStorytelling', file: 'everyday-protection-new.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'UrbanStorytelling', file: 'dust.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'UrbanStorytelling', file: 'hidden-exposure-new.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'Hero/Root', file: 'hero-desktop.webp', fold: 'Above', strategy: 'Eager/Preload', usedAtStartup: 'Yes' },
  { section: 'Hero/Root', file: 'hero-poster.webp', fold: 'Above', strategy: 'Eager/Preload', usedAtStartup: 'Yes' },
  { section: 'CollectionSection', file: 'beige-1.webp', fold: 'Below', strategy: 'Lazy/GSAP', usedAtStartup: 'No' },
  { section: 'UrbanStorytelling', file: 'trapped-heat-new.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'UrbanStorytelling', file: 'constant-slipping.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CollectionSection', file: 'olive-1.webp', fold: 'Below', strategy: 'Lazy/GSAP', usedAtStartup: 'No' },
  { section: 'ParticleLogo', file: 'soliva-particle-logo.png', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'IntroLoader', file: 'ChatGPT_Image_Jun_11__2026__02_46_40_AM-removebg-preview.png', fold: 'Above', strategy: 'Eager', usedAtStartup: 'Yes' },
  { section: 'CollectionSection', file: 'lime-1.webp', fold: 'Below', strategy: 'Lazy/GSAP', usedAtStartup: 'No' },
  { section: 'UrbanStorytelling', file: 'sun.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CollectionSection', file: 'blue-1.webp', fold: 'Below', strategy: 'Lazy/GSAP', usedAtStartup: 'No' },
  { section: 'CollectionSection', file: 'pink-1.webp', fold: 'Below', strategy: 'Lazy/GSAP', usedAtStartup: 'No' },
  { section: 'Global/Root', file: 'luxury-bg.webp', fold: 'Above', strategy: 'Preload/CSS', usedAtStartup: 'Yes' },
  { section: 'Global/Mobile', file: 'new_BG-mobile.webp', fold: 'Above', strategy: 'CSS', usedAtStartup: 'Yes' },
  { section: 'Global/Root', file: 'soliva logo_high resolution.webp', fold: 'Above', strategy: 'Preload', usedAtStartup: 'Yes' },
  { section: 'Header', file: 'soliva-nav-new.webp', fold: 'Above', strategy: 'Eager', usedAtStartup: 'Yes' },
  { section: 'CompareSection', file: 'adjust-1.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CompareSection', file: 'adjust-5.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CompareSection', file: 'adjust-3.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CompareSection', file: 'adjust-2.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' },
  { section: 'CompareSection', file: 'adjust-4.webp', fold: 'Below', strategy: 'Lazy', usedAtStartup: 'No' }
];

const results = [];
let totalSize = 0;
let aboveFoldSize = 0;
let belowFoldSize = 0;

function getDimensions(file) {
    try {
        const out = execSync(`ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "${file}"`).toString().trim();
        return out || 'Unknown';
    } catch (e) {
        return 'Unknown';
    }
}

for (const img of imageReferences) {
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

        results.push({
            Section: img.section,
            'File Name': img.file,
            'Dimensions (WxH)': dimensions,
            'File Size (KB)': parseFloat(sizeInKB.toFixed(2)),
            Format: ext,
            'Above the Fold?': img.fold === 'Above' ? 'Yes' : 'No',
            'Loading Strategy': img.strategy,
            'Used at Startup?': img.usedAtStartup
        });

        totalSize += sizeInKB;
        if (img.fold === 'Above') aboveFoldSize += sizeInKB;
        else belowFoldSize += sizeInKB;
    } catch (e) {
        console.error("Could not read " + img.file, e.message);
    }
}

results.sort((a, b) => b['File Size (KB)'] - a['File Size (KB)']);

console.log('| Section | File Name | Dimensions (WxH) | File Size (KB/MB) | Format | Above the Fold? | Loading Strategy | Used at Startup? |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of results) {
    let sizeStr = r['File Size (KB)'] > 1024 ? `${(r['File Size (KB)'] / 1024).toFixed(2)} MB` : `${r['File Size (KB)']} KB`;
    console.log(`| ${r.Section} | ${r['File Name']} | ${r['Dimensions (WxH)']} | ${sizeStr} | ${r.Format} | ${r['Above the Fold?']} | ${r['Loading Strategy']} | ${r['Used at Startup?']} |`);
}

console.log('\n### Summary Calculation');
console.log(`- **Total homepage image weight:** ${(totalSize / 1024).toFixed(2)} MB`);
console.log(`- **Total above-the-fold image weight:** ${(aboveFoldSize / 1024).toFixed(2)} MB`);
console.log(`- **Total below-the-fold image weight:** ${(belowFoldSize / 1024).toFixed(2)} MB`);

console.log('\n### Optimization Candidates (Warnings)');
console.log('| Image | Current Size | Recommended Size | Potential Savings |');
console.log('|---|---|---|---|');
for (const r of results) {
    if (r['File Size (KB)'] > 500) {
        console.log(`| \`${r['File Name']}\` | ${(r['File Size (KB)'] / 1024).toFixed(2)} MB | ~150 KB | **~${((r['File Size (KB)'] - 150) / 1024).toFixed(2)} MB** |`);
    } else if (r['File Size (KB)'] > 200) {
        console.log(`| \`${r['File Name']}\` | ${r['File Size (KB)']} KB | ~100 KB | **~${r['File Size (KB)'] - 100} KB** |`);
    }
}
