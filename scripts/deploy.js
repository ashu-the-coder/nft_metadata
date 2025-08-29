const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment to", hre.network.name, "network...");

  console.log("Deploying XineteDecentralizedStorage contract...");

  // Get contract factory
  const XineteStorage = await hre.ethers.getContractFactory("XineteDecentralizedStorage");
  
  // Deploy contract
  console.log("Deploying...");
  const xineteStorage = await XineteStorage.deploy();

  console.log("Waiting for deployment transaction confirmation...");
  await xineteStorage.waitForDeployment();
  const address = await xineteStorage.getAddress();

  console.log("XineteDecentralizedStorage deployed to:", address);
  
  // Save deployment information to a file
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Save deployment info
  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to deployments/${hre.network.name}.json`);
  
  // If we're on a testnet or mainnet, wait for verification
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for 6 block confirmations before verification...");
    await xineteStorage.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: []
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }
  
  return address;
}

main()
  .then((address) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });