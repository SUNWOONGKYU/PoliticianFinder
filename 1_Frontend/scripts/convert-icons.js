/**
 * SVG to PNG 변환 스크립트
 * 실행: node scripts/convert-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');

async function convertSvgToPng(svgPath, pngPath, width, height) {
  try {
    await sharp(svgPath)
      .resize(width, height)
      .png()
      .toFile(pngPath);
    console.log(`✅ ${path.basename(pngPath)} 생성 완료`);
  } catch (error) {
    console.error(`❌ ${path.basename(pngPath)} 변환 실패:`, error.message);
  }
}

async function main() {
  console.log('🎨 SVG → PNG 변환 시작...\n');

  // OG Image (1200x630)
  const ogSvg = path.join(publicDir, 'og-image.svg');
  const ogPng = path.join(publicDir, 'og-image.png');
  if (fs.existsSync(ogSvg)) {
    await convertSvgToPng(ogSvg, ogPng, 1200, 630);
  }

  // PWA Icons
  const icons = [
    { svg: 'icon-512x512.svg', png: 'icon-512x512.png', size: 512 },
    { svg: 'icon-192x192.svg', png: 'icon-192x192.png', size: 192 },
    { svg: 'apple-touch-icon.svg', png: 'apple-touch-icon.png', size: 180 },
  ];

  for (const icon of icons) {
    const svgPath = path.join(iconsDir, icon.svg);
    const pngPath = path.join(iconsDir, icon.png);
    if (fs.existsSync(svgPath)) {
      await convertSvgToPng(svgPath, pngPath, icon.size, icon.size);
    }
  }

  // Favicon (from 512 icon, resize to 32x32)
  const icon512 = path.join(iconsDir, 'icon-512x512.svg');
  const favicon16 = path.join(publicDir, 'favicon-16x16.png');
  const favicon32 = path.join(publicDir, 'favicon-32x32.png');

  if (fs.existsSync(icon512)) {
    await convertSvgToPng(icon512, favicon16, 16, 16);
    await convertSvgToPng(icon512, favicon32, 32, 32);
  }

  console.log('\n✅ 변환 완료!');
}

main().catch(console.error);
