# 🎨 Avamon Metadata Setup - Complete Workflow

## Choose Your Upload Method:

### Option A: Pinata Web Interface (Recommended)
```
1. Upload 38 images to Pinata (35 cards + 3 packs)
2. Get Images CID from dashboard
3. yarn generate-metadata (creates templates)
4. yarn update-metadata YOUR_IMAGES_CID (adds actual IPFS links)
5. Upload updated metadata folders to Pinata
6. Get Cards & Packs metadata CIDs
7. yarn update-cids (updates contracts)
```

### Option B: Automated Scripts (Advanced)
```
1. Add 38 images to metadata/images/
2. yarn upload-ipfs (requires Pinata API keys)
3. Contracts auto-updated with real CIDs
```

---

## 📋 Step-by-Step: Pinata Web Method

### 1. Upload Images
- Go to [pinata.cloud](https://pinata.cloud) → Files → Upload
- Upload your PNG images: `1.png`, `2.png`, `pack_starter.png`, etc.
- **Copy the Images CID**: `QmYourImagesCID...`

### 2. Create Metadata JSON Files

**Create these files locally or in Pinata:**

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
    {"trait_type": "HP", "value": 1200},
    {"trait_type": "Element", "value": "Fire"}
  ]
}
```

### 3. Upload Metadata to Pinata
- Upload `cards/` folder → Get Cards CID
- Upload `packs/` folder → Get Packs CID

### 4. Update Contracts
```bash
# Interactive mode
yarn update-cids

# Or with arguments
yarn update-cids QmImagesCID QmCardsCID QmPacksCID
```

### 5. Deploy & Test
```bash
yarn compile
yarn deploy --tags AvamonCards
yarn deploy --tags AvamonPacks

# Test URLs
curl https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/1.json
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `yarn generate-metadata` | Create metadata JSON templates with placeholders |
| `yarn update-metadata <CID>` | Replace placeholders with actual IPFS links |
| `yarn upload-ipfs` | Full automation (requires Pinata API keys) |
| `yarn update-cids` | Update contracts with metadata CIDs |

---

## 📁 File Structure

```
packages/hardhat/
├── contracts/
│   ├── AvamonCards.sol     # ERC721 - points to IPFS
│   └── AvamonPacks.sol     # ERC1155 - points to IPFS
├── metadata/               # Your metadata files
│   ├── images/            # PNG files go here
│   ├── cards/             # Card JSON files
│   ├── packs/             # Pack JSON files
│   └── cids-manual.json   # Your CIDs (after upload)
├── scripts/
│   ├── generate-metadata.js    # Template generator
│   ├── upload-to-ipfs.js       # IPFS uploader
│   └── update-contract-cids.js # CID updater
└── pinata-setup-guide.md       # Detailed web upload guide
```

---

## 🔗 Test URLs Format

After updating contracts, test these URLs:

```
Card Metadata: https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/{tokenId}.json
Pack Metadata: https://gateway.pinata.cloud/ipfs/YOUR_PACKS_CID/{packId}.json
Card Image:    https://gateway.pinata.cloud/ipfs/YOUR_IMAGES_CID/{tokenId}.png
Pack Image:    https://gateway.pinata.cloud/ipfs/YOUR_IMAGES_CID/pack_{type}.png
```

**Specific Test URLs:**
```bash
# Test first card (Fire Drake - Common)
curl https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/1.json

# Test rare card (Inferno Dragon - Rare)
curl https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/21.json

# Test mythic card (Celestial Dragon - Mythic)
curl https://gateway.pinata.cloud/ipfs/YOUR_CARDS_CID/31.json

# Test all pack types
curl https://gateway.pinata.cloud/ipfs/YOUR_PACKS_CID/1.json  # Green Pack
curl https://gateway.pinata.cloud/ipfs/YOUR_PACKS_CID/2.json  # Blue Pack
curl https://gateway.pinata.cloud/ipfs/YOUR_PACKS_CID/3.json  # Red Pack
```

---

## ✅ Success Indicators

- [ ] Metadata URLs return valid JSON
- [ ] Image URLs load PNG files
- [ ] Contracts compile without errors
- [ ] Deployment succeeds
- [ ] OpenSea testnet displays NFTs correctly

---

## 🚨 Common Issues & Solutions

### "Metadata not loading"?
- Check CID format (should start with "Qm")
- Ensure files are pinned in Pinata
- Try different IPFS gateway

### "Contract won't compile"?
- Verify CID format in contracts
- Check for special characters in CIDs
- Ensure CIDs are properly quoted

### "OpenSea not showing images"?
- Wait 10-15 minutes for indexing
- Check image URLs in metadata
- Verify images are accessible

---

## 🎯 Quick Commands Summary

```bash
# After getting CIDs from Pinata
yarn update-cids

# Deploy contracts
yarn compile
yarn deploy --tags AvamonCards
yarn deploy --tags AvamonPacks
yarn deploy --tags AvamonCore

# Test deployment
yarn test --grep "Avamon"
```

---

## 📞 Need Help?

1. **Check the guides:**
   - `pinata-setup-guide.md` - Web upload detailed steps
   - `post-upload-steps.md` - What to do after upload
   - `AVAMON_CONTRACTS_README.md` - Full technical docs

2. **Test URLs first:**
   - Always test metadata URLs before deploying
   - Use `curl` or browser to verify JSON format

3. **Start with testnet:**
   - Deploy to Avalanche Fuji first
   - Test on OpenSea testnet
   - Verify everything works before mainnet

---

## 🎉 You're All Set!

Your Avamon TCG now has:
- ✅ **Decentralized metadata** on IPFS
- ✅ **Permanent storage** via Pinata
- ✅ **Fast delivery** via Pinata gateway
- ✅ **Marketplace ready** for OpenSea
- ✅ **No server costs** (free Pinata tier)

**Happy deploying! 🚀🎮**
