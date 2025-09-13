# Avamon TCG Smart Contract

A comprehensive Solidity smart contract for the Avamon Trading Card Game built on Ethereum/Avalanche, featuring ERC20, ERC721, and ERC1155 tokens with Chainlink VRF integration for provably fair randomness.

## Features

### Token Ecosystem
- **$AM (ERC20)**: Native utility token (10M total supply)
- **Avamon NFTs (ERC721)**: Unique collectible cards
- **Packs (ERC1155)**: Tradable booster packs

### Game Mechanics
- **Energy System**: Daily energy regeneration (10/day) with AVAX refill option
- **Deck Management**: 2 default deck slots, upgradeable to 3 with AVAX
- **Adventures**: Time-locked missions with randomized rewards
- **Pack Opening**: VRF-powered fair card distribution
- **Provably Fair**: All randomness uses Chainlink VRF

## Contract Architecture

### Data Structures

```solidity
struct CardTemplate {
    uint256 id;
    string name;
    uint8 rarity;     // 0: Common, 1: Rare, 2: Mythic
    uint256 attack;
    uint256 defense;
    uint256 agility;
    uint256 hp;
    bool isActive;
}

struct PackType {
    uint256 id;
    string name;
    uint256 price;           // $AM cost
    uint8[3] rarityChances;  // [common%, rare%, mythic%]
    bool isActive;
}

struct Adventure {
    uint256 id;
    string name;
    string description;
    uint256 entryFee;        // $AM required
    uint256 minReward;       // Minimum $AM reward
    uint256 maxReward;       // Maximum $AM reward
    uint256 duration;        // Duration in seconds
    uint256 packDropChance;  // Pack drop probability
    uint256 packTypeId;      // Associated pack type
    bool isActive;
}
```

## Deployment

### Prerequisites
1. Set up Chainlink VRF v2 subscription on your target network
2. Fund the subscription with LINK tokens
3. Update the deployment script with correct VRF parameters

### VRF Configuration

#### Avalanche Fuji Testnet
```typescript
vrfCoordinator: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610"
keyHash: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f1952"
```

#### Avalanche Mainnet
```typescript
vrfCoordinator: "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634"
keyHash: "0x89630569c9567e43c4fe73619d9a2fd30d5325d12b9f8e5b2839a8e8a9b6d1b85"
```

### Deploy Commands

```bash
# Deploy to local network
yarn deploy

# Deploy to Avalanche Fuji
yarn deploy --network avalancheFuji

# Deploy to Avalanche Mainnet
yarn deploy --network avalanche
```

## Game Flow

### 1. Initial Setup (Admin)
```solidity
// Create card templates
await avamon.createCardTemplate("Fire Dragon", 2, 300, 250, 150, 3000);

// Create pack types
await avamon.createPackType("Premium Pack", ethers.parseEther("25"), [50, 35, 15]);

// Create adventures
await avamon.createAdventure(
  "Dragon's Lair",
  "Epic battle against the Celestial Dragon",
  ethers.parseEther("5"),    // Entry fee
  ethers.parseEther("50"),   // Min reward
  ethers.parseEther("200"),  // Max reward
  86400,                     // 24 hours
  25,                        // 25% pack drop
  2                          // Premium pack
);
```

### 2. Player Actions

#### Energy Management
```solidity
// Check current energy
const energy = await avamon.getCurrentEnergy(playerAddress);

// Purchase energy (0.01 AVAX per energy)
await avamon.purchaseEnergy(5, { value: ethers.parseEther("0.05") });
```

#### Deck Management
```solidity
// Upgrade deck slots (0.1 AVAX)
await avamon.upgradeDeckSlots({ value: ethers.parseEther("0.1") });

// Save a deck
await avamon.saveDeck(0, "My Deck", [1, 2, 3]);
```

#### Adventure Flow
```solidity
// Join adventure
await avamon.joinAdventure(1, [1, 2, 3]); // Adventure ID, Avamon IDs

// Wait for duration to complete...

// Start claiming (triggers VRF)
await avamon.startClaimAdventure(1);

// VRF callback will automatically:
// - Calculate random reward
// - Return locked Avamons
// - Transfer reward $AM
// - Potentially mint a pack
```

