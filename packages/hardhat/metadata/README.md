# Avamon Metadata

This directory contains all NFT metadata and images for the Avamon TCG.

## Structure

```
metadata/
├── images/          # Card and pack images
├── cards/           # Card metadata JSON files
├── packs/           # Pack metadata JSON files
├── cids.json        # IPFS Content IDs after upload
└── README.md        # This file
```

## File Naming Convention

- **Images**: `{id}.png` for cards, `pack_{type}.png` for packs
- **Card Metadata**: `{id}.json`
- **Pack Metadata**: `{id}.json`

## IPFS Upload Process

1. Run `node scripts/generate-metadata.js` to create JSON files
2. Add your images to the `images/` directory
3. Run `node scripts/upload-to-ipfs.js` to upload to IPFS
4. Update your contracts with the CIDs from `cids.json`

## Updating Metadata

When you update metadata:

1. Make changes to the JSON files
2. Re-upload to IPFS (will get new CID)
3. Update contract URIs with new CID
4. Old metadata remains accessible at previous CID

## Notes

- Replace `IMAGES_CID` in JSON files with actual IPFS CID after upload
- All images should be PNG format with transparency
- Recommended image size: 1024x1024px for cards, 800x600px for packs
- Mythic cards support optional MP4 animations
