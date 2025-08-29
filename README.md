# Xinetee Fully Decentralized Storage Platform

A 100% decentralized storage platform built on SKALE Network that allows users to store and manage NFT metadata using direct IPFS node interactions and blockchain technology, featuring secure hash-based metadata retrieval without any centralized backend.

## Project Overview

Xinetee is a fully decentralized storage solution that combines:
- IPFS (InterPlanetary File System) for distributed file storage with direct node interaction
- SKALE Network for blockchain operations
- Smart contracts for managing metadata ownership and verification
- React frontend with wallet-based authentication
- No backend dependencies - everything runs client-side
- Hash-based file retrieval system for enhanced security

## Technical Stack

### Frontend
- React.js with Vite for fast development
- Ethers.js for blockchain interactions
- IPFS HTTP Client for direct IPFS node interaction
- TailwindCSS for responsive UI
- Browser Web Crypto API for hashing operations

### Blockchain
- SKALE Network (Testnet)
- Solidity smart contracts
- Hardhat development environment

### IPFS Storage
- Direct IPFS node interaction via HTTP client
- Automatic content pinning system
- Opportunistic pinning on content retrieval
- Manual pinning controls
- For detailed information about the pinning system, see [IPFS_PINNING.md](./docs/IPFS_PINNING.md)

## Project Structure

```
├── contracts/
│   └── XineteDecentralizedStorage.sol  # Smart contract for decentralized storage
├── frontend/
│   ├── src/                            # Source code directory
│   │   ├── components/                 # React components
│   │   ├── contexts/                   # React contexts (BlockchainContext, ThemeContext)
│   │   ├── services/                   # Blockchain and IPFS services
│   │   │   ├── blockchainService.js    # Direct blockchain interaction service
│   │   │   └── ipfsService.js          # Direct IPFS interaction service
│   │   ├── contracts/                  # Contract ABIs
│   │   └── App.jsx                     # Main application component
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Frontend dependencies
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   ├── postcss.config.js               # PostCSS configuration
│   └── vite.config.js                  # Vite bundler configuration
├── scripts/
│   └── deploy.js                       # Contract deployment script
├── artifacts/                          # Compiled contract artifacts
├── cache/                              # Hardhat cache directory
├── hardhat.config.js                   # Hardhat configuration
└── package.json                        # Project dependencies
```

## Setup Instructions

### Prerequisites

1. Node.js (v16 or higher)
2. Local IPFS node or access to a remote IPFS node
3. MetaMask or another Ethereum wallet
4. Git

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd xinete-storage
```

2. Install dependencies and compile contracts:
```bash
npm install
npx hardhat compile
```

3. Deploy the smart contract:
```bash
npx hardhat run scripts/deploy.js --network skale
```

4. Configure frontend environment:
```bash
cd frontend
cp .env.example .env
```

5. Update the `.env` file with:
```
# IPFS Gateway URL for accessing content
VITE_IPFS_GATEWAY=http://localhost:8080/ipfs

# IPFS API Configuration for direct access
VITE_IPFS_API_HOST=localhost
VITE_IPFS_API_PORT=5001

# Blockchain Configuration
VITE_CONTRACT_ADDRESS=<deployed-contract-address>
VITE_BLOCKCHAIN_RPC_URL=https://testnet.skalenodes.com/v1/lanky-ill-funny-testnet
```

6. Start the development server:
```bash
npm run dev
```

## Usage Guide

### Setting Up Your IPFS Node

1. Install IPFS Desktop or IPFS Daemon:
   - [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
   - [IPFS Command Line](https://docs.ipfs.tech/install/command-line/)

2. Ensure CORS is properly configured on your IPFS node:
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

3. Restart your IPFS node

### Creating NFTs

1. Connect your wallet by clicking "Connect Wallet" in the navbar
2. Navigate to "Create NFT" page
3. Upload an image
4. Fill in the metadata (name, description, attributes)
5. Submit to store on IPFS and register on the blockchain

### Viewing Your NFT Collection

1. Connect your wallet
2. Navigate to "NFT Collection" page
3. All NFTs associated with your wallet address will be displayed
4. You can verify each NFT's blockchain registration by clicking "Verify on Blockchain"

## Core Features

1. **100% Decentralized Operation**:
   - No centralized backend or database
   - All data stored on IPFS and blockchain
   - Direct IPFS node interaction from the browser

2. **Wallet-Based Authentication**:
   - No username/password needed
   - Secure Web3 wallet integration
   - Seamless blockchain interaction

3. **Metadata Storage and Verification**:
   - NFT metadata stored on IPFS
   - CIDs and hashes stored on blockchain
   - Cryptographic verification of metadata integrity

4. **Direct IPFS Integration**:
   - Upload directly to IPFS nodes
   - No centralized pinning service required
   - Client-side IPFS interaction

## License

[MIT License](LICENSE)
