# Avamon TCG Deployment Guide

## Overview

The Avamon TCG system consists of **5 separate contracts** that work together:

1. **AvamonToken** - ERC20 token ($AM)
2. **AvamonCards** - ERC721 NFT cards
3. **AvamonPacks** - ERC1155 pack tokens
4. **AvamonCore** - Main game logic (player functions, VRF integration)
5. **AvamonAdmin** - Administrative functions (separated for size optimization)

## Deployment Order

Contracts **MUST** be deployed in this exact order due to dependencies:

```
1. AvamonToken
2. AvamonCards
3. AvamonPacks
4. AvamonCore (requires addresses of 1-3)
5. AvamonAdmin (requires addresses of 1-4)
```

## Fuji Testnet Deployment

### Step 1: Deploy Token Contracts

```bash
# Deploy AvamonToken
yarn deploy --network avalancheFuji --tags AvamonToken

# Deploy AvamonCards
yarn deploy --network avalancheFuji --tags AvamonCards

# Deploy AvamonPacks
yarn deploy --network avalancheFuji --tags AvamonPacks
```

### Step 2: Deploy Core Contract

```bash
# Deploy AvamonCore (requires token contract addresses)
yarn deploy --network avalancheFuji --tags AvamonCore
```

### Step 3: Deploy Admin Contract

```bash
# Deploy AvamonAdmin (requires all contract addresses)
yarn deploy --network avalancheFuji --tags AvamonAdmin
```

### Step 4: Update Environment Variables

After deployment, update your `.env` file with the deployed addresses:

```env
AVAMON_TOKEN_ADDRESS=0x...
AVAMON_CARDS_ADDRESS=0x...
AVAMON_PACKS_ADDRESS=0x...
AVAMON_CORE_ADDRESS=0x...
AVAMON_ADMIN_ADDRESS=0x...
```

### Step 5: Setup Game Data

Run the automated setup script:

```bash
# Set up game data (card templates, pack types, adventures, quests)
yarn setup
```

## Manual Setup (Alternative)

If you prefer manual setup, you can run individual setup commands:

```bash
# Create card templates
npx hardhat run scripts/setup-game.ts --network avalancheFuji

# Or run specific functions via debug interface
# Access http://localhost:3000/debug after starting frontend
```

## Contract Sizes

| Contract | Size | Status |
|----------|------|--------|
| AvamonToken | ~10KB | ✅ Deployable |
| AvamonCards | ~15KB | ✅ Deployable |
| AvamonPacks | ~12KB | ✅ Deployable |
| AvamonCore | ~20KB | ✅ Deployable (under 24KB limit) |
| AvamonAdmin | ~8KB | ✅ Deployable |

## VRF Setup

For Fuji testnet, ensure you have:

1. **VRF Subscription ID**: Create a subscription at https://vrf.chain.link/
2. **LINK Tokens**: Fund your subscription with test LINK
3. **Environment Variables**:
   ```env
   VRF_SUBSCRIPTION_ID=12345
   ```

## Post-Deployment Verification

1. **Check Contract Sizes**: All contracts should be under 24KB
2. **Test Admin Functions**: Use AvamonAdmin contract for setup
3. **Verify VRF**: Test pack opening and adventure claiming
4. **Check Balances**: Ensure core contract has $AM tokens for rewards

## Mainnet Considerations

For Avalanche mainnet deployment:

1. Use production VRF coordinator: `0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634`
2. Higher gas limits for VRF callbacks (150,000 gas)
3. More LINK tokens for subscription funding
4. Consider contract verification on Snowtrace

## Troubleshooting

### Common Issues

1. **Contract Size Exceeded**: Admin functions moved to separate contract
2. **VRF Failures**: Check subscription funding and gas limits
3. **Admin Access**: Ensure admin contract is linked to core contract
4. **Token Transfers**: Check approval and balance before transfers

### Debug Commands

```bash
# Check contract sizes
npx hardhat size-contracts

# Test compilation
npx hardhat compile

# Verify deployment
npx hardhat verify --network avalancheFuji CONTRACT_ADDRESS "Constructor Args"
```

## Frontend Integration

After deployment, update your frontend `.env` file:

```env
NEXT_PUBLIC_AVAMON_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_AVAMON_CARDS_ADDRESS=0x...
NEXT_PUBLIC_AVAMON_PACKS_ADDRESS=0x...
NEXT_PUBLIC_AVAMON_CORE_ADDRESS=0x...
NEXT_PUBLIC_AVAMON_ADMIN_ADDRESS=0x...
```

Start the frontend:

```bash
cd packages/nextjs
yarn dev
```