import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AvamonCore contract with VRF integration
 * Requires AvamonToken, AvamonCards, and AvamonPacks to be deployed first
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAvamonCore: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;
  const { ethers } = hre;

  console.log("🚀 Deploying AvamonCore contract...");

  // Get deployed contract addresses
  const avamonTokenDeployment = await get("AvamonToken");
  const avamonCardsDeployment = await get("AvamonCards");
  const avamonPacksDeployment = await get("AvamonPacks");

  console.log(`📋 AvamonToken: ${avamonTokenDeployment.address}`);
  console.log(`🎴 AvamonCards: ${avamonCardsDeployment.address}`);
  console.log(`📦 AvamonPacks: ${avamonPacksDeployment.address}`);

  console.log("🎮 Deploying simplified AvamonCore without VRF integration");

  // Deploy the AvamonCore contract
  const avamonCore = await deploy("AvamonCore", {
    from: deployer,
    args: [
      deployer, // initialOwner
      avamonTokenDeployment.address,
      avamonCardsDeployment.address,
      avamonPacksDeployment.address
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ AvamonCore deployed at:", avamonCore.address);

  // Get the deployed contract
  const avamonCoreContract = await ethers.getContractAt("AvamonCore", avamonCore.address);

  // Grant roles to AvamonCore so it can manage packs
  const packsContract = await ethers.getContractAt("AvamonPacks", avamonPacksDeployment.address);
  console.log("🔄 Granting roles to AvamonCore...");
  await packsContract.grantRole(await packsContract.DEFAULT_ADMIN_ROLE(), avamonCore.address);
  await packsContract.grantMinterRole(avamonCore.address);
  console.log("✅ AvamonCore granted admin and minter roles");

  // Grant minter role to AvamonCore so it can mint cards
  const cardsContract = await ethers.getContractAt("AvamonCards", avamonCardsDeployment.address);
  console.log("🔄 Granting minter role to AvamonCore...");
  await cardsContract.grantMinterRole(avamonCore.address);
  console.log("✅ AvamonCore granted minter role for cards");

  console.log("🎉 AvamonCore deployment complete!");
  console.log(`📍 Contract address: ${avamonCore.address}`);
  console.log(`👤 Owner: ${await avamonCoreContract.owner()}`);
  console.log(`💰 Token contract: ${await avamonCoreContract.avamonToken()}`);
  console.log(`🃏 Cards contract: ${await avamonCoreContract.avamonCards()}`);
  console.log(`📦 Packs contract: ${await avamonCoreContract.avamonPacks()}`);

  // Save deployment address
  hre.deployments.save("AvamonCore", {
    address: avamonCore.address,
    abi: avamonCore.abi,
  });
};

export default deployAvamonCore;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AvamonCore
deployAvamonCore.tags = ["AvamonCore", "core"];

deployAvamonCore.dependencies = ["AvamonToken", "AvamonCards", "AvamonPacks"];
