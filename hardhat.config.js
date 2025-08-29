require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Use environment variables for sensitive information
const SKALE_ENDPOINT = process.env.SKALE_ENDPOINT || "https://testnet.skalenodes.com/v1/lanky-ill-funny-testnet";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "d6795c913606efc3b717b90514cbf40b666537585c6d30b019de3fcc4f17d5f6";

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