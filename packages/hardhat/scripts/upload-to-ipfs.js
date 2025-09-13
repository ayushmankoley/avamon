#!/usr/bin/env node

/**
 * IPFS Upload Script for Avamon NFT Metadata
 * Usage: node scripts/upload-to-ipfs.js
 */

const fs = require('fs');
const path = require('path');
const { PinataSDK } = require('@pinata/sdk');

// Configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || 'YOUR_PINATA_API_KEY';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || 'YOUR_PINATA_SECRET_KEY';

const pinata = new PinataSDK(PINATA_API_KEY, PINATA_SECRET_KEY);

// File structure
const METADATA_DIR = path.join(__dirname, '..', 'metadata');
const IMAGES_DIR = path.join(METADATA_DIR, 'images');
const CARDS_DIR = path.join(METADATA_DIR, 'cards');
const PACKS_DIR = path.join(METADATA_DIR, 'packs');

async function uploadToIPFS() {
  try {
    console.log('🚀 Starting IPFS upload process...\n');

    // Step 1: Upload images
    console.log('📸 Uploading images...');
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error('❌ Images directory not found:', IMAGES_DIR);
      return;
    }

    const imagesResult = await pinata.pinFromFS(IMAGES_DIR, {
      pinataMetadata: {
        name: 'Avamon Card Images',
        keyvalues: {
          type: 'images',
          project: 'avamon-tcg'
        }
      }
    });

    const imagesCID = imagesResult.IpfsHash;
    console.log('✅ Images uploaded successfully!');
    console.log('📍 Images CID:', imagesCID);
    console.log('🔗 Gateway URL:', `https://gateway.pinata.cloud/ipfs/${imagesCID}/\n`);

    // Step 2: Update metadata files with image URLs
    console.log('📝 Updating metadata files with image URLs...');

    if (!fs.existsSync(CARDS_DIR)) {
      console.error('❌ Cards metadata directory not found:', CARDS_DIR);
      return;
    }

    const cardFiles = fs.readdirSync(CARDS_DIR).filter(file => file.endsWith('.json'));

    for (const file of cardFiles) {
      const filePath = path.join(CARDS_DIR, file);
      const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Update image URL to use IPFS
      if (metadata.image && (metadata.image.includes('placeholder') || metadata.image.includes('IMAGES_CID_PLACEHOLDER'))) {
        const imageName = file.replace('.json', '.png');
        metadata.image = `ipfs://${imagesCID}/${imageName}`;
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
        console.log(`   ✓ Updated ${file}`);
      }
    }

    // Step 3: Upload cards metadata
    console.log('\n📚 Uploading cards metadata...');
    const cardsResult = await pinata.pinFromFS(CARDS_DIR, {
      pinataMetadata: {
        name: 'Avamon Cards Metadata',
        keyvalues: {
          type: 'cards-metadata',
          project: 'avamon-tcg'
        }
      }
    });

    const cardsCID = cardsResult.IpfsHash;
    console.log('✅ Cards metadata uploaded successfully!');
    console.log('📍 Cards CID:', cardsCID);
    console.log('🔗 Gateway URL:', `https://gateway.pinata.cloud/ipfs/${cardsCID}/\n`);

    // Step 4: Upload packs metadata
    if (fs.existsSync(PACKS_DIR)) {
      console.log('📦 Uploading packs metadata...');
      const packsResult = await pinata.pinFromFS(PACKS_DIR, {
        pinataMetadata: {
          name: 'Avamon Packs Metadata',
          keyvalues: {
            type: 'packs-metadata',
            project: 'avamon-tcg'
          }
        }
      });

      const packsCID = packsResult.IpfsHash;
      console.log('✅ Packs metadata uploaded successfully!');
      console.log('📍 Packs CID:', packsCID);
      console.log('🔗 Gateway URL:', `https://gateway.pinata.cloud/ipfs/${packsCID}/\n`);

      // Save pack CID
      fs.writeFileSync(path.join(METADATA_DIR, 'packs-cid.txt'), packsCID);
    }

    // Step 5: Save CIDs for contract deployment
    const cidData = {
      imagesCID,
      cardsCID,
      timestamp: new Date().toISOString(),
      network: 'ipfs'
    };

    fs.writeFileSync(path.join(METADATA_DIR, 'cids.json'), JSON.stringify(cidData, null, 2));
    fs.writeFileSync(path.join(METADATA_DIR, 'cards-cid.txt'), cardsCID);

    console.log('💾 CIDs saved to metadata/cids.json');
    console.log('\n🎉 Upload complete!');
    console.log('📋 Summary:');
    console.log('   Images CID:', imagesCID);
    console.log('   Cards CID:', cardsCID);

    if (fs.existsSync(PACKS_DIR)) {
      console.log('   Packs CID:', packsCID);
    }

    console.log('\n🔧 Update your contracts with these CIDs:');
    console.log(`   AvamonCards: https://gateway.pinata.cloud/ipfs/${cardsCID}/`);
    if (fs.existsSync(PACKS_DIR)) {
      console.log(`   AvamonPacks: https://gateway.pinata.cloud/ipfs/${packsCID}/`);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Check if API keys are configured
if (PINATA_API_KEY === 'YOUR_PINATA_API_KEY' || PINATA_SECRET_KEY === 'YOUR_PINATA_SECRET_KEY') {
  console.error('❌ Please configure your Pinata API keys in environment variables:');
  console.error('   PINATA_API_KEY=your_api_key');
  console.error('   PINATA_SECRET_KEY=your_secret_key');
  process.exit(1);
}

// Run the upload
uploadToIPFS();
