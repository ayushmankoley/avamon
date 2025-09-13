import { expect } from "chai";
import { ethers } from "hardhat";
import { AvamonToken, AvamonCards, AvamonPacks, AvamonCore } from "../typechain-types";

describe("Avamon Multi-Contract System", function () {
  let avamonToken: AvamonToken;
  let avamonCards: AvamonCards;
  let avamonPacks: AvamonPacks;
  let avamonCore: AvamonCore;
  let owner: any;
  let player1: any;
  let player2: any;

  // Mock VRF parameters for testing
  const mockVrfCoordinator = ethers.ZeroAddress;
  const mockSubscriptionId = 1;
  const mockKeyHash = ethers.ZeroHash;

  before(async () => {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy token contracts
    const AvamonTokenFactory = await ethers.getContractFactory("AvamonToken");
    avamonToken = (await AvamonTokenFactory.deploy(owner.address)) as AvamonToken;
    await avamonToken.waitForDeployment();

    const AvamonCardsFactory = await ethers.getContractFactory("AvamonCards");
    avamonCards = (await AvamonCardsFactory.deploy(owner.address)) as AvamonCards;
    await avamonCards.waitForDeployment();

    const AvamonPacksFactory = await ethers.getContractFactory("AvamonPacks");
    avamonPacks = (await AvamonPacksFactory.deploy(owner.address)) as AvamonPacks;
    await avamonPacks.waitForDeployment();

    // Deploy core contract
    const AvamonCoreFactory = await ethers.getContractFactory("AvamonCore");
    avamonCore = (await AvamonCoreFactory.deploy(
      owner.address, // initialOwner
      mockVrfCoordinator,
      mockSubscriptionId,
      mockKeyHash,
      await avamonToken.getAddress(),
      await avamonCards.getAddress(),
      await avamonPacks.getAddress()
    )) as AvamonCore;
    await avamonCore.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      expect(await avamonToken.getAddress()).to.be.properAddress;
      expect(await avamonCards.getAddress()).to.be.properAddress;
      expect(await avamonPacks.getAddress()).to.be.properAddress;
      expect(await avamonCore.getAddress()).to.be.properAddress;
    });

    it("Should have correct initial $AM supply", async function () {
      const expectedSupply = ethers.parseEther("10000000"); // 10M $AM
      expect(await avamonToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should have correct contract references in AvamonCore", async function () {
      expect(await avamonCore.avamonToken()).to.equal(await avamonToken.getAddress());
      expect(await avamonCore.avamonCards()).to.equal(await avamonCards.getAddress());
      expect(await avamonCore.avamonPacks()).to.equal(await avamonPacks.getAddress());
    });
  });

  describe("Token Integration", function () {
    it("Should allow AvamonCore to spend tokens with approval", async function () {
      const amount = ethers.parseEther("1000");

      // Approve AvamonCore to spend tokens
      await avamonToken.approve(await avamonCore.getAddress(), amount);

      expect(await avamonToken.allowance(owner.address, await avamonCore.getAddress())).to.equal(amount);
    });

    it("Should transfer tokens to AvamonCore for rewards pool", async function () {
      const amount = ethers.parseEther("1000");

      // Transfer tokens to AvamonCore
      await avamonToken.transfer(await avamonCore.getAddress(), amount);

      expect(await avamonToken.balanceOf(await avamonCore.getAddress())).to.equal(amount);
    });
  });

  describe("Card Template Creation", function () {
    it("Should create card templates in AvamonCore", async function () {
      await avamonCore.createCardTemplate("Test Card", 0, 100, 100, 100, 1000);

      const template = await avamonCore.getCardTemplate(1);
      expect(template.name).to.equal("Test Card");
      expect(template.rarity).to.equal(0);
      expect(template.attack).to.equal(100);
      expect(template.defense).to.equal(100);
      expect(template.agility).to.equal(100);
      expect(template.hp).to.equal(1000);
      expect(template.isActive).to.equal(true);
    });
  });

  describe("Pack System Integration", function () {
    it("Should create pack types in AvamonCore", async function () {
      const rarityChances = [70, 25, 5];
      const price = ethers.parseEther("10");

      await avamonCore.createPackType("Test Pack", price, rarityChances);

      const packType = await avamonCore.getPackType(1);
      expect(packType.name).to.equal("Test Pack");
      expect(packType.price).to.equal(price);
      expect(packType.rarityChances[0]).to.equal(70);
      expect(packType.rarityChances[1]).to.equal(25);
      expect(packType.rarityChances[2]).to.equal(5);
      expect(packType.isActive).to.equal(true);
    });

    it("Should allow purchasing packs", async function () {
      // Transfer $AM to player1 for purchasing
      await avamonToken.transfer(player1.address, ethers.parseEther("100"));

      // Player1 approves AvamonCore to spend tokens
      await avamonToken.connect(player1).approve(await avamonCore.getAddress(), ethers.parseEther("100"));

      // Purchase a pack
      await avamonCore.connect(player1).purchasePack(1, 1);

      // Check that player1 received the pack
      expect(await avamonPacks.balanceOf(player1.address, 1)).to.equal(1);
    });
  });

  describe("Adventure System", function () {
    it("Should create adventures in AvamonCore", async function () {
      const entryFee = ethers.parseEther("5");
      const minReward = ethers.parseEther("10");
      const maxReward = ethers.parseEther("100");
      const duration = 24 * 60 * 60; // 24 hours
      const packDropChance = 25;
      const packTypeId = 1;

      await avamonCore.createAdventure(
        "Test Adventure",
        "A test adventure",
        entryFee,
        minReward,
        maxReward,
        duration,
        packDropChance,
        packTypeId
      );

      const adventure = await avamonCore.getAdventure(1);
      expect(adventure.name).to.equal("Test Adventure");
      expect(adventure.entryFee).to.equal(entryFee);
      expect(adventure.minReward).to.equal(minReward);
      expect(adventure.maxReward).to.equal(maxReward);
      expect(adventure.duration).to.equal(duration);
      expect(adventure.packDropChance).to.equal(packDropChance);
      expect(adventure.packTypeId).to.equal(packTypeId);
      expect(adventure.isActive).to.equal(true);
    });
  });

  describe("Energy System", function () {
    it("Should have correct initial energy", async function () {
      const energy = await avamonCore.getCurrentEnergy(player1.address);
      expect(energy).to.equal(10); // DAILY_ENERGY constant
    });

    it("Should allow energy purchase", async function () {
      const energyAmount = 5;
      const cost = ethers.parseEther("0.05"); // 5 * 0.01 AVAX

      await avamonCore.connect(player1).purchaseEnergy(energyAmount, { value: cost });

      const energy = await avamonCore.getCurrentEnergy(player1.address);
      expect(energy).to.equal(15); // 10 initial + 5 purchased
    });
  });

  describe("Deck Management", function () {
    it("Should have correct default deck slots", async function () {
      expect(await avamonCore.maxDeckSlots(player1.address)).to.equal(2);
    });

    it("Should allow deck slot upgrade", async function () {
      const upgradeCost = ethers.parseEther("0.1");

      await avamonCore.connect(player1).upgradeDeckSlots({ value: upgradeCost });

      expect(await avamonCore.maxDeckSlots(player1.address)).to.equal(3);
    });

    it("Should allow saving decks", async function () {
      // First mint some cards to player1
      await avamonCards.mintCard(player1.address, 1, 100, 100, 100, 1000, 0);
      await avamonCards.mintCard(player1.address, 1, 100, 100, 100, 1000, 0);

      const avamonIds = [1, 2]; // Mock Avamon IDs
      const deckName = "Test Deck";

      await avamonCore.connect(player1).saveDeck(0, deckName, avamonIds);

      const decks = await avamonCore.getSavedDecks(player1.address);
      expect(decks.length).to.equal(1);
      expect(decks[0].name).to.equal(deckName);
      expect(decks[0].avamonIds.length).to.equal(2);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to claim tokens from AvamonCore", async function () {
      const claimAmount = ethers.parseEther("100");

      // Ensure AvamonCore has tokens to claim
      const currentBalance = await avamonToken.balanceOf(await avamonCore.getAddress());
      expect(currentBalance).to.be.gte(claimAmount);

      await avamonCore.adminClaim(claimAmount);

      expect(await avamonToken.balanceOf(owner.address)).to.equal(
        ethers.parseEther("10000000") - ethers.parseEther("100") + claimAmount
      );
    });
  });

  describe("Security Features", function () {
    it("Should be pausable by owner", async function () {
      await avamonCore.pause();
      expect(await avamonCore.paused()).to.equal(true);

      await avamonCore.unpause();
      expect(await avamonCore.paused()).to.equal(false);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(avamonCore.connect(player1).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Cross-Contract Calls", function () {
    it("Should handle complex interactions correctly", async function () {
      // This test demonstrates the full integration flow

      // 1. Player has $AM and energy
      const playerBalance = await avamonToken.balanceOf(player1.address);
      expect(playerBalance).to.be.gt(0);

      const playerEnergy = await avamonCore.getCurrentEnergy(player1.address);
      expect(playerEnergy).to.be.gt(0);

      // 2. Player owns Avamon cards
      const card1Owner = await avamonCards.ownerOf(1);
      const card2Owner = await avamonCards.ownerOf(2);
      expect(card1Owner).to.equal(player1.address);
      expect(card2Owner).to.equal(player1.address);

      // 3. Player can interact with all contracts through AvamonCore
      const activeAdventures = await avamonCore.getActiveAdventures(player1.address);
      expect(activeAdventures).to.be.an('array');

      // 4. Contracts maintain their own state correctly
      const tokenSupply = await avamonToken.totalSupply();
      expect(tokenSupply).to.equal(ethers.parseEther("10000000"));

      const cardExists = await avamonCards.exists(1);
      expect(cardExists).to.equal(true);
    });
  });
});
