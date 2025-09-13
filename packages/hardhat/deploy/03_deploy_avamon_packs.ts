import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AvamonPacks (ERC1155) contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAvamonPacks: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying AvamonPacks contract...");

  const avamonPacks = await deploy("AvamonPacks", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  console.log("✅ AvamonPacks deployed at:", avamonPacks.address);

  // Get the deployed contract to interact with it after deploying
  const packsContract = await hre.ethers.getContract<Contract>("AvamonPacks", deployer);

  // Log contract info
  console.log(`📦 ERC1155 Avamon Packs deployed`);
  console.log(`👤 Owner: ${await packsContract.owner()}`);

  // Save deployment address for other deployments
  hre.deployments.save("AvamonPacks", {
    address: avamonPacks.address,
    abi: avamonPacks.abi,
  });
};

export default deployAvamonPacks;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AvamonPacks
deployAvamonPacks.tags = ["AvamonPacks", "tokens"];
