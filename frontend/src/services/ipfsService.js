/**
 * Direct IPFS interaction service
 * This service provides direct interaction with IPFS nodes without relying on centralized pinning services
 */
import { create } from 'ipfs-http-client';

// Create an IPFS client instance - this will be configured from environment
let ipfs;
let ipfsGateway;

/**
 * Initialize IPFS client with the provided configuration
 * @param {Object} config - Configuration object with IPFS node details
 */
export const initializeIPFS = (config = {}) => {
  const { 
    ipfsApiUrl = `http://${import.meta.env.VITE_IPFS_API_HOST || 'localhost'}:${import.meta.env.VITE_IPFS_API_PORT || '5001'}/api/v0`,
    ipfsGatewayUrl = import.meta.env.VITE_IPFS_GATEWAY || 'http://localhost:8080/ipfs'
  } = config;
  
  try {
    // Create an IPFS client connected to the specified API URL
    ipfs = create({ url: ipfsApiUrl });
    ipfsGateway = ipfsGatewayUrl;
    console.log('IPFS client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize IPFS client:', error);
    
    // Set gateway anyway so content can still be viewed even if uploads fail
    ipfsGateway = ipfsGatewayUrl;
    
    // In production, provide a more user-friendly error
    if (import.meta.env.PROD) {
      console.warn('Falling back to view-only mode with public gateway');
    }
    
    return false;
  }
};

/**
 * Upload a file to IPFS and pin it automatically
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} - The IPFS response with CID
 */
export const uploadFileToIPFS = async (file, onProgress = null) => {
  if (!ipfs) {
    if (import.meta.env.PROD) {
      throw new Error('IPFS client not initialized. For production environments, ensure you have access to an IPFS node or try running your own node.');
    } else {
      throw new Error('IPFS client not initialized. Call initializeIPFS first.');
    }
  }
  
  try {
    // Read the file as a buffer
    const buffer = await file.arrayBuffer();
    
    // Add the file to IPFS
    const result = await ipfs.add(
      { path: file.name, content: new Uint8Array(buffer) },
      { 
        progress: onProgress ? (bytes) => onProgress(bytes / file.size * 100) : undefined,
        pin: true // Automatically pin the file to ensure it remains available
      }
    );
    
    // Explicitly pin the content to ensure it remains on the network
    try {
      await ipfs.pin.add(result.cid);
      console.log(`Successfully pinned file with CID: ${result.cid}`);
    } catch (pinError) {
      console.warn(`Warning: Could not explicitly pin the file: ${pinError.message}`);
      // Continue since the initial upload already requested pinning
    }
    
    // Return the result with the IPFS CID (Content Identifier)
    return {
      cid: result.cid.toString(),
      path: result.path,
      size: result.size,
      gateway: `${ipfsGateway}/${result.cid.toString()}`,
      pinned: true
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};

/**
 * Upload JSON data to IPFS and pin it automatically
 * @param {Object} jsonData - The JSON data to upload
 * @returns {Promise<Object>} - The IPFS response with CID
 */
export const uploadJSONToIPFS = async (jsonData) => {
  if (!ipfs) {
    throw new Error('IPFS client not initialized. Call initializeIPFS first.');
  }
  
  try {
    // Convert JSON to string
    const jsonString = JSON.stringify(jsonData);
    
    // Add the JSON to IPFS with automatic pinning
    const result = await ipfs.add(
      { path: 'metadata.json', content: jsonString },
      { pin: true } // Automatically pin the content
    );
    
    // Explicitly pin the content to ensure it remains on the network
    try {
      await ipfs.pin.add(result.cid);
      console.log(`Successfully pinned JSON metadata with CID: ${result.cid}`);
    } catch (pinError) {
      console.warn(`Warning: Could not explicitly pin the JSON metadata: ${pinError.message}`);
      // Continue since the initial upload already requested pinning
    }
    
    // Return the result with the IPFS CID
    return {
      cid: result.cid.toString(),
      path: result.path,
      size: result.size,
      gateway: `${ipfsGateway}/${result.cid.toString()}`,
      pinned: true
    };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw error;
  }
};

/**
 * Fetch content from IPFS by CID
 * @param {string} cid - The IPFS CID
 * @returns {Promise<Object>} - The fetched content
 */
export const fetchFromIPFS = async (cid) => {
  if (!ipfs) {
    throw new Error('IPFS client not initialized. Call initializeIPFS first.');
  }
  
  try {
    const chunks = [];
    
    // Get the content from IPFS
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    // Combine chunks into a single Uint8Array
    const content = new Uint8Array(
      chunks.reduce((acc, chunk) => [...acc, ...chunk], [])
    );
    
    // Try to parse as JSON, return as text if parsing fails
    try {
      const text = new TextDecoder().decode(content);
      return JSON.parse(text);
    } catch (e) {
      return new TextDecoder().decode(content);
    }
  } catch (error) {
    console.error(`Error fetching content with CID ${cid} from IPFS:`, error);
    throw error;
  }
};

/**
 * Pin content by CID to ensure it remains available on the IPFS network
 * @param {string} cid - The IPFS CID to pin
 * @returns {Promise<boolean>} - Success status
 */
export const pinContent = async (cid) => {
  if (!ipfs) {
    throw new Error('IPFS client not initialized. Call initializeIPFS first.');
  }
  
  try {
    await ipfs.pin.add(cid);
    console.log(`Successfully pinned content with CID: ${cid}`);
    return true;
  } catch (error) {
    console.error(`Error pinning content with CID ${cid}:`, error);
    return false;
  }
};

/**
 * Check if content is already pinned
 * @param {string} cid - The IPFS CID to check
 * @returns {Promise<boolean>} - Whether the content is pinned
 */
export const isPinned = async (cid) => {
  if (!ipfs) {
    throw new Error('IPFS client not initialized. Call initializeIPFS first.');
  }
  
  try {
    const pinnedItems = await ipfs.pin.ls({ paths: [cid] });
    for await (const item of pinnedItems) {
      if (item.cid.toString() === cid) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking pin status for CID ${cid}:`, error);
    return false;
  }
};

/**
 * Generate a SHA-256 hash of content
 * @param {string|Uint8Array} content - The content to hash
 * @returns {Promise<string>} - The SHA-256 hash
 */
export const generateSHA256Hash = async (content) => {
  try {
    // Convert string to ArrayBuffer if content is a string
    const contentBuffer = typeof content === 'string' 
      ? new TextEncoder().encode(content) 
      : content;
    
    // Generate the hash using the Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', contentBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error generating SHA-256 hash:', error);
    throw error;
  }
};

export default {
  initializeIPFS,
  uploadFileToIPFS,
  uploadJSONToIPFS,
  fetchFromIPFS,
  generateSHA256Hash,
  pinContent,
  isPinned
};
