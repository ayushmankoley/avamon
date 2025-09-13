#!/usr/bin/env node

/**
 * Metadata Generator for Avamon TCG
 * Usage: node scripts/generate-metadata.js
 */

const fs = require('fs');
const path = require('path');

// Avamon card templates data (35 total cards)
const cardTemplates = [
  // Common Cards (IDs 1-20)
  { id: 1, name: "Fire Drake", description: "A fierce dragon with flames that can melt steel", rarity: "Common", attack: 150, defense: 100, agility: 80, hp: 1200, element: "Fire" },
  { id: 2, name: "Water Spirit", description: "An ethereal being that controls water flow", rarity: "Common", attack: 120, defense: 140, agility: 90, hp: 1300, element: "Water" },
  { id: 3, name: "Earth Golem", description: "A massive construct of living stone", rarity: "Common", attack: 180, defense: 200, agility: 50, hp: 2000, element: "Earth" },
  { id: 4, name: "Wind Sprite", description: "A swift aerial being that commands the winds", rarity: "Common", attack: 110, defense: 90, agility: 200, hp: 1000, element: "Air" },
  { id: 5, name: "Flame Imp", description: "A small but fiery demonic creature", rarity: "Common", attack: 140, defense: 80, agility: 150, hp: 900, element: "Fire" },
  { id: 6, name: "Ice Wolf", description: "A majestic wolf with frost breath", rarity: "Common", attack: 130, defense: 120, agility: 140, hp: 1100, element: "Water" },
  { id: 7, name: "Stone Beetle", description: "A heavily armored insect construct", rarity: "Common", attack: 100, defense: 180, agility: 60, hp: 1400, element: "Earth" },
  { id: 8, name: "Storm Crow", description: "A dark bird that summons lightning", rarity: "Common", attack: 120, defense: 100, agility: 160, hp: 950, element: "Air" },
  { id: 9, name: "Lava Slime", description: "A molten blob that burns everything it touches", rarity: "Common", attack: 160, defense: 110, agility: 70, hp: 1150, element: "Fire" },
  { id: 10, name: "Coral Guardian", description: "An ancient sea creature protector", rarity: "Common", attack: 115, defense: 150, agility: 85, hp: 1250, element: "Water" },
  { id: 11, name: "Crystal Golem", description: "A shimmering crystalline construct", rarity: "Common", attack: 140, defense: 160, agility: 55, hp: 1350, element: "Earth" },
  { id: 12, name: "Tempest Eagle", description: "A powerful eagle that controls storms", rarity: "Common", attack: 135, defense: 95, agility: 175, hp: 1050, element: "Air" },
  { id: 13, name: "Phoenix Chick", description: "A young firebird learning to control flames", rarity: "Common", attack: 125, defense: 105, agility: 155, hp: 1000, element: "Fire" },
  { id: 14, name: "Frost Nymph", description: "A delicate ice spirit with healing powers", rarity: "Common", attack: 105, defense: 135, agility: 125, hp: 1180, element: "Water" },
  { id: 15, name: "Boulder Troll", description: "A brutish earth creature with immense strength", rarity: "Common", attack: 170, defense: 190, agility: 45, hp: 1500, element: "Earth" },
  { id: 16, name: "Gale Harpy", description: "A winged creature that creates powerful gusts", rarity: "Common", attack: 130, defense: 85, agility: 190, hp: 980, element: "Air" },
  { id: 17, name: "Ember Fox", description: "A cunning fox with fiery tails", rarity: "Common", attack: 145, defense: 115, agility: 135, hp: 1080, element: "Fire" },
  { id: 18, name: "Tidal Serpent", description: "A sea snake that controls ocean currents", rarity: "Common", attack: 125, defense: 145, agility: 115, hp: 1280, element: "Water" },
  { id: 19, name: "Quartz Guardian", description: "A crystal being that protects ancient secrets", rarity: "Common", attack: 135, defense: 155, agility: 65, hp: 1320, element: "Earth" },
  { id: 20, name: "Zephyr Spirit", description: "A gentle wind entity that brings good fortune", rarity: "Common", attack: 115, defense: 125, agility: 165, hp: 1120, element: "Air" },

  // Rare Cards (IDs 21-30)
  { id: 21, name: "Inferno Dragon", description: "A massive fire dragon that breathes pure flames", rarity: "Rare", attack: 220, defense: 180, agility: 120, hp: 2200, element: "Fire" },
  { id: 22, name: "Kraken Lord", description: "A legendary sea monster ruler", rarity: "Rare", attack: 200, defense: 240, agility: 100, hp: 2500, element: "Water" },
  { id: 23, name: "Mountain Titan", description: "A colossal earth being that shapes mountains", rarity: "Rare", attack: 250, defense: 280, agility: 70, hp: 3000, element: "Earth" },
  { id: 24, name: "Thunder Phoenix", description: "A reborn bird that commands electrical storms", rarity: "Rare", attack: 240, defense: 160, agility: 220, hp: 2100, element: "Air" },
  { id: 25, name: "Volcanic Behemoth", description: "A lava-covered monster from the earth's core", rarity: "Rare", attack: 230, defense: 260, agility: 85, hp: 2800, element: "Fire" },
  { id: 26, name: "Abyssal Leviathan", description: "A deep-sea terror that swallows ships whole", rarity: "Rare", attack: 210, defense: 250, agility: 95, hp: 2700, element: "Water" },
  { id: 27, name: "Obsidian Colossus", description: "A black volcanic glass giant", rarity: "Rare", attack: 240, defense: 270, agility: 75, hp: 2900, element: "Earth" },
  { id: 28, name: "Cyclone Elemental", description: "A living tornado that destroys everything", rarity: "Rare", attack: 215, defense: 175, agility: 250, hp: 2000, element: "Air" },
  { id: 29, name: "Salamander King", description: "A fire lizard monarch with crown of flames", rarity: "Rare", attack: 225, defense: 190, agility: 180, hp: 2300, element: "Fire" },
  { id: 30, name: "Mermaid Empress", description: "A beautiful yet deadly ocean ruler", rarity: "Rare", attack: 195, defense: 220, agility: 160, hp: 2400, element: "Water" },

  // Mythic Cards (IDs 31-35)   
  { id: 31, name: "Celestial Dragon", description: "The ultimate mythical creature that rules the skies", rarity: "Mythic", attack: 300, defense: 250, agility: 150, hp: 3000, element: "Light" },
  { id: 32, name: "Void Phoenix", description: "A phoenix that travels th   rough dimensions", rarity: "Mythic", attack: 280, defense: 220, agility: 200, hp: 2800, element: "Dark" },
  { id: 33, name: "Eternal Flame", description: "An immortal fire that never dies out", rarity: "Mythic", attack: 260, defense: 200, agility: 180, hp: 2600, element: "Fire" },
  { id: 34, name: "Ocean Overlord", description: "The supreme ruler of all aquatic life", rarity: "Mythic", attack: 270, defense: 280, agility: 130, hp: 3200, element: "Water" },
  { id: 35, name: "Terra Prime", description: "The living embodiment of the planet itself", rarity: "Mythic", attack: 290, defense: 300, agility: 90, hp: 3500, element: "Earth" }
];

