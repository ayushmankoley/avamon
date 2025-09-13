# 🛰️ IPFS-Only Metadata Setup with Pinata

## Prerequisites
1. [Pinata Account](https://pinata.cloud) (Free tier available)
2. [IPFS Desktop](https://ipfs.io/install/) or CLI tools
3. Your NFT images and metadata JSON files

## 📁 File Structure
```
metadata/
├── images/
│   ├── 1.png
│   ├── 2.png
│   └── 3.png
├── cards/
│   ├── 1.json
│   ├── 2.json
│   └── 3.json
└── packs/
    ├── 1.json
    └── 2.json
```

## 🚀 Step-by-Step Setup

### 1. Upload Images to Pinata

```bash
# Install Pinata CLI
npm install -g pinata-cli

# Authenticate
pinata auth

# Upload images folder
pinata pin add ./metadata/images/
```

**Expected Output:**
```
CID: QmYourImagesCID...
Status: Pinned
```

### 2. Create Metadata JSON Files

**cards/1.json:**
```json
{
  "name": "Fire Drake",
  "description": "A fierce dragon with flames that can melt steel",
  "image": "ipfs://QmYourImagesCID/1.png",
  "attributes": [
    {"trait_type": "Rarity", "value": "Common"},
    {"trait_type": "Attack", "value": 150},
    {"trait_type": "Defense", "value": 100},
    {"trait_type": "Agility", "value": 80},
    {"trait_type": "HP", "value": 1200}
  ]
}
```

**packs/1.json:**
```json
{
  "name": "Starter Pack",
  "description": "Contains 3 random cards",
  "image": "ipfs://QmYourImagesCID/pack_starter.png",
  "attributes": [
    {"trait_type": "Pack Type", "value": "Starter"},
    {"trait_type": "Cards", "value": 3}
  ]
}
```

### 3. Upload Metadata Folders to Pinata

```bash
# Upload cards metadata
pinata pin add ./metadata/cards/

# Upload packs metadata
pinata pin add ./metadata/packs/
```

**Expected Output:**
```
Cards CID: QmYourCardsMetadataCID...
Packs CID: QmYourPacksMetadataCID...
```

### 4. Update Contract URIs

Replace the placeholder CIDs in your contracts:

**AvamonCards.sol:**
```solidity
return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/QmYourCardsMetadataCID/", Strings.toString(tokenId), ".json"));
```

**AvamonPacks.sol:**
```solidity
return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/QmYourPacksMetadataCID/", Strings.toString(packId), ".json"));
```

### 5. Test Your Setup

```bash
# Test a card metadata URL
curl https://gateway.pinata.cloud/ipfs/QmYourCardsMetadataCID/1.json

# Should return your JSON metadata
```

## 🔧 Alternative IPFS Gateways

If Pinata gateway is slow, use these alternatives:

```solidity
// Cloudflare IPFS Gateway
"ipfs://QmYourCID/filename.json"

// Protocol Labs Gateway
"https://dweb.link/ipfs/QmYourCID/filename.json"

// Infura IPFS Gateway
"https://YOUR_PROJECT_ID.infura-ipfs.io/ipfs/QmYourCID/filename.json"
```

## 📊 Pinata Dashboard Features

### Dedicated Gateway
1. Go to Pinata Dashboard → Gateway
2. Create a dedicated gateway: `avamon.gateway.pinata.cloud`
3. Use in contracts:
```solidity
"https://avamon.gateway.pinata.cloud/ipfs/QmYourCID/"
```

### Auto-Pinning
Set up webhooks to automatically pin new metadata when cards are minted.

## 🛠️ Automation Script

**upload-to-ipfs.js:**
```javascript
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');

const pinata = new pinataSDK('YOUR_API_KEY', 'YOUR_SECRET_KEY');

async function uploadMetadata() {
  try {
    // Upload images first
    const imagesResult = await pinata.pinFromFS('./metadata/images/');
    const imagesCID = imagesResult.IpfsHash;

    console.log('Images CID:', imagesCID);

    // Create metadata files with image URLs
    const metadataDir = './metadata/cards/';

    // Upload metadata
    const metadataResult = await pinata.pinFromFS(metadataDir);
    const metadataCID = metadataResult.IpfsHash;

    console.log('Metadata CID:', metadataCID);

    return { imagesCID, metadataCID };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
  }
}

uploadMetadata();
```

## ✅ Verification Checklist

- [ ] Images uploaded and pinned to IPFS
- [ ] Metadata JSON files reference correct image CIDs
- [ ] Metadata folder uploaded and pinned
- [ ] Contract URIs updated with correct CIDs
- [ ] Test URLs return valid JSON
- [ ] NFTs display correctly on OpenSea testnet

## 🔄 Updating Metadata

To update existing metadata:

1. Create new metadata files
2. Upload to IPFS (get new CID)
3. Update contract with new CID
4. Old metadata remains accessible at previous CID

## 💰 Cost Considerations

**Pinata Free Tier:**
- 1GB storage
- 100 files
- Community gateway

**Pinata Paid Plans:**
- Unlimited storage
- Dedicated gateways
- Higher rate limits
- Priority support

## 🚨 Important Notes

1. **Pinning is Essential**: Files not pinned may disappear from IPFS
2. **Gateway Reliability**: Use multiple gateways as fallbacks
3. **CID Permanence**: Once pinned, your CID will always work
4. **Metadata Immutability**: Changes require new uploads and contract updates

## 🎯 Best Practices

- Use descriptive filenames: `celestial-dragon.png`
- Include all required metadata fields
- Test on multiple marketplaces
- Keep backup copies of all files
- Document your CIDs for future reference

Your NFTs are now fully decentralized with IPFS! 🎨🚀
