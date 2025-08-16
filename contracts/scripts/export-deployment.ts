import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("Exporting SURR Token deployment information...");

  // Contract address from the ignition deployment
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Read the ABI from the compiled artifacts
  const artifactPath = join(__dirname, "../artifacts/contracts/SURRToken.sol/SURRToken.json");
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  
  // Create deployment info object
  const deploymentInfo = {
    address: contractAddress,
    abi: artifact.abi,
    deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // First Hardhat account
    network: "localhost",
    chainId: 31337,
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
  console.log("Network: localhost (Hardhat)");
  console.log("Chain ID: 31337");
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Initial Supply: 1,000,000 SURR");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error exporting deployment:", error);
    process.exit(1);
  });
