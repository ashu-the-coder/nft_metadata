# Decentralized Configuration Guide for Xinetee Platform

This guide provides instructions for configuring Xinetee in fully decentralized mode, allowing direct interaction with IPFS and blockchain without requiring centralized backend mediation.

## Overview

The Xinetee platform can operate in two modes:
1. **Standard Mode**: Backend server mediates all interactions with IPFS and blockchain
2. **Fully Decentralized Mode**: Frontend directly interacts with IPFS and blockchain

## Prerequisites for Decentralized Mode

- Web3-compatible browser (e.g., Chrome with MetaMask extension)
- MetaMask or similar Ethereum wallet connected to SKALE Network
- CORS-enabled IPFS node accessible from the client browser

## IPFS Node Configuration

To allow direct browser access to your IPFS node, you need to configure CORS settings:

```bash
# Connect to your IPFS node
ssh user@100.123.165.22

# Configure CORS to allow browser access
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST", "PUT"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["X-Requested-With", "Content-Type", "User-Agent"]'

# Restart IPFS daemon
ipfs shutdown
ipfs daemon
```

## Frontend Environment Configuration

Ensure your frontend `.env` file includes these variables:

```
# IPFS Configuration for direct access
VITE_IPFS_API_HOST=100.123.165.22
VITE_IPFS_API_PORT=5001
VITE_IPFS_GATEWAY=http://100.123.165.22:8080/ipfs

# Blockchain Configuration
VITE_CONTRACT_ADDRESS=0x3c4f6f6e09B9ddE24D0DD532927CE9AFAd5a8f0c
```

## User Experience

When using the Xinetee platform in decentralized mode:

1. **NFT Creation**:
   - Toggle "Fully Decentralized Mode" to ON
   - Upload image directly to IPFS
   - Create metadata which is stored directly on IPFS
   - The transaction to store the reference happens directly from the user's wallet

2. **NFT Collection**:
   - Toggle "Decentralized Mode" to ON
   - NFTs are loaded directly from the blockchain and IPFS
   - Verification happens directly against the blockchain

## Fallback Mechanism

The application includes a fallback to server-mediated mode if:
- The wallet is not connected
- Direct IPFS or blockchain interaction fails
- The user chooses to use standard mode

## Benefits of Decentralized Mode

1. **Enhanced Privacy**: No server stores or processes your NFT data
2. **True Ownership**: Direct control over your assets via your wallet
3. **Censorship Resistance**: No central point of failure or control
4. **Transparency**: All interactions are verifiable on the blockchain

## Limitations of Decentralized Mode

1. **Performance**: Direct blockchain interactions can be slower
2. **Gas Costs**: User pays gas fees for all blockchain transactions
3. **Complexity**: Requires wallet setup and management by the user
4. **Browser Support**: Requires Web3-compatible browser

## Security Considerations

When using decentralized mode:
1. **Wallet Security**: Keep your wallet's private keys secure
2. **Website Authentication**: Always verify you're on the correct website
3. **Transaction Verification**: Check all transaction details before signing
4. **Network Selection**: Ensure your wallet is connected to SKALE Network

## Troubleshooting

Common issues in decentralized mode:

1. **CORS Errors**:
   - Error: "Access to fetch at 'http://100.123.165.22:5001/...' from origin '...' has been blocked by CORS policy"
   - Solution: Ensure IPFS node has CORS properly configured

2. **Transaction Failures**:
   - Error: "Transaction underpriced" or similar
   - Solution: Check gas settings in your wallet

3. **IPFS Connection Issues**:
   - Error: "Failed to connect to IPFS"
   - Solution: Verify IPFS node is running and accessible from your browser

4. **Wallet Connection Issues**:
   - Error: "Please connect your wallet"
   - Solution: Unlock your wallet and connect it to the application

## Support

If you encounter issues with decentralized mode, you can:
1. Switch back to standard mode
2. Check the browser console for detailed error messages
3. Contact support at support@xinetee.com
