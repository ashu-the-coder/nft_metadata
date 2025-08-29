// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title XineteDecentralizedStorage
 * @dev Fully decentralized storage contract for NFT metadata on IPFS
 */
contract XineteDecentralizedStorage {
    // Struct to hold metadata information
    struct MetadataInfo {
        string cid;
        string hash;
        uint256 timestamp;
        string nftName;
        string imageURI;
    }
    
    // Mapping from user address to array of their metadata CIDs
    mapping(address => string[]) private userMetadataCIDs;
    
    // Mapping from hash to CID
    mapping(string => string) private hashToCID;
    
    // Mapping from CID to owner
    mapping(string => address) private cidToOwner;
    
    // Mapping from CID to extended metadata info
    mapping(string => MetadataInfo) private cidToMetadataInfo;
    
    // Events
    event MetadataStored(address indexed creator, string cid, string hash, string nftName, uint256 timestamp);
    event MetadataUpdated(address indexed creator, string oldCid, string newCid, string hash);
    event MetadataRemoved(address indexed creator, string cid);
    
    /**
     * @dev Store NFT metadata information
     * @param _cid The IPFS CID of the metadata
     * @param _hash The SHA-256 hash of the metadata CID
     * @param _nftName The name of the NFT
     * @param _imageURI The IPFS URI of the NFT image
     */
    function storeMetadata(string memory _cid, string memory _hash, string memory _nftName, string memory _imageURI) public {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        require(bytes(_hash).length > 0, "Hash cannot be empty");
        require(cidToOwner[_cid] == address(0), "CID already registered");
        require(bytes(hashToCID[_hash]).length == 0, "Hash already exists");
        
        // Store metadata
        userMetadataCIDs[msg.sender].push(_cid);
        hashToCID[_hash] = _cid;
        cidToOwner[_cid] = msg.sender;
        
        // Store extended metadata info
        cidToMetadataInfo[_cid] = MetadataInfo({
            cid: _cid,
            hash: _hash,
            timestamp: block.timestamp,
            nftName: _nftName,
            imageURI: _imageURI
        });
        
        emit MetadataStored(msg.sender, _cid, _hash, _nftName, block.timestamp);
    }
    
    /**
     * @dev Update NFT metadata with a new CID
     * @param _oldCid The old IPFS CID
     * @param _newCid The new IPFS CID
     * @param _hash The new SHA-256 hash
     * @param _nftName The updated name of the NFT
     * @param _imageURI The updated IPFS URI of the NFT image
     */
    function updateMetadata(string memory _oldCid, string memory _newCid, string memory _hash, string memory _nftName, string memory _imageURI) public {
        require(cidToOwner[_oldCid] == msg.sender, "Not the owner of this metadata");
        require(bytes(_newCid).length > 0, "New CID cannot be empty");
        require(bytes(_hash).length > 0, "Hash cannot be empty");
        require(cidToOwner[_newCid] == address(0), "New CID already registered");
        require(bytes(hashToCID[_hash]).length == 0, "New hash already exists");
        
        // Replace the old CID with the new one in the user's array
        string[] storage userCIDs = userMetadataCIDs[msg.sender];
        for (uint i = 0; i < userCIDs.length; i++) {
            if (keccak256(bytes(userCIDs[i])) == keccak256(bytes(_oldCid))) {
                userCIDs[i] = _newCid;
                break;
            }
        }
        
        // Remove old hash mapping
        string memory oldHash = cidToMetadataInfo[_oldCid].hash;
        delete hashToCID[oldHash];
        
        // Update metadata ownership
        delete cidToOwner[_oldCid];
        cidToOwner[_newCid] = msg.sender;
        
        // Update hash to CID mapping
        hashToCID[_hash] = _newCid;
        
        // Update extended metadata info
        delete cidToMetadataInfo[_oldCid];
        cidToMetadataInfo[_newCid] = MetadataInfo({
            cid: _newCid,
            hash: _hash,
            timestamp: block.timestamp,
            nftName: _nftName,
            imageURI: _imageURI
        });
        
        emit MetadataUpdated(msg.sender, _oldCid, _newCid, _hash);
    }
    
    /**
     * @dev Remove metadata
     * @param _cid The IPFS CID to remove
     */
    function removeMetadata(string memory _cid) public {
        require(cidToOwner[_cid] == msg.sender, "Not the owner of this metadata");
        
        // Remove the CID from the user's array
        string[] storage userCIDs = userMetadataCIDs[msg.sender];
        for (uint i = 0; i < userCIDs.length; i++) {
            if (keccak256(bytes(userCIDs[i])) == keccak256(bytes(_cid))) {
                // Move the last element to the position of the element to delete
                userCIDs[i] = userCIDs[userCIDs.length - 1];
                // Remove the last element
                userCIDs.pop();
                break;
            }
        }
        
        // Remove hash mapping
        string memory hash = cidToMetadataInfo[_cid].hash;
        delete hashToCID[hash];
        
        // Remove ownership and metadata info
        delete cidToOwner[_cid];
        delete cidToMetadataInfo[_cid];
        
        emit MetadataRemoved(msg.sender, _cid);
    }
    
    /**
     * @dev Get CID by its hash
     * @param _hash The SHA-256 hash
     * @return The IPFS CID
     */
    function getCIDByHash(string memory _hash) public view returns (string memory) {
        return hashToCID[_hash];
    }
    
    /**
     * @dev Get all metadata CIDs for a specific user
     * @param _user The user address
     * @return Array of IPFS CIDs
     */
    function getUserMetadataCIDs(address _user) public view returns (string[] memory) {
        return userMetadataCIDs[_user];
    }
    
    /**
     * @dev Get owner of a specific metadata CID
     * @param _cid The IPFS CID
     * @return The owner address
     */
    function getMetadataOwner(string memory _cid) public view returns (address) {
        return cidToOwner[_cid];
    }
    
    /**
     * @dev Get detailed metadata info
     * @param _cid The IPFS CID
     * @return Metadata information structure
     */
    function getMetadataInfo(string memory _cid) public view returns (MetadataInfo memory) {
        require(cidToOwner[_cid] != address(0), "Metadata does not exist");
        return cidToMetadataInfo[_cid];
    }
    
    /**
     * @dev Verify if a CID exists on the blockchain
     * @param _cid The IPFS CID to verify
     * @param _hash The SHA-256 hash to verify
     * @return True if the CID exists and matches the hash
     */
    function verifyMetadata(string memory _cid, string memory _hash) public view returns (bool) {
        return (cidToOwner[_cid] != address(0) && 
                keccak256(bytes(hashToCID[_hash])) == keccak256(bytes(_cid)));
    }
}
