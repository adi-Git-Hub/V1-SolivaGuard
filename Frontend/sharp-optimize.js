import sharp from 'sharp';
import fs from 'fs';

async function optimize() {
  // new_BG.webp
  const bgBeforeSize = fs.statSync('public/new_BG.webp').size;
  await sharp('public/new_BG.webp')
    .resize({ width: 1920 })
    .webp({ quality: 80, effort: 6 })
    .toFile('public/new_BG_optimized.tmp.webp');
  fs.renameSync('public/new_BG_optimized.tmp.webp', 'public/new_BG.webp');
  const bgAfterMeta = await sharp('public/new_BG.webp').metadata();
  const bgAfterSize = fs.statSync('public/new_BG.webp').size;

  console.log(`new_BG.webp:`);
  console.log(`  Before: 4096x6144, ${(bgBeforeSize / 1024).toFixed(2)} KB`);
  console.log(`  After : ${bgAfterMeta.width}x${bgAfterMeta.height}, ${(bgAfterSize / 1024).toFixed(2)} KB\n`);

  // IMG_6255.webp (using the working JPG as source)
  const img6255BeforeSize = fs.statSync('public/IMG_6255.webp').size;
  await sharp('public/IMG_6255.jpg')
    .resize({ width: 1000 })
    .webp({ quality: 80, effort: 6 })
    .toFile('public/IMG_6255.tmp.webp');
  fs.renameSync('public/IMG_6255.tmp.webp', 'public/IMG_6255.webp');
  const img6255AfterMeta = await sharp('public/IMG_6255.webp').metadata();
  const img6255AfterSize = fs.statSync('public/IMG_6255.webp').size;

  console.log(`IMG_6255.webp:`);
  console.log(`  Before: 3024x4032 (from JPG), ${(img6255BeforeSize / 1024).toFixed(2)} KB`);
  console.log(`  After : ${img6255AfterMeta.width}x${img6255AfterMeta.height}, ${(img6255AfterSize / 1024).toFixed(2)} KB\n`);

  // IMG_3739.webp (using the working JPG as source)
  const img3739BeforeSize = fs.statSync('public/IMG_3739.webp').size;
  await sharp('public/IMG_3739.jpg')
    .resize({ width: 1000 })
    .webp({ quality: 80, effort: 6 })
    .toFile('public/IMG_3739.tmp.webp');
  fs.renameSync('public/IMG_3739.tmp.webp', 'public/IMG_3739.webp');
  const img3739AfterMeta = await sharp('public/IMG_3739.webp').metadata();
  const img3739AfterSize = fs.statSync('public/IMG_3739.webp').size;

  console.log(`IMG_3739.webp:`);
  console.log(`  Before: 4032x3024 (from JPG), ${(img3739BeforeSize / 1024).toFixed(2)} KB`);
  console.log(`  After : ${img3739AfterMeta.width}x${img3739AfterMeta.height}, ${(img3739AfterSize / 1024).toFixed(2)} KB\n`);
}

optimize().catch(console.error);
