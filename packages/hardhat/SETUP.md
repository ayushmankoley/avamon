# Avamon TCG - Post-Deployment Setup Guide

This guide explains how to set up the Avamon TCG game data after deploying the contracts.

## 🚀 Quick Setup

After deploying all contracts, run this command to set up the complete game:

```bash
# Set environment variables first
export AVAMON_CORE_ADDRESS="0x..."    # Your deployed AvamonCore address
export AVAMON_TOKEN_ADDRESS="0x..."   # Your deployed AvamonToken address

# Run the setup script
yarn setup
```

## 📋 What Gets Created

### Card Templates (35 cards)
- **20 Common Cards**: Balanced stats for beginners
- **10 Rare Cards**: Enhanced stats with special abilities
- **5 Mythic Cards**: Ultimate power cards with maxed stats

### Pack Types (3 types)
- **Blue Pack**: 100 $AM - 70% Common, 25% Rare, 5% Mythic
- **Green Pack**: 200 $AM - 50% Common, 35% Rare, 15% Mythic
- **Red Pack**: 300 $AM - 30% Common, 45% Rare, 25% Mythic

### Adventures (6 missions)
- **Dragon's Lair**: 10min, 100 $AM entry, 500-1500 $AM reward
- **Forest Expedition**: 30min, Free entry, 800-2000 $AM reward
- **Underwater Temple**: 1hr, 200 $AM entry, 1200-3000 $AM reward
- **Volcano Challenge**: 2hr, 300 $AM entry, 2000-5000 $AM reward
- **Ice Caverns**: 45min, 150 $AM entry, 1000-2500 $AM reward
- **Sky Palace**: 1.5hr, 250 $AM entry, 1500-4000 $AM reward

### Quests (5 total)
**Daily Quests:**
- Daily Check-in: Login for 1 Blue Pack
- Pack Hunter: Open 2 packs for 300 $AM
- Battle Victor: Win 3 adventures for 500 $AM

**Weekly Quests:**
- Adventure Master: Win 10 adventures for 3 Green Packs
- Collector Supreme: Open 8 packs for 2000 $AM

### Contract Funding
- Funds AvamonCore with 100,000 $AM tokens for rewards

## 🔧 Manual Setup (Alternative)

If you prefer to run setup steps manually:

### 1. Create Card Templates

```javascript
// In hardhat console or script
const avamonCore = await ethers.getContractAt("AvamonCore", CORE_ADDRESS);

// Common cards
await avamonCore.createCardTemplate("Earth Golem", 0, 70, 90, 40, 95);
await avamonCore.createCardTemplate("Shadow Wolf", 0, 75, 65, 85, 75);
// ... add all 35 cards

// Rare cards
await avamonCore.createCardTemplate("Fire Phoenix", 1, 90, 70, 80, 85);
// ... add all 10 rare cards

// Mythic cards
await avamonCore.createCardTemplate("Celestial Dragon", 2, 100, 90, 80, 100);
// ... add all 5 mythic cards
```

### 2. Create Pack Types

```javascript
await avamonCore.createPackType("Blue Pack", ethers.parseEther("100"), [70, 25, 5]);
await avamonCore.createPackType("Green Pack", ethers.parseEther("200"), [50, 35, 15]);
await avamonCore.createPackType("Red Pack", ethers.parseEther("300"), [30, 45, 25]);
```

### 3. Create Adventures

```javascript
await avamonCore.createAdventure(
  "Dragon's Lair",
  "Battle fierce dragons...",
  ethers.parseEther("100"),
  ethers.parseEther("500"),
  ethers.parseEther("1500"),
  600, // 10 minutes
  25,  // 25% pack drop
  1    // Blue pack type
);
// ... create all 6 adventures
```

### 4. Create Quests

```javascript
// Daily quests
await avamonCore.createQuest(0, "Daily Check-in", "...", 1, true, 1, 1, 1);
await avamonCore.createQuest(2, "Pack Hunter", "...", ethers.parseEther("300"), false, 0, 2, 1);
await avamonCore.createQuest(1, "Battle Victor", "...", ethers.parseEther("500"), false, 0, 3, 1);

// Weekly quests
await avamonCore.createQuest(1, "Adventure Master", "...", 3, true, 2, 10, 7);
await avamonCore.createQuest(2, "Collector Supreme", "...", ethers.parseEther("2000"), false, 0, 8, 7);
```

### 5. Fund Contract

```javascript
const avamonToken = await ethers.getContractAt("AvamonToken", TOKEN_ADDRESS);
await avamonToken.transfer(CORE_ADDRESS, ethers.parseEther("100000"));
```

## 🔍 Verification

After setup, verify everything is working:

```javascript
// Check card templates
const cardTemplates = [];
for(let i = 1; i <= 35; i++) {
  const template = await avamonCore.getCardTemplate(i);
  cardTemplates.push(template);
}
console.log(`${cardTemplates.length} card templates created`);

// Check pack types
const packTypes = [];
for(let i = 1; i <= 3; i++) {
  const packType = await avamonCore.packTypes(i);
  packTypes.push(packType);
}
console.log(`${packTypes.length} pack types created`);

// Check contract balance
const balance = await avamonToken.balanceOf(CORE_ADDRESS);
console.log(`Contract funded with ${ethers.formatEther(balance)} $AM`);
```

## 🚨 Important Notes

1. **Run setup only once** after deployment
2. **Environment variables** must be set before running the setup script
3. **IPFS metadata** should already be uploaded (as you mentioned)
4. **Admin wallet** must be used for setup (the deployer wallet)
5. **Test on Fuji first** before mainnet deployment

## 🎯 Next Steps

After setup is complete:

1. **Update frontend** with deployed contract addresses
2. **Test all functionality** on testnet
3. **Deploy to mainnet** when ready
4. **Run setup again** on mainnet with mainnet addresses

The game is now ready to play! 🎮
