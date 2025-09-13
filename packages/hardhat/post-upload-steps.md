# 🎯 After Pinata Upload: Complete Setup Guide

## ✅ You've Uploaded to Pinata Web - Now What?

After getting your CIDs from Pinata, here's exactly what to do next:

---

## Step 1: Update Contract CIDs

### Replace the Placeholder CIDs in Your Contracts

**In AvamonCards.sol:**
```solidity
// Line ~125: Replace YOUR_CARDS_CID
return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/QmYourCardsMetadataCID/", Strings.toString(tokenId), ".json"));
```

**In AvamonPacks.sol:**
```solidity
// Line ~111: Replace YOUR_PACKS_CID
return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/QmYourPacksMetadataCID/", Strings.toString(packId), ".json"));
```

---

## Step 2: Test Your Metadata URLs

### Before Deploying, Verify Everything Works:

```bash
# Test card metadata (replace with your actual CIDs)
curl https://gateway.pinata.cloud/ipfs/QmYourCardsMetadataCID/1.json

# Should return JSON like:
{
  "name": "Fire Drake",
  "description": "A fierce dragon...",
  "image": "ipfs://QmYourImagesCID/1.png",
  "attributes": [...]
}

# Test pack metadata
curl https://gateway.pinata.cloud/ipfs/QmYourPacksMetadataCID/1.json

# Test image URL (should load your PNG)
curl https://gateway.pinata.cloud/ipfs/QmYourImagesCID/1.png
```

---

## Step 3: Deploy Your Contracts

### Deploy in Correct Order:

```bash
# 1. Deploy AvamonToken (no dependencies)
yarn deploy --tags AvamonToken

# 2. Deploy AvamonCards (no dependencies)
yarn deploy --tags AvamonCards

# 3. Deploy AvamonPacks (no dependencies)
yarn deploy --tags AvamonPacks

# 4. Deploy AvamonCore (requires the above addresses)
yarn deploy --tags AvamonCore
```

---

## Step 4: Verify Contract Addresses

After deployment, check your deployment files:

```bash
# Check deployed contract addresses
cat packages/hardhat/deployments/localhost/

# You should see:
# AvamonToken.json
# AvamonCards.json
# AvamonPacks.json
# AvamonCore.json
```

---

## Step 5: Test Contract Functionality

### Quick Test Commands:

```bash
# Compile and test
yarn compile
yarn test

# Check gas usage
yarn test --gas

# Run specific test
yarn test --grep "Avamon"
```

---

## Step 6: Frontend Integration

### Update Your Frontend Contract Addresses

**In packages/nextjs/contracts/externalContracts.ts:**

```typescript
export const externalContracts = {
  AvamonToken: {
    address: {
      // Add your deployed addresses here
      43113: "0x...", // Fuji testnet
      43114: "0x...", // Avalanche mainnet
    },
  },
  AvamonCards: {
    address: {
      43113: "0x...",
      43114: "0x...",
    },
  },
  AvamonPacks: {
    address: {
      43113: "0x...",
      43114: "0x...",
    },
  },
  AvamonCore: {
    address: {
      43113: "0x...",
      43114: "0x...",
    },
  },
} as const;
```

---

## Step 7: Test on Avalanche Fuji Testnet

### Deploy to Testnet:

```bash
# Switch to Fuji testnet
yarn deploy --network avalancheFuji

# Or deploy all at once
yarn deploy --network avalancheFuji
```

### Get Test AVAX:
- Go to [faucet.avax.network](https://faucet.avax.network)
- Request test AVAX for your deployer address

---

## Step 8: Verify on Snowtrace (Avalanche Explorer)

### Check Your Contracts:

1. Go to [snowtrace.io](https://snowtrace.io) (Fuji) or [snowtrace.io](https://snowtrace.io) (mainnet)
2. Search for your contract addresses
3. Verify contracts if needed
4. Test NFT functionality

---

## Step 9: Test NFT Marketplaces

### OpenSea Testnet:

1. Go to [testnets.opensea.io](https://testnets.opensea.io)
2. Connect wallet to Avalanche Fuji
3. Search for your NFT contract
4. Verify metadata loads correctly

### Format for OpenSea:
```
Contract Address: 0xYourAvamonCardsAddress
Token ID: 1
```

---

## 🎯 Your Complete CID Reference

Create a file to track your CIDs:

**metadata/cids-manual.json:**
```json
{
  "imagesCID": "QmYourImagesCID...",
  "cardsMetadataCID": "QmYourCardsMetadataCID...",
  "packsMetadataCID": "QmYourPacksMetadataCID...",
  "contracts": {
    "AvamonToken": "0x...",
    "AvamonCards": "0x...",
    "AvamonPacks": "0x...",
    "AvamonCore": "0x..."
  },
  "network": "avalanche-fuji",
  "uploadDate": "2024-01-XX",
  "notes": "Uploaded via Pinata web interface"
}
```

---

## 🔧 Troubleshooting

### If Metadata Doesn't Load:

1. **Check CID Format:**
   ```bash
   # Should be: Qm... (not ipfs://Qm...)
   curl https://gateway.pinata.cloud/ipfs/QmYourCID/1.json
   ```

2. **Verify Pinata Pinning:**
   - Go to Pinata dashboard
   - Check if files are "Pinned"
   - Ensure files are set to "Public"

3. **Test Different Gateway:**
   ```bash
   # Try alternative gateways
   curl https://dweb.link/ipfs/QmYourCID/1.json
   curl https://cloudflare-ipfs.com/ipfs/QmYourCID/1.json
   ```

### If Contract Deployment Fails:

1. **Check Gas Limit:**
   ```typescript
   // In deployment scripts, increase gas limit
   gasLimit: 8000000,
   ```

2. **Verify VRF Setup:**
   ```typescript
   // Make sure you have VRF subscription on Fuji
   subscriptionId: 1, // Your actual subscription ID
   ```

3. **Check Contract Dependencies:**
   ```bash
   # Deploy in correct order
   yarn deploy --tags AvamonToken
   yarn deploy --tags AvamonCards
   yarn deploy --tags AvamonPacks
   yarn deploy --tags AvamonCore
   ```

---

## 🚀 Going to Production

### When Ready for Mainnet:

1. **Update VRF Configuration:**
   ```typescript
   // In AvamonCore deployment
   vrfCoordinator: "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",
   subscriptionId: YOUR_MAINNET_SUBSCRIPTION,
   ```

2. **Deploy to Mainnet:**
   ```bash
   yarn deploy --network avalanche
   ```

3. **Verify on Mainnet Snowtrace:**
   - [snowtrace.io](https://snowtrace.io)

4. **List on OpenSea:**
   - [opensea.io](https://opensea.io)

---

## 📊 Success Checklist

- [ ] ✅ CIDs updated in contracts
- [ ] ✅ Metadata URLs tested
- [ ] ✅ Contracts deployed successfully
- [ ] ✅ Frontend addresses updated
- [ ] ✅ Testnet functionality verified
- [ ] ✅ OpenSea testnet working
- [ ] ✅ Ready for mainnet deployment

---

## 🎉 Congratulations!

**You've successfully created a fully decentralized NFT TCG with:**

- ✅ **IPFS Metadata** (permanent storage)
- ✅ **Pinata Hosting** (fast delivery)
- ✅ **Multi-Contract Architecture** (gas optimized)
- ✅ **VRF Integration** (provably fair randomness)
- ✅ **Scaffold-ETH 2 Ready** (frontend integration)

Your Avamon TCG is now ready to mint cards, open packs, and provide players with a fully decentralized gaming experience! 🚀🎮
