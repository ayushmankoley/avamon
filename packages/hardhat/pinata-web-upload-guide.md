# 🌐 Pinata Cloud Website Upload Guide

## Yes! You can upload everything through the Pinata website GUI. Here's how:

---

## 📋 Step-by-Step Web Upload Process

### Step 1: Create Pinata Account & Login
1. Go to [pinata.cloud](https://pinata.cloud)
2. Sign up for free account
3. Verify your email
4. Login to dashboard

---

### Step 2: Upload Your NFT Images

#### Option A: Upload Individual Images
1. **Go to "Files" section** in Pinata dashboard
2. **Click "Upload"** button
3. **Select your card images** (PNG format):
   - `1.png`, `2.png`, `3.png`, etc.
   - `pack_starter.png`, `pack_premium.png`, `pack_legendary.png`
4. **Wait for upload to complete**
5. **Copy the CID** from the file details (looks like: `QmYourImagesCID...`)

#### Option B: Upload as ZIP Folder
1. Create a folder called `images`
2. Put all your images inside
3. ZIP the folder: `images.zip`
4. Upload the ZIP file to Pinata
5. Pinata will extract and give you the folder CID

---

### Step 3: Create Metadata JSON Files

#### Method 1: Create Files Locally, Then Upload

1. **Create these JSON files on your computer:**

**metadata/cards/1.json:**
```json
{
  "name": "Fire Drake",
  "description": "A fierce dragon with flames that can melt steel",
  "image": "ipfs://YOUR_IMAGES_CID/1.png",
  "attributes": [
    {"trait_type": "Rarity", "value": "Common"},
    {"trait_type": "Attack", "value": 150},
    {"trait_type": "Defense", "value": 100},
    {"trait_type": "Agility", "value": 80},
    {"trait_type": "HP", "value": 1200},
    {"trait_type": "Element", "value": "Fire"}
  ]
}
```

**metadata/cards/2.json:**
```json
{
  "name": "Water Spirit",
  "description": "An ethereal being that controls the flow of water",
  "image": "ipfs://YOUR_IMAGES_CID/2.png",
  "attributes": [
    {"trait_type": "Rarity", "value": "Common"},
    {"trait_type": "Attack", "value": 120},
    {"trait_type": "Defense", "value": 140},
    {"trait_type": "Agility", "value": 90},
    {"trait_type": "HP", "value": 1300},
    {"trait_type": "Element", "value": "Water"}
  ]
}
```

**metadata/packs/1.json:**
```json
{
  "name": "Green Pack",
  "description": "Entry-level pack with fair chances for all rarities. Great for budget players.",
  "image": "ipfs://YOUR_IMAGES_CID/pack_green.png",
  "attributes": [
    {"trait_type": "Pack Type", "value": "Green"},
    {"trait_type": "Cards Per Pack", "value": 3},
    {"trait_type": "Rarity Distribution", "value": "70% Common, 25% Rare, 5% Mythic"}
  ]
}
```

**Note:** Create 3 pack JSON files:
- **1.json:** Green Pack (70% Common, 25% Rare, 5% Mythic)
- **2.json:** Blue Pack (50% Common, 35% Rare, 15% Mythic)
- **3.json:** Red Pack (30% Common, 40% Rare, 30% Mythic)

2. **Replace `YOUR_IMAGES_CID` with your actual images CID**
3. **Upload the JSON files** to Pinata
4. **Copy the metadata folder CID**

#### Method 2: Create Files Directly in Pinata

1. **Go to "Files" section**
2. **Click "Create File"**
3. **Create JSON files** directly in the browser
4. **Use the CID from your images upload**

---

### Step 4: Upload Metadata Files to Pinata

#### Upload Cards Metadata:
1. **Create a folder** called `cards` (or upload as ZIP)
2. **Upload all card JSON files** (`1.json`, `2.json`, etc.)
3. **Copy the CID** of the `cards` folder

#### Upload Packs Metadata:
1. **Create a folder** called `packs`
2. **Upload all pack JSON files** (`1.json`, `2.json`, etc.)
3. **Copy the CID** of the `packs` folder

---

### Step 5: Update Your Smart Contracts

#### Update AvamonCards.sol:
```solidity
// Replace YOUR_CARDS_CID with your actual cards folder CID
return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/", Strings.toString(tokenId), ".json"));
```

#### Update AvamonPacks.sol:
```solidity
// Replace YOUR_PACKS_CID with your actual packs folder CID
return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/YOUR_PACKS_CID/", Strings.toString(packId), ".json"));
```

---

## 🎯 Pinata Web Interface Screenshots Guide

### Files Upload Page:
```
Files → Upload → Select Files → Upload
```

### Getting CID:
```
1. Click on uploaded file/folder
2. Copy the "CID" value
3. CID looks like: QmYourCID...
```

### Creating Files:
```
Files → Create File → JSON → Paste content → Save
```

---

## 📊 Your CIDs Summary

After upload, you'll have:

```
📸 Images CID: QmYourImagesCID...
🎴 Cards Metadata CID: QmYourCardsMetadataCID...
📦 Packs Metadata CID: QmYourPacksMetadataCID...
```

---

## 🔧 Alternative: Use Pinata's Batch Upload

1. **Prepare all files** locally in this structure:
   ```
   avamon-metadata/
   ├── images/
   │   ├── 1.png
   │   ├── 2.png
   │   └── pack_starter.png
   ├── cards/
   │   ├── 1.json
   │   └── 2.json
   └── packs/
       └── 1.json
   ```

2. **ZIP the entire folder**: `avamon-metadata.zip`

3. **Upload ZIP to Pinata** - it will extract automatically

4. **Get the main folder CID** from the extracted files

---

## ✅ Testing Your Upload

Test your metadata URLs:

```bash
# Test card metadata
curl https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/1.json

# Test pack metadata
curl https://gateway.pinata.cloud/ipfs/YOUR_PACKS_CID/1.json

# Should return your JSON metadata
```

---

## 💡 Pro Tips for Pinata Web Upload

### 🏷️ Use Descriptive Names:
- File names: `fire-drake.png`, `celestial-dragon.png`
- Folder names: `avamon-cards-metadata`, `avamon-pack-metadata`

### 📁 Organize with Folders:
```
avamon-tcg/
├── card-images/
├── card-metadata/
└── pack-metadata/
```

### 🔒 Pinning Settings:
- Set files to "Pinned" status (free tier allows this)
- Use "Pin to IPFS" option
- Check "Make public" for web access

### 🌐 Custom Gateway (Paid Feature):
- Go to Gateway settings
- Create: `avamon.gateway.pinata.cloud`
- Use in contracts: `https://avamon.gateway.pinata.cloud/ipfs/YOUR_CID/`

---

## 🚨 Important Notes

1. **Free Tier Limits**: 1GB storage, 100 files
2. **Always Pin Files**: Unpinned files may disappear
3. **Backup CIDs**: Save your CIDs in a safe place
4. **Test URLs**: Verify all metadata loads correctly
5. **Gateway Reliability**: Pinata gateway is fast and reliable

---

## 🎯 Complete Workflow Summary

1. ✅ **Create Pinata account**
2. ✅ **Upload card images** → Get images CID
3. ✅ **Create metadata JSON files** with image URLs
4. ✅ **Upload metadata folders** → Get metadata CIDs
5. ✅ **Update smart contracts** with CIDs
6. ✅ **Test metadata URLs**
7. ✅ **Deploy contracts**

**That's it! Your NFTs are now on IPFS with permanent, decentralized storage!** 🚀

---

## 🔄 If You Need to Update Metadata

1. Create new JSON files with updated data
2. Upload to IPFS (gets new CID)
3. Update contract with new CID
4. Old metadata remains accessible forever

---

## 💰 Cost Comparison

| Method | Setup Time | Technical Skill | Cost |
|--------|------------|-----------------|------|
| **Pinata Web** | 30 mins | Beginner | $0 (free tier) |
| Command Line Scripts | 15 mins | Intermediate | $0 |
| Custom Server | 2+ hours | Advanced | $15/month |

**Pinata Web is perfect for most users!** 🎨✨
