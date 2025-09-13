#!/usr/bin/env node

/**
 * Replace CID Script
 * Replaces old CID with new CID in all metadata files
 * Usage: node scripts/replace-cid.js <oldCID> <newCID>
 */

const fs = require('fs');
const path = require('path');

function replaceCIDInFiles(oldCID, newCID) {
  console.log('🔄 Replacing CID in metadata files...');
  console.log(`📍 Old CID: ${oldCID}`);
  console.log(`📍 New CID: ${newCID}`);
  console.log('');

  const metadataDir = path.join(__dirname, '..', 'metadata');
  let filesUpdated = 0;

  // Update card metadata files
  const cardsDir = path.join(metadataDir, 'cards');
  if (fs.existsSync(cardsDir)) {
    const cardFiles = fs.readdirSync(cardsDir).filter(file => file.endsWith('.json'));

    cardFiles.forEach(file => {
      const filePath = path.join(cardsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      if (content.includes(oldCID)) {
        const updatedContent = content.replace(new RegExp(oldCID, 'g'), newCID);
        fs.writeFileSync(filePath, updatedContent);
        filesUpdated++;
        console.log(`   ✅ Updated cards/${file}`);
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

      if (content.includes(oldCID)) {
        const updatedContent = content.replace(new RegExp(oldCID, 'g'), newCID);
        fs.writeFileSync(filePath, updatedContent);
        filesUpdated++;
        console.log(`   ✅ Updated packs/${file}`);
      }
    });
  }

  console.log('');
  console.log(`🎉 Updated ${filesUpdated} files successfully!`);
}

// Check command line arguments
const oldCID = process.argv[2];
const newCID = process.argv[3];

if (!oldCID || !newCID) {
  console.error('❌ Please provide both old and new CIDs');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/replace-cid.js <oldCID> <newCID>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/replace-cid.js bafybeiedzbihgqlfhdjqgzefe3os2gjdh3klnkwsiuafjng42we4lr3o6a bafybeifrma7imifpowji6tp7vv5k4dr2hphenwpnqsrb6oimbnrjpnrrvu');
  process.exit(1);
}

replaceCIDInFiles(oldCID, newCID);
