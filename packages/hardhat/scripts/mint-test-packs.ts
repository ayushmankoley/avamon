import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Minting test packs for current account...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Account: ${deployer.address}`);

  // Get deployed contract addresses
  const adminDeployments = await import("../deployments/avalancheFuji/AvamonAdmin.json");
  const avamonAdminAddress = adminDeployments.address;

  // Get contract instance
  const avamonAdmin = await ethers.getContractAt("AvamonAdmin", avamonAdminAddress);

  console.log("📦 Minting test packs...");

  try {
    // Mint 3 packs of each type for testing
    console.log("Minting Blue Packs (Type 1)...");
    const tx1 = await avamonAdmin.emergencyMintPacks(deployer.address, 1, 3);
    await tx1.wait();

    console.log("Minting Green Packs (Type 2)...");
    const tx2 = await avamonAdmin.emergencyMintPacks(deployer.address, 2, 3);
    await tx2.wait();

    console.log("Minting Red Packs (Type 3)...");
    const tx3 = await avamonAdmin.emergencyMintPacks(deployer.address, 3, 3);
    await tx3.wait();

    console.log("✅ Successfully minted test packs!");
    console.log("You should now have 3 packs of each type available in the frontend.");
  } catch (error) {
    console.error("❌ Failed to mint test packs:", error);
    console.log("\nMake sure you're using the deployer account or the contract owner account.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
