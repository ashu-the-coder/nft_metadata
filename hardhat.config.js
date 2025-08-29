require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Use environment variables for sensitive information
const SKALE_ENDPOINT = process.env.SKALE_ENDPOINT || "https://testnet.skalenodes.com/v1/lanky-ill-funny-testnet";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Validate environment variables
if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY environment variable not set!");
  process.exit(1);
}

module.exports = {
  solidity: "0.8.19",
  networks: {
    skale: {
      url: SKALE_ENDPOINT,
      accounts: [PRIVATE_KEY]
    },
    hardhat: {
      chainId: 1337
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  // Enable gas reporting for production optimization
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};