#### Pack System
```solidity
// Purchase pack
await avamon.purchasePack(1, 2); // Pack type ID, quantity

// Open pack (triggers VRF)
await avamon.openPack(1); // Pack ID

// VRF callback will automatically:
// - Burn the pack
// - Mint 3 random Avamons based on pack rarity
```

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Access Control**: Owner-only admin functions
- **Input Validation**: Comprehensive parameter checks
- **VRF Integration**: Provably fair randomness

## Gas Optimizations

- **Lazy Energy Reset**: Reset only when player acts
- **Batch Minting**: Multiple Avamons minted in single transaction
- **Efficient Storage**: Packed structs and optimized mappings
- **Event Logging**: Off-chain tracking without on-chain storage

## Testing

```bash
# Run all tests
yarn test

# Run specific test file
yarn test --grep "Avamon"

# Run with gas reporting
yarn test --gas
```

## Events

The contract emits comprehensive events for frontend integration:

```solidity
event CardTemplateCreated(uint256 indexed templateId, string name, uint8 rarity);
event AdventureJoined(address indexed player, uint256 indexed adventureId, uint256[] avamonIds);
event AdventureCompleted(address indexed player, uint256 indexed adventureId, uint256 reward, bool packDropped);
event PackOpened(address indexed player, uint256 indexed packId, uint256[] avamonIds);
event AvamonMinted(address indexed to, uint256 indexed tokenId, uint256 templateId);
event EnergyPurchased(address indexed player, uint256 energyAmount, uint256 cost);
```

## Frontend Integration

### Reading Contract State
```typescript
// Get player energy
const energy = await avamon.getCurrentEnergy(playerAddress);

// Get active adventures
const activeAdventures = await avamon.getActiveAdventures(playerAddress);

// Get saved decks
const decks = await avamon.getSavedDecks(playerAddress);
```

### Writing to Contract
```typescript
// Use the provided hooks from Scaffold-ETH 2
const { writeContractAsync: writeAvamonAsync } = useScaffoldWriteContract({
  contractName: "Avamon"
});

// Example: Join adventure
await writeAvamonAsync({
  functionName: "joinAdventure",
  args: [adventureId, avamonIds],
});
```

## VRF Callback Flow

1. **Adventure Claims**:
   - Player calls `startClaimAdventure()`
   - Contract requests VRF with 2 random words
   - VRF fulfills with random values
   - Contract calculates reward: `minReward + (random % (maxReward - minReward + 1))`
   - Contract determines pack drop: `random % 100 < packDropChance`

2. **Pack Opening**:
   - Player calls `openPack()`
   - Contract requests VRF with 3 random words
   - VRF fulfills with random values
   - Contract selects 3 cards based on pack's rarity distribution
   - Contract mints Avamon NFTs for each selected card

## Economic Model

### Revenue Streams
- **Pack Sales**: $AM paid for booster packs
- **Energy Refills**: AVAX paid to refill energy (0.01 AVAX/energy)
- **Deck Upgrades**: AVAX paid for extra deck slot (0.1 AVAX)
- **Adventure Fees**: $AM entry fees redistributed as rewards

### Token Flow
- **$AM Supply**: 10M fixed supply
- **Contract Revenue**: Holds $AM from pack sales and entry fees
- **Player Rewards**: Distributed from contract balance via adventures
- **Admin Claims**: Owner can claim accumulated $AM

## Custom Logic Notes

The following aspects were implemented with custom logic based on the requirements:

1. **Energy System**: Daily reset mechanism with AVAX-based refills
2. **Deck Management**: Slot-based system with upgrade mechanics
3. **Adventure Locking**: Avamons temporarily transferred to contract during adventures
4. **Reward Calculation**: VRF-powered random rewards within defined ranges
5. **Pack Rarity Distribution**: Configurable probability arrays for fair card distribution
6. **Multi-Token Integration**: Combined ERC20/ERC721/ERC1155 functionality in single contract

This contract provides a complete TCG ecosystem with provably fair mechanics, sustainable economics, and comprehensive game features.
