import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AvamonCards (ERC721) contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAvamonCards: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying AvamonCards contract...");

  const avamonCards = await deploy("AvamonCards", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  console.log("✅ AvamonCards deployed at:", avamonCards.address);

  // Get the deployed contract to interact with it after deploying
  const cardsContract = await hre.ethers.getContract<Contract>("AvamonCards", deployer);

  // Log contract info
  console.log(`🎴 ERC721 Avamon Cards deployed`);
  console.log(`👤 Owner: ${await cardsContract.owner()}`);

  // Save deployment address for other deployments
  hre.deployments.save("AvamonCards", {
    address: avamonCards.address,
    abi: avamonCards.abi,
  });
};

export default deployAvamonCards;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AvamonCards
deployAvamonCards.tags = ["AvamonCards", "tokens"];
