#!/usr/bin/env node

/**
 * Xinetee Deployment Setup Script
 * 
 * This script helps set up the project for deployment by:
 * 1. Creating necessary .env files from templates
 * 2. Setting up the deployment directory structure
 * 3. Checking for required dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const rootDir = path.resolve(__dirname);
const frontendDir = path.join(rootDir, 'frontend');
const deploymentsDir = path.join(rootDir, 'deployments');

// Check node version
const nodeVersion = process.version;
console.log(`Node version: ${nodeVersion}`);
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

if (majorVersion < 16) {
  console.error('❌ Node.js version 16 or higher is required.');
  process.exit(1);
}

// Create deployments directory
if (!fs.existsSync(deploymentsDir)) {
  console.log('Creating deployments directory...');
  fs.mkdirSync(deploymentsDir);
}

// Check for .env files and create if they don't exist
const createEnvFile = (templatePath, targetPath, overwrite = false) => {
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file ${templatePath} not found!`);
    return false;
  }

  if (fs.existsSync(targetPath) && !overwrite) {
    console.log(`ℹ️ ${targetPath} already exists. Skipping.`);
    return true;
  }

  try {
    const content = fs.readFileSync(templatePath, 'utf-8');
    fs.writeFileSync(targetPath, content);
    console.log(`✅ Created ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create ${targetPath}: ${error.message}`);
    return false;
  }
};

// Function to check if required dependencies are installed
const checkDependencies = () => {
  console.log('Checking dependencies...');
  
  try {
    console.log('Checking for Hardhat...');
    execSync('npx hardhat --version', { stdio: 'ignore' });
    console.log('✅ Hardhat is installed');
  } catch (error) {
    console.log('❌ Hardhat is not installed. Installing...');
    try {
      execSync('npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox', { stdio: 'inherit' });
      console.log('✅ Hardhat installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install Hardhat:', installError.message);
    }
  }
  
  try {
    console.log('Checking for dotenv...');
    execSync('npm list dotenv', { stdio: 'ignore' });
    console.log('✅ dotenv is installed');
  } catch (error) {
    console.log('❌ dotenv is not installed. Installing...');
    try {
      execSync('npm install dotenv', { stdio: 'inherit' });
      console.log('✅ dotenv installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install dotenv:', installError.message);
    }
  }
};

// Main setup function
const setupDeployment = async () => {
  console.log('🚀 Setting up Xinetee for deployment...');
  
  // Check dependencies
  checkDependencies();
  
  // Create .env files
  createEnvFile(
    path.join(rootDir, '.env.example'),
    path.join(rootDir, '.env')
  );
  
  createEnvFile(
    path.join(frontendDir, '.env'),
    path.join(frontendDir, '.env.production')
  );
  
  console.log('\n📝 Please edit the following files with your production settings:');
  console.log(`- ${path.join(rootDir, '.env')}`);
  console.log(`- ${path.join(frontendDir, '.env.production')}`);
  
  console.log('\n✅ Setup complete! Next steps:');
  console.log('1. Edit the .env files with your production settings');
  console.log('2. Deploy your smart contract with: npx hardhat run scripts/deploy.js --network skale');
  console.log('3. Update your frontend .env.production with the deployed contract address');
  console.log('4. Build your frontend with: cd frontend && npm run build');
  console.log('5. Deploy the frontend to your hosting service');
  
  rl.close();
};

setupDeployment().catch(error => {
  console.error('Error during setup:', error);
  process.exit(1);
});
