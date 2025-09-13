# Avamon TCG Multi-Contract Architecture

This document outlines the complete Avamon TCG smart contract system, featuring a modular architecture with separate contracts for different token types and game logic. Built with OpenZeppelin v5.0+ and Chainlink VRF v2 for provably fair randomness.

## 📋 Contract Overview

### Architecture Benefits
- **Separation of Concerns**: Each contract handles a specific token type or functionality
- **Gas Efficiency**: Smaller contracts are cheaper to deploy and interact with
- **Upgradeability**: Individual contracts can be upgraded without affecting others
- **OpenZeppelin v5 Compatible**: Uses native uint256 counters instead of deprecated Counters.sol

### Contract Hierarchy

```
Avamon System
├── AvamonToken (ERC20) - $AM utility token
├── AvamonCards (ERC721) - Avamon NFT cards
├── AvamonPacks (ERC1155) - Booster packs
└── AvamonCore (Game Logic) - Main game contract with VRF
```

## 🔧 Contract Details

### 1. AvamonToken.sol (ERC20)
**Purpose**: Native utility token for the Avamon ecosystem
- **Symbol**: $AM
- **Decimals**: 18
- **Total Supply**: 10,000,000 $AM
- **Features**: Standard ERC20 with mint/burn capabilities for owner

**Key Functions**:
```solidity
function mint(address to, uint256 amount) external onlyOwner
function burn(uint256 amount) external
function burnFrom(address account, uint256 amount) external onlyOwner
```

### 2. AvamonCards.sol (ERC721)
**Purpose**: Unique collectible Avamon cards
- **Token Name**: Avamon
- **Token Symbol**: AVAMON
- **Features**: Batch minting, custom metadata, card statistics

**Key Functions**:
```solidity
function mintCard(address to, uint256 templateId, uint256 attack, uint256 defense, uint256 agility, uint256 hp, uint8 rarity) external onlyOwner returns (uint256)
function batchMintCards(address to, uint256[] calldata templateIds, ...) external onlyOwner returns (uint256[] memory)
function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner
```

### 3. AvamonPacks.sol (ERC1155)
**Purpose**: Tradable booster packs
- **Features**: Semi-fungible packs, batch operations, custom URIs

**Key Functions**:
```solidity
function createPackType(uint256 packTypeId, string memory name, uint256 price) external onlyOwner
function mintPack(address to, uint256 packId, uint256 amount) external onlyOwner
function burnPack(address from, uint256 packId, uint256 amount) external onlyOwner
```

### 4. AvamonCore.sol (Game Logic)
**Purpose**: Main game contract coordinating all gameplay
- **Features**: VRF integration, energy system, adventures, deck management
- **Dependencies**: Requires addresses of all token contracts

**Key Functions**:
```solidity
function joinAdventure(uint256 _adventureId, uint256[] memory _avamonIds) external
function startClaimAdventure(uint256 _adventureId) external
function openPack(uint256 _packId) external
function purchaseEnergy(uint256 _energyAmount) external payable
```

## 🚀 Deployment Strategy

### Deployment Order
1. **AvamonToken** - Deploy first (no dependencies)
2. **AvamonCards** - Deploy second (no dependencies)
3. **AvamonPacks** - Deploy third (no dependencies)
4. **AvamonCore** - Deploy last (requires all token contract addresses)

### Deployment Commands

#### Individual Deployments
```bash
# Deploy all token contracts
yarn deploy --tags tokens

# Deploy specific contract
yarn deploy --tags AvamonToken
yarn deploy --tags AvamonCards
yarn deploy --tags AvamonPacks
yarn deploy --tags AvamonCore
```

#### Full System Deployment
```bash
# Deploy everything in correct order
yarn deploy
```

### Network-Specific Configuration

#### Avalanche Fuji Testnet
```typescript
vrfCoordinator: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610"
keyHash: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f1952"
subscriptionId: 1 // Create subscription on Fuji
```

