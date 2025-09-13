import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AvamonPackOpener contract with VRF integration
 * Requires AvamonCore, AvamonCards, and AvamonPacks to be deployed first
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAvamonPackOpener: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;
  const { ethers } = hre;

  console.log("🚀 Deploying AvamonPackOpener contract...");

  // Get deployed contract addresses
  const avamonCoreDeployment = await get("AvamonCore");
  const avamonCardsDeployment = await get("AvamonCards");
  const avamonPacksDeployment = await get("AvamonPacks");

  console.log(`🎮 AvamonCore: ${avamonCoreDeployment.address}`);
  console.log(`🎴 AvamonCards: ${avamonCardsDeployment.address}`);
  console.log(`📦 AvamonPacks: ${avamonPacksDeployment.address}`);

  // VRF Configuration - Update these values based on your target network
  let vrfCoordinator: string;
  let keyHash: string;
  let subscriptionId: string;

  const network = hre.network.name;

  if (network === "avalancheFuji") {
    // Avalanche Fuji Testnet VRF v2.5 - Updated values
    vrfCoordinator = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
    keyHash = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15"; // 300 gwei Key Hash
    subscriptionId = "91079342575160547822082997306697287100729604052742238350133136156760573370174";
  } else if (network === "avalanche") {
    // Avalanche Mainnet VRF v2
    vrfCoordinator = "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634";
    keyHash = "0x89630569c9567e43c4fe73619d9a2fd30d5325d12b9f8e5b2839a8e8a9b6d1b85";
    subscriptionId = "1"; // You'll need to create a subscription on mainnet
  } else {
    // Local development - using mock values
    console.log("⚠️  Using mock VRF values for local development");
    vrfCoordinator = ethers.ZeroAddress;
    keyHash = ethers.ZeroHash;
    subscriptionId = "1";
  }

  console.log(`📡 VRF Coordinator: ${vrfCoordinator}`);
  console.log(`🔑 Key Hash: ${keyHash}`);
  console.log(`📋 Subscription ID: ${subscriptionId}`);

  // Deploy the AvamonPackOpener contract
  const avamonPackOpener = await deploy("AvamonPackOpener", {
    from: deployer,
    args: [
      deployer, // initialOwner
      vrfCoordinator,
      subscriptionId,
      keyHash,
      avamonCardsDeployment.address,
      avamonPacksDeployment.address,
      avamonCoreDeployment.address
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ AvamonPackOpener deployed at:", avamonPackOpener.address);

  // Link the pack opener to the core contract
  console.log("🔗 Linking pack opener to core contract...");
  const avamonCoreContract = await ethers.getContractAt("AvamonCore", avamonCoreDeployment.address);
  const tx = await avamonCoreContract.setPackOpenerContract(avamonPackOpener.address);
  await tx.wait();

  console.log("✅ Pack opener linked successfully");

  // Grant burner role to AvamonPackOpener so it can burn packs when opening
  console.log("🔄 Granting burner role to AvamonPackOpener...");
  const packsContract = await ethers.getContractAt("AvamonPacks", avamonPacksDeployment.address);
  const grantTx = await packsContract.grantBurnerRole(avamonPackOpener.address);
  await grantTx.wait();
  console.log("✅ AvamonPackOpener granted burner role");

  // Grant minter role to AvamonPackOpener so it can mint cards when opening packs
  console.log("🔄 Granting minter role to AvamonPackOpener...");
  const cardsContract = await ethers.getContractAt("AvamonCards", avamonCardsDeployment.address);
  const cardGrantTx = await cardsContract.grantMinterRole(avamonPackOpener.address);
  await cardGrantTx.wait();
  console.log("✅ AvamonPackOpener granted minter role for cards");

  // Get the deployed contract
  const avamonPackOpenerContract = await ethers.getContractAt("AvamonPackOpener", avamonPackOpener.address);

  console.log("🎉 AvamonPackOpener deployment complete!");
  console.log(`📍 Contract address: ${avamonPackOpener.address}`);
  console.log(`👤 Owner: ${await avamonPackOpenerContract.owner()}`);

  // Save deployment address
  hre.deployments.save("AvamonPackOpener", {
    address: avamonPackOpener.address,
    abi: avamonPackOpener.abi,
  });
};

export default deployAvamonPackOpener;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AvamonPackOpener
deployAvamonPackOpener.tags = ["AvamonPackOpener", "pack"];

deployAvamonPackOpener.dependencies = ["AvamonCore", "AvamonCards", "AvamonPacks"];
