import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AvamonToken (ERC20) contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAvamonToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying AvamonToken contract...");

  const avamonToken = await deploy("AvamonToken", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    autoMine: true,
  });

  console.log("✅ AvamonToken deployed at:", avamonToken.address);

  // Get the deployed contract to interact with it after deploying
  const tokenContract = await hre.ethers.getContract<Contract>("AvamonToken", deployer);

  // Log initial supply
  const initialSupply = await tokenContract.totalSupply();
  console.log(`💰 Initial $AM supply: ${hre.ethers.formatEther(initialSupply)} $AM`);
  console.log(`👤 Deployer balance: ${hre.ethers.formatEther(await tokenContract.balanceOf(deployer))} $AM`);

  // Save deployment address for other deployments
  hre.deployments.save("AvamonToken", {
    address: avamonToken.address,
    abi: avamonToken.abi,
  });
};

export default deployAvamonToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags AvamonToken
deployAvamonToken.tags = ["AvamonToken", "tokens"];