#### Avalanche Mainnet
```typescript
vrfCoordinator: "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634"
keyHash: "0x89630569c9567e43c4fe73619d9a2fd30d5325d12b9f8e5b2839a8e8a9b6d1b85"
subscriptionId: 1 // Create subscription on mainnet
```

#### Local Development
```typescript
vrfCoordinator: ethers.ZeroAddress
keyHash: ethers.ZeroHash
subscriptionId: 1
```

## 🔗 Frontend Integration (Scaffold-ETH 2)

### Contract Setup

#### 1. Add Contracts to `packages/nextjs/contracts/`

**externalContracts.ts**:
```typescript
export const externalContracts = {
  AvamonToken: {
    address: {
      43113: "0x...", // Fuji
      43114: "0x...", // Mainnet
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

#### 2. Create Contract Hooks

**packages/nextjs/hooks/scaffold-eth/useAvamonToken.ts**:
```typescript
import { useScaffoldReadContract, useScaffoldWriteContract } from "./scaffold-eth";

export const useAvamonToken = () => {
  const { writeContractAsync } = useScaffoldWriteContract("AvamonToken");

  const transfer = async (to: string, amount: bigint) => {
    return writeContractAsync({
      functionName: "transfer",
      args: [to, amount],
    });
  };

  const balanceOf = useScaffoldReadContract({
    contractName: "AvamonToken",
    functionName: "balanceOf",
    args: [account],
  });

  return { transfer, balanceOf };
};
```

**packages/nextjs/hooks/scaffold-eth/useAvamonCards.ts**:
```typescript
import { useScaffoldReadContract, useScaffoldWriteContract } from "./scaffold-eth";

export const useAvamonCards = () => {
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCards");

  const mintCard = async (to: string, templateId: bigint, attack: bigint, defense: bigint, agility: bigint, hp: bigint, rarity: number) => {
    return writeContractAsync({
      functionName: "mintCard",
      args: [to, templateId, attack, defense, agility, hp, rarity],
    });
  };

  const ownerOf = useScaffoldReadContract({
    contractName: "AvamonCards",
    functionName: "ownerOf",
    args: [tokenId],
  });

  return { mintCard, ownerOf };
};
```

**packages/nextjs/hooks/scaffold-eth/useAvamonCore.ts**:
```typescript
import { useScaffoldReadContract, useScaffoldWriteContract } from "./scaffold-eth";

export const useAvamonCore = () => {
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCore");

  // Game functions
  const joinAdventure = async (adventureId: bigint, avamonIds: readonly bigint[]) => {
    return writeContractAsync({
      functionName: "joinAdventure",
      args: [adventureId, avamonIds],
    });
  };

  const purchaseEnergy = async (energyAmount: bigint) => {
    return writeContractAsync({
      functionName: "purchaseEnergy",
      args: [energyAmount],
      value: energyAmount * BigInt("10000000000000000"), // 0.01 AVAX per energy
    });
  };

  const openPack = async (packId: bigint) => {
    return writeContractAsync({
      functionName: "openPack",
      args: [packId],
    });
  };

  // Read functions
  const getCurrentEnergy = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getCurrentEnergy",
    args: [account],
  });

  const getActiveAdventures = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getActiveAdventures",
    args: [account],
  });

  return {
    joinAdventure,
    purchaseEnergy,
    openPack,
    getCurrentEnergy,
    getActiveAdventures,
  };
};
```

#### 3. Component Examples

**EnergyDisplay.tsx**:
```typescript
import { useAvamonCore } from "~~/hooks/scaffold-eth/useAvamonCore";
import { useAccount } from "wagmi";

