# Production Deployment Guide for Xinetee NFT Metadata Storage

This guide provides detailed instructions for deploying the Xinetee NFT Metadata Storage platform in a production environment. Follow these steps carefully to ensure a secure and optimized deployment.

## Prerequisites

- Linux server with at least 2 CPU cores and 4GB RAM
- Python 3.8+
- Node.js 14+
- MongoDB 4.4+
- IPFS node (already running at 100.123.165.22)
- Domain name (optional but recommended)
- SSL certificate (recommended for production)

## 1. Server Setup

### System Updates
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential python3-dev python3-pip nginx
```

### Firewall Configuration
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp  # API server
sudo ufw allow 5173/tcp  # Frontend (development only)
sudo ufw enable
```

## 2. Clone the Repository

```bash
git clone https://github.com/ashu-the-coder/modular_repo.git
cd modular_repo
```

## 3. Backend Setup

### Install Dependencies
```bash
pip3 install -r requirements.txt
```

### Configure Environment Variables
Ensure your `.env` files are properly set up in both the root directory, backend, and frontend:

1. Root `.env` (for IPFS configuration):
```
IPFS_API_HOST=100.123.165.22
IPFS_API_PORT=5001
IPFS_GATEWAY_PORT=8080
IPFS_SPAWN_PORT=4001
```

2. Backend `.env`:
```
# FastAPI Settings
SECRET_KEY=your_secret_key_here
PORT=8000
HOST=0.0.0.0

# Pinata IPFS Settings
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret

# SKALE Network Settings
SKALE_ENDPOINT=https://testnet.skalenodes.com/v1/lanky-ill-funny-testnet
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# MongoDB Settings
MONGO_URI=mongodb://admin:%40dminXinetee%40123@100.123.165.22:27017
MONGO_DB=xinetee
MONGO_USERS_COLLECTION=users
MONGO_NFT_COLLECTION=nft_metadata

# CORS Settings
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
```

### Set Up a Systemd Service for the Backend

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/xinetee-backend.service
```

Add the following content:

```
[Unit]
Description=Xinetee Backend Service
After=network.target

[Service]
User=your_username
Group=your_group
WorkingDirectory=/path/to/modular_repo/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=xinetee-backend
Environment="PATH=/usr/bin:/usr/local/bin"
EnvironmentFile=/path/to/modular_repo/backend/.env

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable xinetee-backend
sudo systemctl start xinetee-backend
```

## 4. Frontend Setup

### Install Dependencies and Build
```bash
cd frontend
npm install
npm run build
```

### Configure Nginx for Frontend

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/xinetee-frontend
```

Add the following content:

```
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Frontend static files
    location / {
        root /path/to/modular_repo/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # IPFS gateway proxy (optional)
    location /ipfs/ {
        proxy_pass http://100.123.165.22:8080/ipfs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/xinetee-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Smart Contract Deployment

If you haven't deployed the smart contract yet:

```bash
npx hardhat run scripts/deploy.js --network skale
```

Save the contract address and update it in your backend `.env` file.

## 6. Data Persistence

### MongoDB Backup

Set up a scheduled backup for MongoDB:

```bash
sudo nano /etc/cron.daily/mongodb-backup
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://admin:%40dminXinetee%40123@100.123.165.22:27017" --out="$BACKUP_DIR/backup-$TIMESTAMP"
# Keep only the last 7 backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Make it executable:

```bash
sudo chmod +x /etc/cron.daily/mongodb-backup
```

### IPFS Data Persistence

The IPFS node is critical for NFT metadata storage. Ensure it's properly set up for persistence:

1. If using a local node, configure it to maintain pinned content:
   ```bash
   ipfs config Datastore.StorageMax 20GB
   ```

2. Use Pinata as a backup pinning service (already implemented in the code)

## 7. Monitoring and Logging

### Setup Monitoring with Prometheus and Grafana

1. Install Prometheus:
   ```bash
   sudo apt install -y prometheus
   ```

2. Configure Prometheus to scrape metrics from your backend (requires additional instrumentation)

3. Install Grafana:
   ```bash
   sudo apt install -y grafana
   ```

4. Set up dashboards for monitoring system resources and application metrics

### Logging

Configure structured logging for the backend:

1. Install Python logging libraries:
   ```bash
   pip install python-json-logger
   ```

2. Update the logging configuration in the backend to use structured JSON logs

## 8. Security Considerations

1. **API Rate Limiting**: Configure rate limiting in your FastAPI application or at the Nginx level
2. **JWT Token Security**: Ensure JWT tokens have appropriate expiration times and refresh token mechanisms
3. **Private Key Security**: Store private keys securely, consider using a key management service
4. **Input Validation**: Ensure all user inputs are validated and sanitized
5. **Regular Security Updates**: Keep all dependencies updated with security patches

## 9. Production Checklist

Before going live, verify:

- [ ] All environment variables are correctly set for production
- [ ] Frontend is built with production optimizations (`npm run build`)
- [ ] SSL certificates are valid and properly installed
- [ ] Database backups are configured and tested
- [ ] Monitoring and alerting are in place
- [ ] Rate limiting is configured
- [ ] CORS settings are properly restricted
- [ ] Error handling and logging are comprehensive

## 10. Scaling Considerations

If your platform grows, consider:

1. **Load Balancing**: Add multiple backend instances behind a load balancer
2. **Database Scaling**: Consider MongoDB replication for high availability
3. **IPFS Cluster**: Set up an IPFS cluster for distributed storage
4. **CDN Integration**: Use a CDN for static assets and IPFS gateway access

## Troubleshooting

Common issues and solutions:

1. **IPFS Connection Issues**:
   - Check if the IPFS daemon is running: `curl http://100.123.165.22:5001/api/v0/version`
   - Verify network connectivity to the IPFS node

2. **MongoDB Connection Issues**:
   - Verify MongoDB service is running
   - Check connection string in the `.env` file
   - Ensure network connectivity to MongoDB

3. **Smart Contract Interactions Failing**:
   - Check SKALE endpoint availability
   - Verify the private key has enough gas
   - Confirm contract address is correct

4. **API Errors**:
   - Check backend logs: `sudo journalctl -u xinetee-backend`
   - Verify environment variables are correctly set

## Contact Support

For additional assistance, contact the development team:
- Email: support@xinetee.com
- GitHub Issues: https://github.com/ashu-the-coder/modular_repo/issues
