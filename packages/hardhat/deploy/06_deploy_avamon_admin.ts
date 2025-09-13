import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AvamonAdmin contract and links it to AvamonCore
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAvamonAdmin: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const { ethers } = hre;

  console.log("🚀 Deploying AvamonAdmin contract...");

  // Get deployed contract addresses
  const avamonCoreDeployment = await hre.deployments.get("AvamonCore");
  const avamonTokenDeployment = await hre.deployments.get("AvamonToken");
  const avamonCardsDeployment = await hre.deployments.get("AvamonCards");
  const avamonPacksDeployment = await hre.deployments.get("AvamonPacks");

  // Deploy the AvamonAdmin contract
  const avamonAdmin = await deploy("AvamonAdmin", {
    from: deployer,
    args: [
      deployer, // initialOwner
      avamonCoreDeployment.address,
      avamonTokenDeployment.address,
      avamonCardsDeployment.address,
      avamonPacksDeployment.address
    ],
    log: true,
    autoMine: true,
  });

  console.log("✅ AvamonAdmin contract deployed at:", avamonAdmin.address);

  // Link the admin contract to the core contract
  console.log("🔗 Linking admin contract to core contract...");

  const avamonCoreContract = await ethers.getContractAt("AvamonCore", avamonCoreDeployment.address);
  const tx = await avamonCoreContract.updateAdminContract(avamonAdmin.address);
  await tx.wait();

  console.log("✅ Admin contract linked successfully");

  // Verify the linkage
  const adminContractAddress = await avamonCoreContract.adminContract();
  console.log(`🔗 Core contract admin address: ${adminContractAddress}`);

  // Test admin functions work
  const avamonAdminContract = await ethers.getContractAt("AvamonAdmin", avamonAdmin.address);
  const isAdmin = await avamonAdminContract.isAdmin(deployer);
  console.log(`👑 Deployer is admin: ${isAdmin}`);

  console.log(`🎮 AvamonAdmin deployment complete!`);
  console.log(`📍 Admin contract address: ${avamonAdmin.address}`);
  console.log(`🎯 Core contract address: ${avamonCoreDeployment.address}`);
};

export default deployAvamonAdmin;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AvamonAdmin
deployAvamonAdmin.tags = ["AvamonAdmin"];
deployAvamonAdmin.dependencies = ["AvamonCore", "AvamonPackOpener"]; // Ensure AvamonCore and PackOpener are deployed first