export const EnergyDisplay = () => {
  const { address } = useAccount();
  const { getCurrentEnergy, purchaseEnergy } = useAvamonCore();

  const energy = getCurrentEnergy.data;
  const isLoading = getCurrentEnergy.isLoading;

  const handlePurchaseEnergy = async () => {
    try {
      await purchaseEnergy(5n); // Purchase 5 energy
    } catch (error) {
      console.error("Failed to purchase energy:", error);
    }
  };

  if (isLoading) return <div>Loading energy...</div>;

  return (
    <div className="flex items-center gap-4">
      <span>Energy: {energy?.toString()}/10</span>
      <button
        onClick={handlePurchaseEnergy}
        className="btn btn-primary"
        disabled={energy >= 10n}
      >
        Buy 5 Energy (0.05 AVAX)
      </button>
    </div>
  );
};
```

**AdventureList.tsx**:
```typescript
import { useAvamonCore } from "~~/hooks/scaffold-eth/useAvamonCore";
import { useAccount } from "wagmi";

export const AdventureList = () => {
  const { address } = useAccount();
  const { getActiveAdventures, joinAdventure } = useAvamonCore();

  const activeAdventures = getActiveAdventures.data || [];
  const isLoading = getActiveAdventures.isLoading;

  const handleJoinAdventure = async (adventureId: bigint, avamonIds: bigint[]) => {
    try {
      await joinAdventure(adventureId, avamonIds);
    } catch (error) {
      console.error("Failed to join adventure:", error);
    }
  };

  if (isLoading) return <div>Loading adventures...</div>;

  return (
    <div className="space-y-4">
      {activeAdventures.map((adventureId) => (
        <AdventureCard
          key={adventureId.toString()}
          adventureId={adventureId}
          onJoin={(avamonIds) => handleJoinAdventure(adventureId, avamonIds)}
        />
      ))}
    </div>
  );
};
```

#### 4. Event Listening

**useAvamonEvents.ts**:
```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export const useAvamonEvents = () => {
  // Listen for pack openings
  const packOpenedEvents = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "PackOpened",
    fromBlock: 0n,
    watch: true,
  });

  // Listen for adventure completions
  const adventureCompletedEvents = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureCompleted",
    fromBlock: 0n,
    watch: true,
  });

  // Listen for card mints
  const cardMintedEvents = useScaffoldEventHistory({
    contractName: "AvamonCards",
    eventName: "CardMinted",
    fromBlock: 0n,
    watch: true,
  });

  return {
    packOpenedEvents,
    adventureCompletedEvents,
    cardMintedEvents,
  };
};
```

## 🎮 Game Flow Integration

### Player Onboarding
1. **Connect Wallet** → Scaffold-ETH handles this automatically
2. **Check $AM Balance** → Use `useAvamonToken` hook
3. **Purchase Energy** → Use `purchaseEnergy` if needed
4. **Buy Packs** → Use `purchasePack` in AvamonCore
5. **Open Packs** → Use `openPack` to trigger VRF
6. **Save Decks** → Use `saveDeck` for deck management
7. **Join Adventures** → Use `joinAdventure` to start playing

### Real-time Updates
```typescript
import { useAvamonEvents } from "~~/hooks/useAvamonEvents";

const GameDashboard = () => {
  const { packOpenedEvents, adventureCompletedEvents } = useAvamonEvents();

  // Update UI when pack is opened
  useEffect(() => {
    if (packOpenedEvents.data) {
      // Refresh player's card collection
      refetchCards();
    }
  }, [packOpenedEvents.data]);

  // Update UI when adventure completes
  useEffect(() => {
    if (adventureCompletedEvents.data) {
      // Refresh player's balance and active adventures
      refetchBalance();
      refetchAdventures();
    }
  }, [adventureCompletedEvents.data]);

  return <DashboardContent />;
};
```

## 🔄 Contract Interactions Flow

### Pack Opening Flow
```
User clicks "Open Pack"
    ↓
Frontend calls openPack(packId)
    ↓
AvamonCore burns pack via AvamonPacks
    ↓
AvamonCore requests VRF randomness
    ↓
VRF fulfills with random words
    ↓
AvamonCore selects 3 cards based on rarity
    ↓
AvamonCore calls batchMintCards on AvamonCards
    ↓
AvamonCards mints 3 new NFTs to player
    ↓
Frontend receives PackOpened event
    ↓
UI updates with new cards
```

### Adventure Flow
```
User joins adventure
    ↓
