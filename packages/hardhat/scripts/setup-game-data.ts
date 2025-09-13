import { ethers } from "hardhat";

async function main() {
  console.log("🎮 Setting up initial game data...");

  // Get deployed contract addresses
  const deployments = await import("../deployments/localhost/AvamonCore.json");
  const adminDeployments = await import("../deployments/localhost/AvamonAdmin.json");

  const avamonCoreAddress = deployments.address;
  const avamonAdminAddress = adminDeployments.address;

  console.log(`📍 AvamonCore: ${avamonCoreAddress}`);
  console.log(`👑 AvamonAdmin: ${avamonAdminAddress}`);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Get contract instances
  const avamonAdmin = await ethers.getContractAt("AvamonAdmin", avamonAdminAddress);

  console.log("🃏 Creating card templates...");

  // Create some card templates
  const cardTemplates = [
    { name: "Fire Dragon", rarity: 2, attack: 85, defense: 70, agility: 60, hp: 90 },
    { name: "Water Spirit", rarity: 1, attack: 60, defense: 80, agility: 75, hp: 85 },
    { name: "Earth Golem", rarity: 0, attack: 70, defense: 90, agility: 40, hp: 95 },
    { name: "Wind Falcon", rarity: 1, attack: 80, defense: 60, agility: 95, hp: 70 },
    { name: "Shadow Wolf", rarity: 0, attack: 75, defense: 65, agility: 85, hp: 75 },
    { name: "Light Phoenix", rarity: 2, attack: 90, defense: 75, agility: 80, hp: 85 },
    { name: "Ice Bear", rarity: 0, attack: 65, defense: 85, agility: 50, hp: 80 },
    { name: "Thunder Cat", rarity: 1, attack: 70, defense: 60, agility: 90, hp: 75 },
    { name: "Crystal Unicorn", rarity: 2, attack: 95, defense: 80, agility: 85, hp: 100 },
    { name: "Forest Sprite", rarity: 0, attack: 55, defense: 70, agility: 80, hp: 70 },
  ];

  for (let i = 0; i < cardTemplates.length; i++) {
    const template = cardTemplates[i];
    try {
      const tx = await avamonAdmin.createCardTemplate(
        template.name,
        template.rarity,
        template.attack,
        template.defense,
        template.agility,
        template.hp
      );
      await tx.wait();
      console.log(`✅ Created card template: ${template.name} (${template.rarity === 0 ? 'Common' : template.rarity === 1 ? 'Rare' : 'Mythic'})`);
    } catch (error) {
      console.error(`❌ Failed to create card template ${template.name}:`, error);
    }
  }

  console.log("📦 Creating pack types...");

  // Create pack types
  const packTypes = [
    { name: "Starter Pack", price: ethers.parseEther("100"), rarityChances: [70, 25, 5] },
    { name: "Premium Pack", price: ethers.parseEther("200"), rarityChances: [50, 35, 15] },
    { name: "Legendary Pack", price: ethers.parseEther("300"), rarityChances: [30, 45, 25] },
  ];

  for (let i = 0; i < packTypes.length; i++) {
    const pack = packTypes[i];
    try {
      const tx = await avamonAdmin.createPackType(
        pack.name,
        pack.price,
        pack.rarityChances
      );
      await tx.wait();
      console.log(`✅ Created pack type: ${pack.name} (${ethers.formatEther(pack.price)} $AM)`);
    } catch (error) {
      console.error(`❌ Failed to create pack type ${pack.name}:`, error);
    }
  }

  console.log("🗺️ Creating adventures...");

  // Create adventures
  const adventures = [
    {
      name: "Forest Exploration",
      description: "Explore the mystical forest and discover hidden treasures",
      entryFee: ethers.parseEther("10"),
      minReward: ethers.parseEther("5"),
      maxReward: ethers.parseEther("25"),
      duration: 600, // 10 minutes for testing
      packDropChance: 20, // 20%
      packTypeId: 1
    },
    {
      name: "Mountain Quest",
      description: "Climb the treacherous mountains for rare rewards",
      entryFee: ethers.parseEther("20"),
      minReward: ethers.parseEther("15"),
      maxReward: ethers.parseEther("50"),
      duration: 1200, // 20 minutes
      packDropChance: 30, // 30%
      packTypeId: 2
    },
    {
      name: "Dragon's Lair",
      description: "Face the mighty dragon in its lair for legendary rewards",
      entryFee: ethers.parseEther("50"),
      minReward: ethers.parseEther("40"),
      maxReward: ethers.parseEther("100"),
      duration: 1800, // 30 minutes
      packDropChance: 50, // 50%
      packTypeId: 3
    },
  ];

  for (let i = 0; i < adventures.length; i++) {
    const adventure = adventures[i];
    try {
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
      console.log(`✅ Created adventure: ${adventure.name} (${ethers.formatEther(adventure.entryFee)} $AM entry)`);
    } catch (error) {
      console.error(`❌ Failed to create adventure ${adventure.name}:`, error);
    }
  }

  console.log("🏆 Creating quests...");

  // Create quests
  const quests = [
    {
      questType: 0, // DailyCheckin
      title: "Daily Check-in",
      description: "Check in daily to receive rewards",
      rewardAmount: ethers.parseEther("10"),
      isPackReward: false,
      packTypeId: 0,
      targetValue: 1,
      timeWindow: 1 // daily
    },
    {
      questType: 1, // WinBattles
      title: "Win 3 Adventures",
      description: "Complete 3 adventure missions successfully",
      rewardAmount: ethers.parseEther("50"),
      isPackReward: false,
      packTypeId: 0,
      targetValue: 3,
      timeWindow: 1 // daily
    },
    {
      questType: 2, // OpenPacks
      title: "Open 2 Packs",
      description: "Open 2 packs to discover new Avamons",
      rewardAmount: 0,
      isPackReward: true,
      packTypeId: 1,
      targetValue: 2,
      timeWindow: 1 // daily
    },
  ];

  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    try {
      const tx = await avamonAdmin.createQuest(
        quest.questType,
        quest.title,
        quest.description,
        quest.rewardAmount,
        quest.isPackReward,
        quest.packTypeId,
        quest.targetValue,
        quest.timeWindow
      );
      await tx.wait();
      console.log(`✅ Created quest: ${quest.title}`);
    } catch (error) {
      console.error(`❌ Failed to create quest ${quest.title}:`, error);
    }
  }

  console.log("🎁 Giving deployer some starter packs...");

  // Give the deployer some starter packs for testing
  try {
    const tx = await avamonAdmin.emergencyMintPacks(deployer.address, 1, 3); // 3 starter packs
    await tx.wait();
    console.log("✅ Minted 3 starter packs to deployer");
  } catch (error) {
    console.error("❌ Failed to mint starter packs:", error);
  }

  console.log("🎉 Game data setup complete!");
  console.log("\n📋 Summary:");
  console.log(`- Created ${cardTemplates.length} card templates`);
  console.log(`- Created ${packTypes.length} pack types`);
  console.log(`- Created ${adventures.length} adventures`);
  console.log(`- Created ${quests.length} quests`);
  console.log("- Minted 3 starter packs to deployer");
  console.log("\n🚀 You can now test the frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
