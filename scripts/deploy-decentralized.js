// Deploy script for XineteDecentralizedStorage contract
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying XineteDecentralizedStorage contract...");

  // Get the contract factory
  const XineteDecentralizedStorage = await ethers.getContractFactory("XineteDecentralizedStorage");
  
  // Deploy the contract
  const contract = await XineteDecentralizedStorage.deploy();
  
  // Wait for deployment to complete
  await contract.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await contract.getAddress();
  
  console.log(`XineteDecentralizedStorage deployed to: ${contractAddress}`);
  console.log("Deployment completed successfully!");

  // Save this to know where the contract is deployed
  saveContractAddress(contractAddress);
  
  return contractAddress;
}

function saveContractAddress(address) {
  const fs = require("fs");
  const contractAddresses = {
    XineteDecentralizedStorage: address
  };
  
  // Save contract address to a file for easy access
  fs.writeFileSync(
    "contract-address.json",
    JSON.stringify(contractAddresses, null, 2)
  );
  
  console.log("Contract address saved to contract-address.json");
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
