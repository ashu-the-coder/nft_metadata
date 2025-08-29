#!/bin/bash

# Xinetee Platform Deployment Script
# This script sets up and starts all components of the Xinetee platform

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Xinetee Decentralized Storage Platform deployment...${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "${YELLOW}Checking for required tools...${NC}"

if ! command_exists node; then
  echo -e "${RED}Node.js is not installed. Please install Node.js (v14+).${NC}"
  exit 1
fi

if ! command_exists npm; then
  echo -e "${RED}npm is not installed. Please install npm.${NC}"
  exit 1
fi

if ! command_exists python3; then
  echo -e "${RED}Python3 is not installed. Please install Python 3.8+.${NC}"
  exit 1
fi

if ! command_exists pip3; then
  echo -e "${RED}pip3 is not installed. Please install pip3.${NC}"
  exit 1
fi

# Set up the backend
echo -e "${YELLOW}Setting up the backend...${NC}"

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! command_exists mongosh; then
  echo -e "${YELLOW}MongoDB shell not found. Assuming MongoDB is running as a separate service.${NC}"
else
  mongosh --eval "db.stats()" mongodb://admin:%40dminXinetee%40123@100.123.165.22:27017 > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo -e "${RED}Cannot connect to MongoDB. Please ensure MongoDB is running at 100.123.165.22:27017${NC}"
    echo -e "${YELLOW}Continuing anyway as MongoDB might be managed separately...${NC}"
  else
    echo -e "${GREEN}MongoDB connection successful.${NC}"
  fi
fi

# Check if IPFS is running
echo "Checking IPFS connection..."
curl -s http://100.123.165.22:5001/api/v0/version > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${RED}Cannot connect to IPFS. Please ensure IPFS is running at 100.123.165.22:5001${NC}"
  echo -e "${YELLOW}Continuing anyway as IPFS might be managed separately...${NC}"
else
  echo -e "${GREEN}IPFS connection successful.${NC}"
fi

# Ensure data directories exist
echo "Creating data directories..."
mkdir -p backend/user_data

# Build the frontend
echo -e "${YELLOW}Building the frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Deploy the contract if needed
echo -e "${YELLOW}Checking for deployed contract...${NC}"
if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "No deployed contract found in environment. You might need to deploy the contract separately."
  echo "Run 'npx hardhat run scripts/deploy.js --network skale' to deploy the contract."
else
  echo -e "${GREEN}Contract is already deployed at: $CONTRACT_ADDRESS${NC}"
fi

# Start the backend server
echo -e "${YELLOW}Starting the backend server...${NC}"
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}Backend server started with PID: $BACKEND_PID${NC}"

# Serve the frontend
echo -e "${YELLOW}Starting the frontend server...${NC}"
cd frontend
npm run preview -- --port 5173 --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}Frontend server started with PID: $FRONTEND_PID${NC}"

# Print the summary
echo -e "\n${GREEN}Xinetee Platform is now running!${NC}"
echo -e "Backend API: http://0.0.0.0:8000"
echo -e "Frontend: http://0.0.0.0:5173"
echo -e "IPFS Gateway: http://100.123.165.22:8080/ipfs/{CID}"
echo -e "IPFS API: http://100.123.165.22:5001/api/v0"
echo -e "\nUse Ctrl+C to stop all services"

# Trap SIGINT to clean up processes
trap 'kill $BACKEND_PID $FRONTEND_PID; echo -e "\n${RED}Stopping all services...${NC}"; exit' INT

# Wait for processes to finish
wait