Frontend calls joinAdventure(adventureId, avamonIds)
    ↓
AvamonCore locks Avamons (transfers to contract)
    ↓
AvamonCore consumes energy
    ↓
Time passes (adventure duration)
    ↓
User claims rewards
    ↓
Frontend calls startClaimAdventure(adventureId)
    ↓
AvamonCore requests VRF for reward amount
    ↓
VRF fulfills with random reward
    ↓
AvamonCore returns Avamons to player
    ↓
AvamonCore transfers $AM reward
    ↓
Possibly mints pack via AvamonPacks
    ↓
Frontend receives AdventureCompleted event
```

## 🧪 Testing Strategy

### Unit Tests
- **AvamonToken**: ERC20 functionality, mint/burn operations
- **AvamonCards**: ERC721 functionality, batch minting, metadata
- **AvamonPacks**: ERC1155 functionality, pack creation, burning
- **AvamonCore**: Game logic, VRF integration, energy system

### Integration Tests
- **Full Game Flow**: Pack purchase → opening → card minting
- **Adventure Flow**: Joining → claiming → reward distribution
- **Cross-Contract Calls**: Core contract interacting with token contracts

### Test Commands
```bash
# Run all tests
yarn test

# Run specific contract tests
yarn test --grep "AvamonToken"
yarn test --grep "AvamonCards"
yarn test --grep "AvamonCore"

# Run with gas reporting
yarn test --gas
```

## 🔒 Security Considerations

### Access Control
- **Owner Functions**: Only contract owner can create templates, adventures, etc.
- **Player Functions**: Any user can interact with game functions
- **Token Permissions**: Core contract needs approval to spend tokens

### VRF Security
- **Subscription Management**: Owner manages VRF subscription
- **Request Validation**: VRF requests validated before fulfillment
- **Callback Security**: Only VRF coordinator can call fulfillRandomWords

### Emergency Features
- **Pausable**: Owner can pause all game functions
- **Withdraw Functions**: Owner can withdraw stuck funds
- **Admin Claim**: Owner can claim accumulated $AM

## 📊 Gas Optimization

### Techniques Used
- **Native Counters**: Using uint256 instead of Counters.sol
- **Batch Operations**: batchMintCards for multiple card minting
- **Efficient Storage**: Packed structs and optimized mappings
- **Lazy Evaluation**: Energy reset only when accessed

### Gas Cost Estimates
- **Mint Single Card**: ~100,000 gas
- **Batch Mint 3 Cards**: ~250,000 gas
- **Join Adventure**: ~150,000 gas
- **Claim Adventure**: ~200,000 gas (includes VRF callback)

## 🚦 Deployment Checklist

### Pre-Deployment
- [ ] VRF subscription created and funded
- [ ] All contract addresses configured
- [ ] Test deployments on Fuji testnet
- [ ] Frontend contracts configured

### Deployment Steps
- [ ] Deploy AvamonToken
- [ ] Deploy AvamonCards
- [ ] Deploy AvamonPacks
- [ ] Deploy AvamonCore with token addresses
- [ ] Initialize game data (templates, packs, adventures)
- [ ] Fund AvamonCore with initial $AM rewards pool
- [ ] Test all functionality

### Post-Deployment
- [ ] Update frontend contract addresses
- [ ] Test full user flow
- [ ] Monitor VRF callback gas usage
- [ ] Set up admin monitoring

## 🔧 Maintenance & Upgrades

### Contract Upgrades
1. **Token Contracts**: Can be upgraded independently if needed
2. **Core Contract**: Most complex to upgrade due to VRF integration
3. **Data Migration**: Plan for state migration if upgrading

### Monitoring
- **VRF Usage**: Monitor subscription balance and gas costs
- **Contract Balances**: Track $AM distribution across contracts
- **Event Logs**: Monitor game events for analytics

This architecture provides a scalable, secure, and maintainable foundation for the Avamon TCG game while ensuring compatibility with Scaffold-ETH 2 and modern Web3 development practices.
