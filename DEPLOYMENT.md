# Deployment Guide for Xinetee Decentralized Storage Platform

This guide will walk you through the process of deploying the Xinetee platform to a production environment.

## Prerequisites

- Node.js (v16 or higher)
- Access to a SKALE network endpoint (testnet or mainnet)
- An Ethereum wallet with SKALE tokens for deployment
- A dedicated IPFS node or access to an IPFS pinning service
- Git

## 1. Clone and Prepare the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/xinete-storage.git
cd xinete-storage

# Install dependencies
npm install
```

## 2. Configure Environment Variables

### For Smart Contract Deployment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your deployment wallet's private key and SKALE endpoint:

```
# Blockchain Configuration
PRIVATE_KEY=your_private_key_here
SKALE_ENDPOINT=https://mainnet.skalenodes.com/v1/your-skale-chain-endpoint

# IPFS Configuration
IPFS_API_HOST=your-ipfs-node.example.com
IPFS_API_PORT=5001
IPFS_GATEWAY_PORT=8080
IPFS_SPAWN_PORT=4001
```

⚠️ **IMPORTANT**: Never commit your private key to version control. Always keep your `.env` file in `.gitignore`.

⚠️ **IMPORTANT**: Never commit your private key to version control. Always keep your `.env` file in `.gitignore`.

### For Frontend

Create a production environment file:

```bash
cd frontend
cp .env.example .env.production
```

Edit the `.env.production` file:

```
# Production IPFS Configuration
VITE_IPFS_GATEWAY=https://cloudflare-ipfs.com/ipfs
VITE_IPFS_API_HOST=your-ipfs-node.example.com
VITE_IPFS_API_PORT=5001

# Production Blockchain Configuration
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_BLOCKCHAIN_RPC_URL=https://mainnet.skalenodes.com/v1/your-skale-chain-endpoint

# Optional: Public gateway fallback
VITE_IPFS_PUBLIC_GATEWAY=https://cloudflare-ipfs.com/ipfs
```

## 3. Deploy Smart Contract

From the root directory:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network skale
```

This will:
1. Compile your contracts
2. Deploy to the SKALE network
3. Save deployment information to `deployments/skale.json`
4. Attempt to verify the contract on the block explorer (if available)

⚠️ **Note**: Copy the deployed contract address for the next step.

## 4. Update Frontend Configuration

Update your `.env.production` file with the deployed contract address:

```
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
```

## 5. Build the Frontend

```bash
cd frontend
npm run build
```

This will create a production-ready build in the `dist` directory.

## 6. Deploy the Frontend

### Option 1: Static Hosting (Recommended)

You can deploy the frontend to any static hosting service:

- **Netlify**: Connect your repository and set the build command to `cd frontend && npm run build`
- **Vercel**: Similar to Netlify, connect your repository
- **AWS S3**: Upload the `dist` directory and configure for static website hosting
- **GitHub Pages**: Deploy the `dist` directory

### Option 2: Traditional Web Server

If using a traditional web server (Nginx, Apache):

```bash
# Example for Nginx
cp -r frontend/dist/* /var/www/html/
```

Configure your web server with proper headers:

Configure your web server with proper headers:

```nginx
# Example Nginx configuration
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Add CORS headers for IPFS node access
    location /ipfs-cors/ {
        proxy_pass http://your-ipfs-node:5001/;
        proxy_set_header Host $host;
        add_header Access-Control-Allow-Origin '*' always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
        add_header Access-Control-Allow-Headers 'Origin, X-Requested-With, Content-Type, Accept' always;
    }
}
```

## 7. Configure IPFS Node for Production

If running your own IPFS node, ensure it's properly configured:

```bash
# Configure CORS headers
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["https://your-domain.com", "https://www.your-domain.com"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'

# Restart IPFS daemon
ipfs daemon
```

## 8. Test Your Deployment

1. Visit your deployed frontend
2. Connect your wallet to SKALE network
3. Create an NFT to verify everything works
4. Check that the NFT appears in your collection

## Security Considerations

1. **Private Keys**: Never expose private keys in your code or frontend
2. **IPFS Node**: Secure your IPFS node properly if using your own
3. **Frontend Security**: Consider adding Content Security Policy headers
4. **Rate Limiting**: Implement rate limiting for your IPFS node if public

## Monitoring and Maintenance

1. **Contract Monitoring**: Monitor your contract for any unusual activity
2. **IPFS Pinning**: Regularly check that content is still pinned on IPFS
3. **Frontend Updates**: When updating, always test thoroughly before deploying

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**:
   - Ensure the correct network is configured in MetaMask
   - Check console for connection errors

2. **IPFS Upload Failures**:
   - Verify IPFS node connectivity and CORS settings
   - Check for sufficient storage space on IPFS node

3. **Contract Interaction Failures**:
   - Verify contract address is correct
   - Ensure wallet has SKALE tokens for gas
   - Check that ABI matches deployed contract

For more detailed issues, check the browser console and server logs.