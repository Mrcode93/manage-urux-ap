import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Path to the source logo
const logoPath = path.join(__dirname, '../src/assets/images/logo.png');

async function generateIcons() {
  try {
    console.log('🔄 Generating PWA icons...');
    
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo file not found at:', logoPath);
      return;
    }

    // Generate icons for each size
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size} icon`);
    }

    // Generate maskable icon (with padding for safe area)
    const maskableSizes = [192, 512];
    for (const size of maskableSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);
      
      // Create a larger canvas with padding
      const padding = Math.floor(size * 0.1); // 10% padding
      const iconSize = size - (padding * 2);
      
      await sharp(logoPath)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size} maskable icon`);
    }

    console.log('🎉 All PWA icons generated successfully!');
    console.log('📁 Icons saved to:', iconsDir);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
