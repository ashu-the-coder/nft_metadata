/**
 * Direct blockchain interaction service
 * This service provides direct interaction with the blockchain without server mediation
 */
import { ethers } from 'ethers';
import XineteDecentralizedStorageABI from '../contracts/XineteDecentralizedStorage.json';

let provider;
let contract;
let signer;
let contractAddress;

/**
 * Initialize the blockchain service
 * @param {Object} config - Configuration object
 * @returns {Boolean} - Success state
 */
export const initializeBlockchain = async (config = {}) => {
  try {
    const { 
      rpcUrl = import.meta.env.VITE_BLOCKCHAIN_RPC_URL,
      contractAddr = import.meta.env.VITE_CONTRACT_ADDRESS
    } = config;
    
    if (!rpcUrl || !contractAddr) {
      console.error('Missing RPC URL or contract address. Check your environment configuration.');
      return false;
    }
    
    contractAddress = contractAddr;
    
    // Check if window.ethereum is available (MetaMask or other injected provider)
    if (window.ethereum) {
      // Use the injected provider
      provider = new ethers.BrowserProvider(window.ethereum);
      
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get the signer
        signer = await provider.getSigner();
        
        // Create contract instance
        contract = new ethers.Contract(
          contractAddress,
          XineteDecentralizedStorageABI.abi,
          signer
        );
        
        console.log('Blockchain service initialized with injected provider');
        return true;
      } catch (error) {
        console.warn('User denied account access or other error:', error);
        // Fall back to read-only provider
        provider = new ethers.JsonRpcProvider(rpcUrl);
        contract = new ethers.Contract(
          contractAddress,
          XineteDecentralizedStorageABI.abi,
          provider
        );
        console.log('Blockchain service initialized in read-only mode');
        return true;
      }
    } else {
      // No injected provider, use RPC URL
      provider = new ethers.JsonRpcProvider(rpcUrl);
      contract = new ethers.Contract(
        contractAddress,
        XineteDecentralizedStorageABI.abi,
        provider
      );
      console.log('Blockchain service initialized with RPC provider');
      return true;
    }
  } catch (error) {
    console.error('Failed to initialize blockchain service:', error);
    return false;
  }
};

/**
 * Get the current connected account
 * @returns {Promise<string>} - The connected account address
 */
export const getConnectedAccount = async () => {
  try {
    if (!provider) {
      throw new Error('Blockchain service not initialized');
    }
    
    if (signer) {
      return await signer.getAddress();
    } else {
      throw new Error('No signer available');
    }
  } catch (error) {
    console.error('Error getting connected account:', error);
    throw error;
  }
};

/**
 * Connect to wallet (request accounts)
 * @returns {Promise<string>} - The connected account address
 */
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
    }
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Reinitialize with signer
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(
      contractAddress,
      XineteDecentralizedStorageABI.abi,
      signer
    );
    
    return await signer.getAddress();
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

/**
 * Store metadata on the blockchain
 * @param {Object} params - Parameters for storing metadata
 * @returns {Promise<Object>} - Transaction receipt
 */
export const storeMetadata = async ({ cid, hash, nftName, imageURI }) => {
  try {
    if (!contract || !signer) {
      throw new Error('Blockchain service not initialized with signer');
    }
    
    // Call the contract method
    const tx = await contract.storeMetadata(cid, hash, nftName, imageURI);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      events: receipt.logs.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      }).filter(Boolean)
    };
  } catch (error) {
    console.error('Error storing metadata on blockchain:', error);
    throw error;
  }
};

/**
 * Update metadata on the blockchain
 * @param {Object} params - Parameters for updating metadata
 * @returns {Promise<Object>} - Transaction receipt
 */
export const updateMetadata = async ({ oldCid, newCid, hash, nftName, imageURI }) => {
  try {
    if (!contract || !signer) {
      throw new Error('Blockchain service not initialized with signer');
    }
    
    // Call the contract method
    const tx = await contract.updateMetadata(oldCid, newCid, hash, nftName, imageURI);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      events: receipt.logs.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      }).filter(Boolean)
    };
  } catch (error) {
    console.error('Error updating metadata on blockchain:', error);
    throw error;
  }
};

/**
 * Remove metadata from the blockchain
 * @param {string} cid - The CID to remove
 * @returns {Promise<Object>} - Transaction receipt
 */
export const removeMetadata = async (cid) => {
  try {
    if (!contract || !signer) {
      throw new Error('Blockchain service not initialized with signer');
    }
    
    // Call the contract method
    const tx = await contract.removeMetadata(cid);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      events: receipt.logs.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      }).filter(Boolean)
    };
  } catch (error) {
    console.error('Error removing metadata from blockchain:', error);
    throw error;
  }
};

/**
 * Get CID by hash
 * @param {string} hash - The hash to look up
 * @returns {Promise<string>} - The corresponding CID
 */
export const getCIDByHash = async (hash) => {
  try {
    if (!contract) {
      throw new Error('Blockchain service not initialized');
    }
    
    return await contract.getCIDByHash(hash);
  } catch (error) {
    console.error('Error getting CID by hash:', error);
    throw error;
  }
};

/**
 * Get all metadata CIDs for the current user
 * @returns {Promise<Array<string>>} - Array of CIDs
 */
export const getUserMetadataCIDs = async () => {
  try {
    if (!contract) {
      throw new Error('Blockchain service not initialized');
    }
    
    const address = signer ? await signer.getAddress() : '';
    if (!address) {
      throw new Error('No account connected');
    }
    
    return await contract.getUserMetadataCIDs(address);
  } catch (error) {
    console.error('Error getting user metadata CIDs:', error);
    throw error;
  }
};

/**
 * Get metadata owner
 * @param {string} cid - The CID to check
 * @returns {Promise<string>} - Owner address
 */
export const getMetadataOwner = async (cid) => {
  try {
    if (!contract) {
      throw new Error('Blockchain service not initialized');
    }
    
    return await contract.getMetadataOwner(cid);
  } catch (error) {
    console.error('Error getting metadata owner:', error);
    throw error;
  }
};

/**
 * Get detailed metadata info
 * @param {string} cid - The CID to get info for
 * @returns {Promise<Object>} - Metadata info
 */
export const getMetadataInfo = async (cid) => {
  try {
    if (!contract) {
      throw new Error('Blockchain service not initialized');
    }
    
    const info = await contract.getMetadataInfo(cid);
    
    // Format the returned data
    return {
      cid: info.cid,
      hash: info.hash,
      timestamp: Number(info.timestamp),
      nftName: info.nftName,
      imageURI: info.imageURI
    };
  } catch (error) {
    console.error('Error getting metadata info:', error);
    throw error;
  }
};

/**
 * Verify metadata
 * @param {string} cid - The CID to verify
 * @param {string} hash - The hash to verify
 * @returns {Promise<boolean>} - Verification result
 */
export const verifyMetadata = async (cid, hash) => {
  try {
    if (!contract) {
      throw new Error('Blockchain service not initialized');
    }
    
    return await contract.verifyMetadata(cid, hash);
  } catch (error) {
    console.error('Error verifying metadata:', error);
    throw error;
  }
};

export default {
  initializeBlockchain,
  getConnectedAccount,
  connectWallet,
  storeMetadata,
  updateMetadata,
  removeMetadata,
  getCIDByHash,
  getUserMetadataCIDs,
  getMetadataOwner,
  getMetadataInfo,
  verifyMetadata
};
