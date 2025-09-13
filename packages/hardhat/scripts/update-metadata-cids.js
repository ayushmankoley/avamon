#!/usr/bin/env node

/**
 * Update Metadata CIDs Script
 * Updates generated metadata files with actual IPFS CIDs
 * Usage: node scripts/update-metadata-cids.js <imagesCID>
 */

const fs = require('fs');
const path = require('path');

function updateMetadataFiles(imagesCID) {
  console.log('🔄 Updating metadata files with actual IPFS CID...');
  console.log(`📍 Images CID: ${imagesCID}`);
  console.log('');

  const metadataDir = path.join(__dirname, '..', 'metadata');

  // Update card metadata files
  const cardsDir = path.join(metadataDir, 'cards');
  if (fs.existsSync(cardsDir)) {
    const cardFiles = fs.readdirSync(cardsDir).filter(file => file.endsWith('.json'));

    cardFiles.forEach(file => {
      const filePath = path.join(cardsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace the placeholder with actual CID
      const updatedContent = content.replace(/IMAGES_CID_PLACEHOLDER/g, imagesCID);

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`   ✅ Updated ${file}`);
      }
    });
  }

  // Update pack metadata files
  const packsDir = path.join(metadataDir, 'packs');
  if (fs.existsSync(packsDir)) {
    const packFiles = fs.readdirSync(packsDir).filter(file => file.endsWith('.json'));

    packFiles.forEach(file => {
      const filePath = path.join(packsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace the placeholder with actual CID
      const updatedContent = content.replace(/IMAGES_CID_PLACEHOLDER/g, imagesCID);

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`   ✅ Updated ${file}`);
      }
    });
  }

  console.log('');
  console.log('🎉 Metadata files updated successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Upload the updated metadata folders to Pinata');
  console.log('2. Get the Cards and Packs metadata CIDs');
  console.log('3. Update contracts: yarn update-cids');
}

// Check command line arguments
const imagesCID = process.argv[2];

if (!imagesCID) {
  console.error('❌ Please provide the images CID as an argument');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/update-metadata-cids.js <imagesCID>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/update-metadata-cids.js QmYourImagesCID...');
  process.exit(1);
}

if (!imagesCID.startsWith('Qm') && !imagesCID.startsWith('bafy')) {
  console.error('❌ Invalid CID format. Should start with "Qm" or "bafy"');
  process.exit(1);
}

updateMetadataFiles(imagesCID);