// Pack templates - 3 types: Green, Blue, Red
const packTemplates = [
  {
    id: 1,
    name: "Green Pack",
    description: "Entry-level pack with fair chances for all rarities. Great for budget players.",
    type: "Green",
    cardCount: 5,
    rarityDistribution: "70% Common, 25% Rare, 5% Mythic",
    image: "placeholder"
  },
  {
    id: 2,
    name: "Blue Pack",
    description: "Balanced pack with good chances for rare cards. Perfect for regular players.",
    type: "Blue",
    cardCount: 5,
    rarityDistribution: "50% Common, 35% Rare, 15% Mythic",
    image: "placeholder"
  },
  {
    id: 3,
    name: "Red Pack",
    description: "High-stakes pack with the best chances for mythic cards. For serious collectors.",
    type: "Red",
    cardCount: 5,
    rarityDistribution: "30% Common, 40% Rare, 30% Mythic",
    image: "placeholder"
  }
];

function createDirectories() {
  const dirs = [
    path.join(__dirname, '..', 'metadata'),
    path.join(__dirname, '..', 'metadata', 'images'),
    path.join(__dirname, '..', 'metadata', 'cards'),
    path.join(__dirname, '..', 'metadata', 'packs')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

function generateCardMetadata() {
  console.log('\n🎴 Generating card metadata for 35 Avamons...');

  cardTemplates.forEach(card => {
    const metadata = {
      name: card.name,
      description: card.description,
      image: `ipfs://bafybeigzhdu3pqo6kf22tr74dsfzedpohndpu3c37xc3ija43jfwsqg5yq/${card.id}.png`,
      attributes: [
        {
          trait_type: "Rarity",
          value: card.rarity
        },
        {
          trait_type: "Attack",
          value: card.attack
        },
        {
          trait_type: "Defense",
          value: card.defense
        },
        {
          trait_type: "Agility",
          value: card.agility
        },
        {
          trait_type: "HP",
          value: card.hp
        }
      ],
      properties: {
        card_type: "Avamon",
        template_id: card.id,
        generation: 1
      }
    };

    const filePath = path.join(__dirname, '..', 'metadata', 'cards', `${card.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`   ✓ Generated ${card.name} (${card.rarity}, ${card.element})`);
  });
}

function generatePackMetadata() {
  console.log('\n📦 Generating pack metadata for 3 pack types...');

  packTemplates.forEach(pack => {
    const metadata = {
      name: pack.name,
      description: pack.description,
      image: `ipfs://bafybeigzhdu3pqo6kf22tr74dsfzedpohndpu3c37xc3ija43jfwsqg5yq/pack_${pack.type.toLowerCase()}.png`,
      attributes: [
        {
          trait_type: "Pack Type",
          value: pack.type
        },
        {
          trait_type: "Cards Per Pack",
          value: 5
        },
        {
          trait_type: "Rarity Distribution",
          value: pack.rarityDistribution
        }
      ],
      properties: {
        pack_type: pack.type.toLowerCase(),
        card_count: 5,
        rarity_distribution: pack.rarityDistribution,
        fungible: true
      }
    };

    const filePath = path.join(__dirname, '..', 'metadata', 'packs', `${pack.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`   ✓ Generated ${pack.name} (${pack.type} - ${pack.rarityDistribution})`);
  });
}

function generateReadme() {
  const readme = `# Avamon Metadata

This directory contains all NFT metadata and images for the Avamon TCG.

## Structure

\`\`\`
metadata/
├── images/          # Card and pack images
├── cards/           # Card metadata JSON files
├── packs/           # Pack metadata JSON files
├── cids.json        # IPFS Content IDs after upload
└── README.md        # This file
\`\`\`

## File Naming Convention

- **Images**: \`{id}.png\` for cards, \`pack_{type}.png\` for packs
- **Card Metadata**: \`{id}.json\`
- **Pack Metadata**: \`{id}.json\`

## IPFS Upload Process

1. Run \`node scripts/generate-metadata.js\` to create JSON files
2. Add your images to the \`images/\` directory
3. Run \`node scripts/upload-to-ipfs.js\` to upload to IPFS
4. Update your contracts with the CIDs from \`cids.json\`

## Updating Metadata

When you update metadata:

1. Make changes to the JSON files
2. Re-upload to IPFS (will get new CID)
3. Update contract URIs with new CID
4. Old metadata remains accessible at previous CID

## Notes

- Replace \`IMAGES_CID\` in JSON files with actual IPFS CID after upload
- All images should be PNG format with transparency
- Recommended image size: 1024x1024px for cards, 800x600px for packs
- Mythic cards support optional MP4 animations
`;

  const readmePath = path.join(__dirname, '..', 'metadata', 'README.md');
  fs.writeFileSync(readmePath, readme);
  console.log('\n📖 Generated README.md');
}

function main() {
  console.log('🎨 Avamon Metadata Generator');
  console.log('============================');

  createDirectories();
  generateCardMetadata();
  generatePackMetadata();
  generateReadme();

  console.log('\n✅ Metadata generation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Add your card images to metadata/images/');
  console.log('2. Add pack images to metadata/images/');
  console.log('3. Run: node scripts/upload-to-ipfs.js');
  console.log('4. Update contracts with IPFS CIDs');

  console.log('\n🔗 Template files created in:');
  console.log('   Cards: metadata/cards/');
  console.log('   Packs: metadata/packs/');
  console.log('   Images: metadata/images/ (add your images here)');
}

// Run the generator
main();
