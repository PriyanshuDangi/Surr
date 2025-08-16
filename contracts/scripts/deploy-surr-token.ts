import hre from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { formatEther, getAddress } from "viem";

async function main() {
  console.log("Deploying SURR Token contract...");

  // Get the public client for reading
  const publicClient = await hre.viem.getPublicClient();
  
  // Get the wallet client for deploying
  const [deployerWallet] = await hre.viem.getWalletClients();
  const deployer = deployerWallet.account.address;
  
  console.log("Deploying with account:", deployer);
  
  // Check deployer balance
  const balance = await publicClient.getBalance({ address: deployer });
  console.log("Account balance:", formatEther(balance), "ETH");

  // Deploy the contract
  const surrToken = await hre.viem.deployContract("SURRToken", [deployer]);
  console.log("SURR Token deployed to:", surrToken.address);

  // Verify initial token balance
  const initialBalance = await publicClient.readContract({
    address: surrToken.address,
    abi: surrToken.abi,
    functionName: "balanceOf",
    args: [deployer]
  });
  console.log("Initial token balance for deployer:", formatEther(initialBalance as bigint), "SURR");

  // Create deployment info object
  const deploymentInfo = {
    address: surrToken.address,
    abi: surrToken.abi,
    deployer: deployer,
    network: "localhost",
    blockNumber: await publicClient.getBlockNumber(),
    timestamp: Date.now()
  };

  // Create client directory if it doesn't exist
  const clientDir = join(__dirname, "../../client/src/web3");
  try {
    mkdirSync(clientDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Write contract info to client directory
  const deploymentPath = join(clientDir, "SURRToken-deployment.json");
  writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Contract deployment info saved to:", deploymentPath);

  // Also save to contracts directory for server use
  const serverDeploymentPath = join(__dirname, "../deployments/SURRToken-localhost.json");
  try {
    mkdirSync(join(__dirname, "../deployments"), { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  writeFileSync(serverDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Contract deployment info saved to:", serverDeploymentPath);

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Contract Address:", contractAddress);
  console.log("Initial Supply:", ethers.formatEther(initialBalance), "SURR");
  console.log("Owner:", deployer.address);
  console.log("Network: localhost");
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
