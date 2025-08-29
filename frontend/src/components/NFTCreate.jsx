import { useState, useContext, useEffect } from 'react';
import { BlockchainContext } from '../App';
import { ethers } from 'ethers';
import * as ipfsService from '../services/ipfsService';
import * as blockchainService from '../services/blockchainService';
import XineteDecentralizedStorageABI from '../contracts/XineteDecentralizedStorage.json';

const NFTCreate = () => {
    const { isConnected, userAddress, connectWallet } = useContext(BlockchainContext);
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [metadata, setMetadata] = useState({
        name: '',
        description: '',
        externalUrl: '',
        backgroundColor: ''
    });
    const [attributes, setAttributes] = useState([
        { trait_type: '', value: '' }
    ]);
    const [step, setStep] = useState(1); // 1: Upload Image, 2: Fill Metadata, 3: Result
    const [contract, setContract] = useState(null);
    const [ipfsUploadProgress, setIpfsUploadProgress] = useState(0);

    // Initialize services
    useEffect(() => {
        const initializeServices = async () => {
            // Initialize IPFS service
            ipfsService.initializeIPFS({
                ipfsApiUrl: `http://${import.meta.env.VITE_IPFS_API_HOST}:${import.meta.env.VITE_IPFS_API_PORT}/api/v0`,
                ipfsGatewayUrl: import.meta.env.VITE_IPFS_GATEWAY
            });
            
            // Initialize blockchain service if wallet is connected
            if (isConnected) {
                await blockchainService.initializeBlockchain({
                    rpcUrl: import.meta.env.VITE_BLOCKCHAIN_RPC_URL,
                    contractAddr: import.meta.env.VITE_CONTRACT_ADDRESS
                });
                
                // Initialize contract
                if (window.ethereum) {
                    try {
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
                        const xineteContract = new ethers.Contract(
                            contractAddress,
                            XineteDecentralizedStorageABI.abi,
                            signer
                        );
                        setContract(xineteContract);
                    } catch (error) {
                        console.error("Failed to initialize contract:", error);
                    }
                }
            }
        };

        initializeServices();
    }, [isConnected]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setFilePreview(URL.createObjectURL(e.target.files[0]));
            setUploadResult(null);
        }
    };

    const handleUploadImage = async () => {
        if (!file) return;

        setUploading(true);
        setIpfsUploadProgress(0);
        
        try {
            // Use ipfsService to upload the file
            const result = await ipfsService.uploadFileToIPFS(file, (progress) => {
                setIpfsUploadProgress(progress);
            });
            
            if (result && result.cid) {
                setUploadResult({
                    cid: result.cid,
                    gateway_url: result.gateway
                });
                setStep(2);
            } else {
                throw new Error("IPFS upload failed");
            }
        } catch (error) {
            alert(`Error uploading: ${error.message}`);
            console.error(error);
        } finally {
            setUploading(false);
            setIpfsUploadProgress(0);
        }
    };
    
    const handleMetadataChange = (e) => {
        const { name, value } = e.target;
        setMetadata({
            ...metadata,
            [name]: value
        });
    };

    const handleAttributeChange = (index, field, value) => {
        const newAttributes = [...attributes];
        newAttributes[index][field] = value;
        setAttributes(newAttributes);
    };

    const addAttribute = () => {
        setAttributes([...attributes, { trait_type: '', value: '' }]);
    };

    const removeAttribute = (index) => {
        const newAttributes = [...attributes];
        newAttributes.splice(index, 1);
        setAttributes(newAttributes);
    };

    const handleCreateMetadata = async () => {
        if (!uploadResult || !uploadResult.cid) {
            alert('Please upload an image first');
            return;
        }

        if (!isConnected || !contract) {
            alert('Please connect your wallet');
            return;
        }

        setUploading(true);
        try {
            // Filter out empty attributes
            const validAttributes = attributes.filter(
                attr => attr.trait_type.trim() !== '' && attr.value.toString().trim() !== ''
            );
            
            // Create metadata JSON
            const metadataJson = {
                name: metadata.name,
                description: metadata.description,
                image: `ipfs://${uploadResult.cid}`,
                external_url: metadata.externalUrl || null,
                background_color: metadata.backgroundColor ? metadata.backgroundColor.replace('#', '') : null,
                attributes: validAttributes
            };
            
            // Upload metadata directly to IPFS using the service
            const metadataResult = await ipfsService.uploadJSONToIPFS(metadataJson);
            
            if (!metadataResult || !metadataResult.cid) {
                throw new Error("Failed to upload metadata to IPFS");
            }
            
            // Create hash for blockchain storage
            const metadataCid = metadataResult.cid;
            const metadataHash = await ipfsService.generateSHA256Hash(metadataCid);
            
            // Store hash on blockchain directly
            const tx = await contract.storeCID(metadataCid, metadataHash);
            await tx.wait();
            
            setUploadResult({
                ...uploadResult,
                metadata: {
                    metadata_cid: metadataResult.cid,
                    ipfs_url: `ipfs://${metadataResult.cid}`,
                    gateway_url: metadataResult.gateway,
                    transaction_hash: tx.hash
                }
            });
            
            setStep(3);
        } catch (error) {
            alert(`Error creating metadata: ${error.message}`);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };
    
    // Upload JSON directly to IPFS
    const uploadJsonToIPFSDirectly = async (jsonData) => {
        try {
            const ipfsUrl = `http://${import.meta.env.VITE_IPFS_API_HOST}:${import.meta.env.VITE_IPFS_API_PORT}/api/v0/add`;
            
            // Convert JSON to a Blob
            const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
            const formData = new FormData();
            formData.append('file', jsonBlob, 'metadata.json');
            
            const response = await fetch(ipfsUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`IPFS JSON upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            return {
                success: true,
                cid: result.Hash
            };
        } catch (error) {
            console.error("Direct IPFS JSON upload error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Create SHA256 hash
    const createSHA256Hash = async (text) => {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    const resetForm = () => {
        setFile(null);
        setFilePreview(null);
        setUploadResult(null);
        setMetadata({
            name: '',
            description: '',
            externalUrl: '',
            backgroundColor: ''
        });
        setAttributes([{ trait_type: '', value: '' }]);
        setStep(1);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Create NFT Metadata</h2>
            
            {/* Wallet Connection Status */}
            <div className="mb-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-md font-medium text-blue-800 dark:text-blue-200">Decentralized NFT Creation</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                            Direct interaction with IPFS and blockchain
                        </p>
                    </div>
                    
                    {isConnected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                            </svg>
                            Wallet Connected
                        </span>
                    ) : (
                        <button 
                            onClick={connectWallet}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
                
                {!isConnected && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        ⚠️ Connect your wallet to create NFTs
                    </p>
                )}
            </div>
            
            {step === 1 && (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {filePreview ? (
                            <div>
                                <img src={filePreview} alt="Preview" className="max-h-64 mx-auto mb-4" />
                                <button 
                                    onClick={() => {
                                        setFile(null);
                                        setFilePreview(null);
                                    }}
                                    className="text-red-500 hover:text-red-700 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div>
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-1 text-sm text-gray-500">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            className={`mt-4 ${filePreview ? 'hidden' : 'block'} w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                        />
                    </div>
                    
                    {ipfsUploadProgress > 0 && ipfsUploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${ipfsUploadProgress}%` }}></div>
                            <p className="text-xs text-gray-500 mt-1">Uploading to IPFS: {ipfsUploadProgress}%</p>
                        </div>
                    )}
                    
                    <button
                        onClick={handleUploadImage}
                        disabled={!file || uploading}
                        className={`w-full py-2 px-4 rounded ${!file || uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                        {uploading ? 'Uploading...' : 'Upload to IPFS'}
                    </button>
                </div>
            )}
            
            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                        <img src={filePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">Image Uploaded Successfully</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                                IPFS CID: {uploadResult?.cid}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={metadata.name}
                                onChange={handleMetadataChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={metadata.description}
                                onChange={handleMetadataChange}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                External URL
                            </label>
                            <input
                                type="url"
                                name="externalUrl"
                                value={metadata.externalUrl}
                                onChange={handleMetadataChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Background Color
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    name="backgroundColor"
                                    value={metadata.backgroundColor || '#ffffff'}
                                    onChange={handleMetadataChange}
                                    className="h-8 w-8 rounded border-gray-300"
                                />
                                <input
                                    type="text"
                                    name="backgroundColor"
                                    value={metadata.backgroundColor}
                                    onChange={handleMetadataChange}
                                    placeholder="#FFFFFF"
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Attributes
                                </label>
                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            
                            {attributes.map((attr, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Trait Type"
                                        value={attr.trait_type}
                                        onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        value={attr.value}
                                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    {attributes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAttribute(index)}
                                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateMetadata}
                            disabled={!metadata.name || !metadata.description || uploading}
                            className={`flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white ${!metadata.name || !metadata.description || uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {uploading ? 'Creating...' : 'Create NFT Metadata'}
                        </button>
                    </div>
                </div>
            )}
            
            {step === 3 && uploadResult && uploadResult.metadata && (
                <div className="space-y-6">
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">NFT Metadata Created Successfully</h3>
                                {useDirectBlockchain && (
                                    <p className="text-xs text-green-700 mt-1">
                                        ✅ Created in fully decentralized mode with direct blockchain interaction
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex mb-4">
                            <img 
                                src={`${import.meta.env.VITE_IPFS_GATEWAY}/${uploadResult.pinata_cid}`} 
                                alt="NFT" 
                                className="w-24 h-24 object-cover rounded mr-4" 
                            />
                            <div>
                                <h3 className="font-bold text-lg">{metadata.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{metadata.description}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Metadata CID:</span>
                                <p className="text-sm break-all">{uploadResult.metadata.metadata_cid}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">IPFS URI:</span>
                                <p className="text-sm break-all">{uploadResult.metadata.ipfs_url}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gateway URL:</span>
                                <a 
                                    href={uploadResult.metadata.gateway_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                >
                                    {uploadResult.metadata.gateway_url}
                                </a>
                            </div>
                            {uploadResult.metadata.transaction_hash && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash:</span>
                                    <p className="text-sm break-all">{uploadResult.metadata.transaction_hash}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Create Another NFT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NFTCreate;