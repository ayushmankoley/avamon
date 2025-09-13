import { expect } from "chai";
import { ethers } from "hardhat";
import { Avamon } from "../typechain-types";

describe("Avamon TCG Contract", function () {
  let avamon: Avamon;
  let owner: any;
  let player1: any;
  let player2: any;

  // Mock VRF parameters for testing
  const mockVrfCoordinator = ethers.ZeroAddress;
  const mockSubscriptionId = 1;
  const mockKeyHash = ethers.ZeroHash;

  before(async () => {
    [owner, player1, player2] = await ethers.getSigners();

    const avamonFactory = await ethers.getContractFactory("Avamon");
    avamon = (await avamonFactory.deploy(
      mockVrfCoordinator,
      mockSubscriptionId,
      mockKeyHash
    )) as Avamon;
    await avamon.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await avamon.getAddress()).to.be.properAddress;
    });

    it("Should have correct initial $AM supply", async function () {
      const expectedSupply = ethers.parseEther("10000000"); // 10M $AM
      expect(await avamon.totalSupply()).to.equal(expectedSupply);
      expect(await avamon.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should have correct owner", async function () {
      expect(await avamon.owner()).to.equal(owner.address);
    });
  });

  describe("ERC20 Token ($AM)", function () {
    it("Should have correct token name and symbol", async function () {
      expect(await avamon.name()).to.equal("Avamon Token");
      expect(await avamon.symbol()).to.equal("AM");
    });

    it("Should allow token transfers", async function () {
      const transferAmount = ethers.parseEther("1000");

      await avamon.transfer(player1.address, transferAmount);
      expect(await avamon.balanceOf(player1.address)).to.equal(transferAmount);
      expect(await avamon.balanceOf(owner.address)).to.equal(
        ethers.parseEther("10000000") - transferAmount
      );
    });
  });

  describe("Card Templates", function () {
    it("Should allow owner to create card templates", async function () {
      await avamon.createCardTemplate("Test Card", 0, 100, 100, 100, 1000);

      const template = await avamon.getCardTemplate(1);
      expect(template.name).to.equal("Test Card");
      expect(template.rarity).to.equal(0);
      expect(template.attack).to.equal(100);
      expect(template.defense).to.equal(100);
      expect(template.agility).to.equal(100);
      expect(template.hp).to.equal(1000);
      expect(template.isActive).to.equal(true);
    });

    it("Should not allow non-owner to create card templates", async function () {
      await expect(
        avamon.connect(player1).createCardTemplate("Unauthorized Card", 0, 100, 100, 100, 1000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update card template status", async function () {
      await avamon.updateCardTemplate(1, false);
      const template = await avamon.getCardTemplate(1);
      expect(template.isActive).to.equal(false);
    });
  });

  describe("Pack Types", function () {
    it("Should allow owner to create pack types", async function () {
      const rarityChances = [70, 25, 5];
      const price = ethers.parseEther("10");

      await avamon.createPackType("Test Pack", price, rarityChances);

      const packType = await avamon.getPackType(1);
      expect(packType.name).to.equal("Test Pack");
      expect(packType.price).to.equal(price);
      expect(packType.rarityChances[0]).to.equal(70);
      expect(packType.rarityChances[1]).to.equal(25);
      expect(packType.rarityChances[2]).to.equal(5);
      expect(packType.isActive).to.equal(true);
    });

    it("Should reject invalid rarity chances", async function () {
      const invalidChances = [50, 30, 30]; // Sum to 110, should fail
      await expect(
        avamon.createPackType("Invalid Pack", ethers.parseEther("10"), invalidChances)
      ).to.be.revertedWith("Chances must sum to 100");
    });
  });

  describe("Adventures", function () {
    it("Should allow owner to create adventures", async function () {
      const entryFee = ethers.parseEther("5");
      const minReward = ethers.parseEther("10");
      const maxReward = ethers.parseEther("100");
      const duration = 24 * 60 * 60; // 24 hours
      const packDropChance = 25;
      const packTypeId = 1;

      await avamon.createAdventure(
        "Test Adventure",
        "A test adventure",
        entryFee,
        minReward,
        maxReward,
        duration,
        packDropChance,
        packTypeId
      );

      const adventure = await avamon.getAdventure(1);
      expect(adventure.name).to.equal("Test Adventure");
      expect(adventure.entryFee).to.equal(entryFee);
      expect(adventure.minReward).to.equal(minReward);
      expect(adventure.maxReward).to.equal(maxReward);
      expect(adventure.duration).to.equal(duration);
      expect(adventure.packDropChance).to.equal(packDropChance);
      expect(adventure.packTypeId).to.equal(packTypeId);
      expect(adventure.isActive).to.equal(true);
    });

    it("Should reject adventures with duration too short", async function () {
      await expect(
        avamon.createAdventure(
          "Short Adventure",
          "Too short",
          ethers.parseEther("1"),
          ethers.parseEther("10"),
          ethers.parseEther("50"),
          5 * 60, // 5 minutes, below minimum
          10,
          1
        )
      ).to.be.revertedWith("Duration too short");
    });
  });

  describe("Energy System", function () {
    it("Should have correct initial energy", async function () {
      const energy = await avamon.getCurrentEnergy(player1.address);
      expect(energy).to.equal(10); // DAILY_ENERGY constant
    });

    it("Should allow energy purchase", async function () {
      const energyAmount = 5;
      const cost = ethers.parseEther("0.05"); // 5 * 0.01 AVAX

      await avamon.connect(player1).purchaseEnergy(energyAmount, { value: cost });

      const energy = await avamon.getCurrentEnergy(player1.address);
      expect(energy).to.equal(15); // 10 initial + 5 purchased
    });
  });

  describe("Deck Management", function () {
    it("Should have correct default deck slots", async function () {
      expect(await avamon.maxDeckSlots(player1.address)).to.equal(2);
    });

    it("Should allow deck slot upgrade", async function () {
      const upgradeCost = ethers.parseEther("0.1");

      await avamon.connect(player1).upgradeDeckSlots({ value: upgradeCost });

      expect(await avamon.maxDeckSlots(player1.address)).to.equal(3);
    });

    it("Should allow saving decks", async function () {
      const avamonIds = [1, 2, 3]; // Mock Avamon IDs
      const deckName = "Test Deck";

      await avamon.connect(player1).saveDeck(0, deckName, avamonIds);

      const decks = await avamon.getSavedDecks(player1.address);
      expect(decks.length).to.equal(1);
      expect(decks[0].name).to.equal(deckName);
      expect(decks[0].avamonIds.length).to.equal(3);
    });
  });

  describe("Pack Purchasing", function () {
    it("Should allow purchasing packs", async function () {
      // Transfer $AM to player1 for purchasing
      await avamon.transfer(player1.address, ethers.parseEther("100"));

      // Purchase a pack
      await avamon.connect(player1).purchasePack(1, 1);

      // Check that player1 received the pack (ERC1155 balance)
      expect(await avamon.balanceOf(player1.address, 1)).to.equal(1);
    });

    it("Should not allow purchasing without sufficient funds", async function () {
      await expect(
        avamon.connect(player2).purchasePack(1, 1)
      ).to.be.revertedWith("Insufficient $AM balance");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to claim tokens", async function () {
      const claimAmount = ethers.parseEther("1000");

      // First transfer some tokens to contract
      await avamon.transfer(await avamon.getAddress(), claimAmount);

      await avamon.adminClaim(claimAmount);

      expect(await avamon.balanceOf(owner.address)).to.equal(
        ethers.parseEther("10000000") - ethers.parseEther("1000") + claimAmount
      );
    });
  });

  describe("Security Features", function () {
    it("Should be pausable by owner", async function () {
      await avamon.pause();
      expect(await avamon.paused()).to.equal(true);

      await avamon.unpause();
      expect(await avamon.paused()).to.equal(false);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(avamon.connect(player1).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
