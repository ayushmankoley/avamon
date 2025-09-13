#!/usr/bin/env node

/**
 * CID Update Script for Avamon Contracts
 * Updates contract files with IPFS CIDs from Pinata
 * Usage: node scripts/update-contract-cids.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateContractCID(contractPath, oldCID, newCID, description) {
  const fullPath = path.join(__dirname, '..', contractPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Contract file not found: ${fullPath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  if (!content.includes(oldCID)) {
    console.log(`⚠️  Warning: ${oldCID} not found in ${contractPath}`);
    return false;
  }

  const updatedContent = content.replace(new RegExp(oldCID, 'g'), newCID);

  fs.writeFileSync(fullPath, updatedContent);

  console.log(`✅ Updated ${description} CID in ${contractPath}`);
  console.log(`   ${oldCID} → ${newCID}`);

  return true;
}

async function main() {
  console.log('🎯 Avamon Contract CID Updater');
  console.log('==============================');
  console.log('');

  try {
    // Get CIDs from user
    console.log('📋 Please provide your IPFS CIDs from Pinata:');
    console.log('');

    const imagesCID = await ask('Images CID (Qm...): ');
    if (!imagesCID.startsWith('Qm') && !imagesCID.startsWith('bafy')) {
      console.error('❌ Invalid CID format. Should start with "Qm" or "bafy"');
      rl.close();
      return;
    }

    const cardsMetadataCID = await ask('Cards Metadata CID (Qm... or bafy...): ');
    if (!cardsMetadataCID.startsWith('Qm') && !cardsMetadataCID.startsWith('bafy')) {
      console.error('❌ Invalid CID format. Should start with "Qm" or "bafy"');
      rl.close();
      return;
    }

    const packsMetadataCID = await ask('Packs Metadata CID (Qm... or bafy...): ');
    if (!packsMetadataCID.startsWith('Qm') && !packsMetadataCID.startsWith('bafy')) {
      console.error('❌ Invalid CID format. Should start with "Qm" or "bafy"');
      rl.close();
      return;
    }

    console.log('');
    console.log('🔄 Updating contracts with your CIDs...');
    console.log('');

    // Update AvamonCards.sol
    await updateContractCID(
      'contracts/AvamonCards.sol',
      'YOUR_METADATA_CID',
      cardsMetadataCID,
      'Cards metadata'
    );

    // Update AvamonPacks.sol
    await updateContractCID(
      'contracts/AvamonPacks.sol',
      'YOUR_PACKS_CID',
      packsMetadataCID,
      'Packs metadata'
    );

    // Update AvamonCards.sol with images CID reference (for documentation)
    await updateContractCID(
      'contracts/AvamonCards.sol',
      'YOUR_IMAGES_CID',
      imagesCID,
      'Images reference'
    );

    // Update AvamonPacks.sol with images CID reference
    await updateContractCID(
      'contracts/AvamonPacks.sol',
      'YOUR_IMAGES_CID',
      imagesCID,
      'Images reference'
    );

    // Save CIDs to file for reference
    const cidData = {
      imagesCID,
      cardsMetadataCID,
      packsMetadataCID,
      updatedAt: new Date().toISOString(),
      method: 'manual-pinata-upload'
    };

    const cidFilePath = path.join(__dirname, '..', 'metadata', 'cids-manual.json');
    fs.writeFileSync(cidFilePath, JSON.stringify(cidData, null, 2));

    console.log('');
    console.log('💾 CIDs saved to metadata/cids-manual.json');
    console.log('');
    console.log('🎉 Contract updates complete!');
    console.log('');
    console.log('📋 Your CIDs:');
    console.log(`   Images: ${imagesCID}`);
    console.log(`   Cards:  ${cardsMetadataCID}`);
    console.log(`   Packs:  ${packsMetadataCID}`);
    console.log('');
    console.log('🔗 Test URLs:');
    console.log(`   Card 1:  https://gateway.pinata.cloud/ipfs/${cardsMetadataCID}/1.json`);
    console.log(`   Pack 1:  https://gateway.pinata.cloud/ipfs/${packsMetadataCID}/1.json`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Run: yarn compile');
    console.log('2. Run: yarn deploy --tags AvamonCards');
    console.log('3. Run: yarn deploy --tags AvamonPacks');
    console.log('4. Test your metadata URLs above');

  } catch (error) {
    console.error('❌ Error updating contracts:', error.message);
  } finally {
    rl.close();
  }
}

// Check if user provided CIDs as command line arguments
if (process.argv.length >= 5) {
  console.log('📋 Using CIDs from command line arguments...');

  const [,, imagesCID, cardsMetadataCID, packsMetadataCID] = process.argv;

  if ((!imagesCID.startsWith('Qm') && !imagesCID.startsWith('bafy')) ||
      (!cardsMetadataCID.startsWith('Qm') && !cardsMetadataCID.startsWith('bafy')) ||
      (!packsMetadataCID.startsWith('Qm') && !packsMetadataCID.startsWith('bafy'))) {
    console.error('❌ Invalid CID format. All CIDs should start with "Qm" or "bafy"');
    console.log('Usage: node scripts/update-contract-cids.js <imagesCID> <cardsCID> <packsCID>');
    process.exit(1);
  }

  // Update contracts directly
  updateContractCID(
    'contracts/AvamonCards.sol',
    'YOUR_METADATA_CID',
    cardsMetadataCID,
    'Cards metadata'
  );

  updateContractCID(
    'contracts/AvamonPacks.sol',
    'YOUR_PACKS_CID',
    packsMetadataCID,
    'Packs metadata'
  );

  updateContractCID(
    'contracts/AvamonCards.sol',
    'YOUR_IMAGES_CID',
    imagesCID,
    'Images reference'
  );

  updateContractCID(
    'contracts/AvamonPacks.sol',
    'YOUR_IMAGES_CID',
    imagesCID,
    'Images reference'
  );

  // Save CIDs
  const cidData = {
    imagesCID,
    cardsMetadataCID,
    packsMetadataCID,
    updatedAt: new Date().toISOString(),
    method: 'cli-arguments'
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'metadata', 'cids-manual.json'),
    JSON.stringify(cidData, null, 2)
  );

  console.log('✅ Contracts updated successfully!');
  console.log('🔗 Test URLs:');
  console.log(`   Card 1:  https://gateway.pinata.cloud/ipfs/${cardsMetadataCID}/1.json`);
  console.log(`   Pack 1:  https://gateway.pinata.cloud/ipfs/${packsMetadataCID}/1.json`);

} else {
  // Interactive mode
  main();
}
