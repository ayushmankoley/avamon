import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import password from "@inquirer/password";

async function setupGame() {
  console.log("🚀 Setting up Avamon TCG game data...");

  // Get deployed contract addresses from deployment files
  const AVAMON_CORE_ADDRESS = require("../deployments/avalancheFuji/AvamonCore.json").address;
  const AVAMON_ADMIN_ADDRESS = require("../deployments/avalancheFuji/AvamonAdmin.json").address;
  const AVAMON_TOKEN_ADDRESS = require("../deployments/avalancheFuji/AvamonToken.json").address;
  const AVAMON_PACKS_ADDRESS = require("../deployments/avalancheFuji/AvamonPacks.json").address;

  // Decrypt private key
  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
  if (!encryptedKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` first");
    return;
  }

  const pass = await password({ message: "Enter your password to decrypt the private key:" });
  let wallet: Wallet;
  try {
    wallet = (await Wallet.fromEncryptedJson(encryptedKey, pass)) as Wallet;
  } catch {
    console.log("❌ Failed to decrypt private key. Wrong password?");
    return;
  }

  // Connect to the network
  const provider = new ethers.JsonRpcProvider("https://avalanche-fuji-c-chain-rpc.publicnode.com");
  const signer = wallet.connect(provider);
  console.log("Setting up with account:", signer.address);

  // Get contract instances
  const avamonCore = new ethers.Contract(AVAMON_CORE_ADDRESS, require("../artifacts/contracts/AvamonCore.sol/AvamonCore.json").abi, signer);
  const avamonAdmin = new ethers.Contract(AVAMON_ADMIN_ADDRESS, require("../artifacts/contracts/AvamonAdmin.sol/AvamonAdmin.json").abi, signer);
  const avamonToken = new ethers.Contract(AVAMON_TOKEN_ADDRESS, require("../artifacts/contracts/AvamonToken.sol/AvamonToken.json").abi, signer);
  const avamonPacks = new ethers.Contract(AVAMON_PACKS_ADDRESS, require("../artifacts/contracts/AvamonPacks.sol/AvamonPacks.json").abi, signer);

  console.log("📝 Creating card templates...");

  // Create card templates
  const cardTemplates = [
    // Common Cards (IDs 1-20)
    { name: "Fire Drake", rarity: 0, attack: 150, defense: 100, agility: 80, hp: 1200 },
    { name: "Water Spirit", rarity: 0, attack: 120, defense: 140, agility: 90, hp: 1300 },
    { name: "Earth Golem", rarity: 0, attack: 180, defense: 200, agility: 50, hp: 2000 },
    { name: "Wind Sprite", rarity: 0, attack: 110, defense: 90, agility: 200, hp: 1000 },
    { name: "Flame Imp", rarity: 0, attack: 140, defense: 80, agility: 150, hp: 900 },
    { name: "Ice Wolf", rarity: 0, attack: 130, defense: 120, agility: 140, hp: 1100 },
    { name: "Stone Beetle", rarity: 0, attack: 100, defense: 180, agility: 60, hp: 1400 },
    { name: "Storm Crow", rarity: 0, attack: 120, defense: 100, agility: 160, hp: 950 },
    { name: "Lava Slime", rarity: 0, attack: 160, defense: 110, agility: 70, hp: 1150 },
    { name: "Coral Guardian", rarity: 0, attack: 115, defense: 150, agility: 85, hp: 1250 },
    { name: "Crystal Golem", rarity: 0, attack: 140, defense: 160, agility: 55, hp: 1350 },
    { name: "Tempest Eagle", rarity: 0, attack: 135, defense: 95, agility: 175, hp: 1050 },
    { name: "Phoenix Chick", rarity: 0, attack: 125, defense: 105, agility: 155, hp: 1000 },
    { name: "Frost Nymph", rarity: 0, attack: 105, defense: 135, agility: 125, hp: 1180 },
    { name: "Boulder Troll", rarity: 0, attack: 170, defense: 190, agility: 45, hp: 1500 },
    { name: "Gale Harpy", rarity: 0, attack: 130, defense: 85, agility: 190, hp: 980 },
    { name: "Ember Fox", rarity: 0, attack: 145, defense: 115, agility: 135, hp: 1080 },
    { name: "Tidal Serpent", rarity: 0, attack: 125, defense: 145, agility: 115, hp: 1280 },
    { name: "Quartz Guardian", rarity: 0, attack: 135, defense: 155, agility: 65, hp: 1320 },
    { name: "Zephyr Spirit", rarity: 0, attack: 115, defense: 125, agility: 165, hp: 1120 },

    // Rare Cards (IDs 21-30)
    { name: "Inferno Dragon", rarity: 1, attack: 220, defense: 180, agility: 120, hp: 2200 },
    { name: "Kraken Lord", rarity: 1, attack: 200, defense: 240, agility: 100, hp: 2500 },
    { name: "Mountain Titan", rarity: 1, attack: 250, defense: 280, agility: 70, hp: 3000 },
    { name: "Thunder Phoenix", rarity: 1, attack: 240, defense: 160, agility: 220, hp: 2100 },
    { name: "Volcanic Behemoth", rarity: 1, attack: 230, defense: 260, agility: 85, hp: 2800 },
    { name: "Abyssal Leviathan", rarity: 1, attack: 210, defense: 250, agility: 95, hp: 2700 },
    { name: "Obsidian Colossus", rarity: 1, attack: 240, defense: 270, agility: 75, hp: 2900 },
    { name: "Cyclone Elemental", rarity: 1, attack: 215, defense: 175, agility: 250, hp: 2000 },
    { name: "Salamander King", rarity: 1, attack: 225, defense: 190, agility: 180, hp: 2300 },
    { name: "Mermaid Empress", rarity: 1, attack: 195, defense: 220, agility: 160, hp: 2400 },

    // Mythic Cards (IDs 31-35)
    { name: "Celestial Dragon", rarity: 2, attack: 300, defense: 250, agility: 150, hp: 3000 },
    { name: "Void Phoenix", rarity: 2, attack: 280, defense: 220, agility: 200, hp: 2800 },
    { name: "Eternal Flame", rarity: 2, attack: 260, defense: 200, agility: 180, hp: 2600 },
    { name: "Ocean Overlord", rarity: 2, attack: 270, defense: 280, agility: 130, hp: 3200 },
    { name: "Terra Prime", rarity: 2, attack: 290, defense: 300, agility: 90, hp: 3500 },
  ];

  for (const card of cardTemplates) {
    const tx = await avamonAdmin.createCardTemplate(
      card.name,
      card.rarity,
      card.attack,
      card.defense,
      card.agility,
      card.hp
    );
    await tx.wait();
    console.log(`✓ Created ${card.name} (${card.rarity === 0 ? 'Common' : card.rarity === 1 ? 'Rare' : 'Mythic'})`);
  }

  console.log("📦 Creating pack types...");

  // Create pack types (prices are not used since packs are only from quest rewards)
  const packTypes = [
    { name: "Blue Pack", price: 0, chances: [60, 30, 10] }, // Blue: 3 Commons, 1 Rare, 1 Rare/Mythic slot
    { name: "Green Pack", price: 0, chances: [80, 19, 1] }, // Green: 4 Commons, 1 Rare (small mythic chance)
    { name: "Red Pack", price: 0, chances: [40, 40, 20] }, // Red: 2 Commons, 2 Rares, 1 Rare/Mythic slot
  ];

  for (let i = 0; i < packTypes.length; i++) {
    const pack = packTypes[i];
    const packTypeId = i + 1; // Pack type IDs start from 1

    // Create pack type in AvamonCore
    const tx = await avamonAdmin.createPackType(pack.name, pack.price, pack.chances);
    await tx.wait();
    console.log(`✓ Created ${pack.name} pack type in AvamonCore (${pack.chances[0]}%/${pack.chances[1]}%/${pack.chances[2]}%)`);
  }

  console.log("⚔️ Creating adventures...");

  // Create adventures
  const adventures = [
    {
      name: "Dragon's Lair",
      description: "Battle fierce dragons in their mountain stronghold. Face fire-breathing beasts and ancient guardians.",
      entryFee: ethers.parseEther("100"),
      minReward: ethers.parseEther("500"),
      maxReward: ethers.parseEther("1500"),
      duration: 10 * 60, // 10 minutes
      packDropChance: 25,
      packTypeId: 1,
    },
    {
      name: "Forest Expedition",
      description: "Explore the mystical enchanted forest. Encounter magical creatures and hidden treasures.",
      entryFee: 0,
      minReward: ethers.parseEther("800"),
      maxReward: ethers.parseEther("2000"),
      duration: 30 * 60, // 30 minutes
      packDropChance: 30,
      packTypeId: 2,
    },
    {
      name: "Underwater Temple",
      description: "Dive deep into the ancient underwater ruins. Discover lost artifacts and aquatic horrors.",
      entryFee: ethers.parseEther("200"),
      minReward: ethers.parseEther("1200"),
      maxReward: ethers.parseEther("3000"),
      duration: 60 * 60, // 1 hour
      packDropChance: 35,
      packTypeId: 2,
    },
    {
      name: "Volcano Challenge",
      description: "Conquer the fiery peaks of Mount Inferno. Survive lava flows and molten monsters.",
      entryFee: ethers.parseEther("300"),
      minReward: ethers.parseEther("2000"),
      maxReward: ethers.parseEther("5000"),
      duration: 120 * 60, // 2 hours
      packDropChance: 40,
      packTypeId: 3,
    },
    {
      name: "Ice Caverns",
      description: "Navigate treacherous ice caverns. Battle frost giants and uncover frozen secrets.",
      entryFee: ethers.parseEther("150"),
      minReward: ethers.parseEther("1000"),
      maxReward: ethers.parseEther("2500"),
      duration: 45 * 60, // 45 minutes
      packDropChance: 28,
      packTypeId: 1,
    },
    {
      name: "Sky Palace",
      description: "Ascend to the floating sky palace. Face aerial predators and cloud guardians.",
      entryFee: ethers.parseEther("250"),
      minReward: ethers.parseEther("1500"),
      maxReward: ethers.parseEther("4000"),
      duration: 90 * 60, // 1.5 hours
      packDropChance: 32,
      packTypeId: 2,
    },
  ];

  for (const adventure of adventures) {
    const tx = await avamonAdmin.createAdventure(
      adventure.name,
      adventure.description,
      adventure.entryFee,
      adventure.minReward,
      adventure.maxReward,
      adventure.duration,
      adventure.packDropChance,
      adventure.packTypeId
    );
    await tx.wait();
    console.log(`✓ Created adventure: ${adventure.name}`);
  }

  console.log("🎯 Creating quests...");

  // Create quests
  const quests = [
    // Daily quests
    {
      type: 0, // DailyCheckin
      title: "Daily Check-in",
      description: "Log in to Avamon TCG today and claim your daily pack reward!",
      rewardAmount: 1,
      isPackReward: true,
      packTypeId: 1,
      targetValue: 1,
      timeWindow: 1, // daily
    },
    {
      type: 2, // OpenPacks
      title: "Pack Hunter",
      description: "Open 2 booster packs and discover new Avamons!",
      rewardAmount: ethers.parseEther("300"),
      isPackReward: false,
      packTypeId: 0,
      targetValue: 2,
      timeWindow: 1, // daily
    },
    {
      type: 1, // WinBattles
      title: "Battle Victor",
      description: "Complete 3 adventure missions and prove your strength!",
      rewardAmount: ethers.parseEther("500"),
      isPackReward: false,
      packTypeId: 0,
      targetValue: 3,
      timeWindow: 1, // daily
    },

    // Weekly quests
    {
      type: 1, // WinBattles
      title: "Adventure Master",
      description: "Complete 10 adventure missions this week and become a legend!",
      rewardAmount: 3,
      isPackReward: true,
      packTypeId: 2,
      targetValue: 10,
      timeWindow: 7, // weekly
    },
    {
      type: 2, // OpenPacks
      title: "Collector Supreme",
      description: "Open 8 booster packs this week and build your ultimate collection!",
      rewardAmount: ethers.parseEther("2000"),
      isPackReward: false,
      packTypeId: 0,
      targetValue: 8,
      timeWindow: 7, // weekly
    },
  ];

  for (const quest of quests) {
    const tx = await avamonAdmin.createQuest(
      quest.type,
      quest.title,
      quest.description,
      quest.rewardAmount,
      quest.isPackReward,
      quest.packTypeId,
      quest.targetValue,
      quest.timeWindow
    );
    await tx.wait();
    console.log(`✓ Created ${quest.timeWindow === 1 ? 'daily' : 'weekly'} quest: ${quest.title}`);
  }

  console.log("💰 Funding contract with $AM tokens...");

  // Fund contract with $AM tokens for rewards
  const fundingAmount = ethers.parseEther("100000"); // 100,000 $AM
  const fundTx = await avamonToken.transfer(AVAMON_CORE_ADDRESS, fundingAmount);
  await fundTx.wait();
  console.log(`✓ Funded contract with ${ethers.formatEther(fundingAmount)} $AM tokens`);

  // Verify funding
  const contractBalance = await avamonToken.balanceOf(AVAMON_CORE_ADDRESS);
  console.log(`✓ Contract balance: ${ethers.formatEther(contractBalance)} $AM`);

  // Sync pack info for existing pack types (in case they weren't created)
  console.log("🔄 Syncing pack info...");
  try {
    for (let i = 1; i <= packTypes.length; i++) {
      const tx = await avamonAdmin.syncPackInfo(i);
      await tx.wait();
      console.log(`✓ Synced pack info for pack type ${i}`);
    }
  } catch (error) {
    console.log("⚠️  Pack info sync failed (might already exist):", error instanceof Error ? error.message : String(error));
  }

  console.log("\n🎉 Game setup complete!");
  console.log("📊 Summary:");
  console.log(`   - ${cardTemplates.length} card templates created`);
  console.log(`   - ${packTypes.length} pack types created`);
  console.log(`   - ${adventures.length} adventures created`);
  console.log(`   - ${quests.length} quests created`);
  console.log(`   - Contract funded with ${ethers.formatEther(fundingAmount)} $AM`);
}

// Run the setup
setupGame()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
