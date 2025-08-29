import { useState, useEffect, useContext } from 'react';
import { BlockchainContext } from '../App';
import { ethers } from 'ethers';
import * as ipfsService from '../services/ipfsService';
import * as blockchainService from '../services/blockchainService';
import XineteDecentralizedStorageABI from '../contracts/XineteDecentralizedStorage.json';

const NFTCollection = () => {
    const { isConnected, userAddress, connectWallet } = useContext(BlockchainContext);
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contract, setContract] = useState(null);
    const [verifying, setVerifying] = useState(false);

    // Initialize IPFS and blockchain connections
    useEffect(() => {
        const initServices = async () => {
            // Initialize IPFS
            ipfsService.initializeIPFS({
                ipfsApiUrl: `http://${import.meta.env.VITE_IPFS_API_HOST}:${import.meta.env.VITE_IPFS_API_PORT}/api/v0`,
                ipfsGatewayUrl: import.meta.env.VITE_IPFS_GATEWAY
            });
            
            // Initialize blockchain service
            await blockchainService.initializeBlockchain({
                rpcUrl: import.meta.env.VITE_BLOCKCHAIN_RPC_URL,
                contractAddr: import.meta.env.VITE_CONTRACT_ADDRESS
            });
            
            // Initialize contract if wallet is connected
            if (isConnected && window.ethereum) {
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
        };

        initServices();
    }, [isConnected]);

    // Fetch NFTs when wallet connects or contract initializes
    useEffect(() => {
        const fetchNFTs = async () => {
            if (!isConnected) {
                setNfts([]);
                setLoading(false);
                return;
            }
            
            if (!contract || !userAddress) {
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                
                // Get NFTs directly from the blockchain
                await fetchNFTsFromBlockchain();
            } catch (err) {
                console.error('Error fetching NFTs:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchNFTs();
    }, [isConnected, contract, userAddress]);
    
    // Fetch NFTs directly from blockchain
    const fetchNFTsFromBlockchain = async () => {
        try {
            // Get all CIDs for the current user using the blockchain service
            const cids = await contract.getCIDs(userAddress);
            
            if (!cids || cids.length === 0) {
                setNfts([]);
                return;
            }
            
            // For each CID, get the metadata from IPFS
            const nftPromises = cids.map(async (cid) => {
                try {
                    // Fetch metadata from IPFS using our service
                    const metadata = await ipfsService.fetchFromIPFS(cid);
                    
                    // Extract image CID from ipfs:// URI
                    const imageCid = typeof metadata.image === 'string' 
                        ? metadata.image.replace('ipfs://', '') 
                        : '';
                    
                    // Ensure both metadata and image are pinned for persistence
                    try {
                        const metadataPinned = await ipfsService.isPinned(cid);
                        if (!metadataPinned) {
                            console.log(`Pinning metadata with CID ${cid}...`);
                            await ipfsService.pinContent(cid);
                        }
                        
                        if (imageCid) {
                            const imagePinned = await ipfsService.isPinned(imageCid);
                            if (!imagePinned) {
                                console.log(`Pinning image with CID ${imageCid}...`);
                                await ipfsService.pinContent(imageCid);
                            }
                        }
                    } catch (pinError) {
                        console.warn("Could not pin content:", pinError);
                        // Continue even if pinning fails
                    }
                    
                    return {
                        user: userAddress,
                        name: metadata.name,
                        description: metadata.description,
                        image_cid: imageCid,
                        metadata_cid: cid,
                        created_at: new Date().toISOString(),
                        ipfs_gateway_url: `${import.meta.env.VITE_IPFS_GATEWAY}/${cid}`,
                        metadata: metadata,
                        pinned: true
                    };
                } catch (error) {
                    console.error(`Error fetching metadata for CID ${cid}:`, error);
                    return null;
                }
            });
            
            const nftResults = await Promise.all(nftPromises);
            const validNfts = nftResults.filter(nft => nft !== null);
            
            setNfts(validNfts);
        } catch (error) {
            console.error("Error fetching NFTs from blockchain:", error);
            throw error;
        }
    };

    const handleVerifyNFT = async (metadataCid) => {
        try {
            setVerifying(true);
            
            // Create hash for verification using our service
            const metadataHash = await ipfsService.generateSHA256Hash(metadataCid);
            
            // Verify directly against the blockchain
            const storedCid = await contract.getCIDByHash(metadataHash);
            
            if (storedCid === metadataCid) {
                alert('NFT verified on blockchain! ✅');
            } else {
                alert('Verification failed: CID mismatch');
            }
        } catch (err) {
            alert(`Error during verification: ${err.message}`);
        } finally {
            setVerifying(false);
        }
    };
    
    // Remove the createSHA256Hash function as we're using the ipfsService.generateSHA256Hash

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading NFTs</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (nfts.length === 0) {
        return (
            <div className="text-center py-10">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No NFTs found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first NFT.</p>
                <div className="mt-6">
                    <a
                        href="/nft/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create NFT
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your NFT Collection</h2>
                <div className="flex items-center space-x-4">
                    <a
                        href="/nft/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create NFT
                    </a>
                </div>
            </div>
            
            {!isConnected && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Please connect your wallet to view your NFTs.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nfts.map((nft) => (
                    <div key={nft.metadata_cid} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200">
                            <img
                                src={`${import.meta.env.VITE_IPFS_GATEWAY}/${nft.image_cid}`}
                                alt={nft.metadata.name}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available';
                                }}
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{nft.metadata.name}</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{nft.metadata.description}</p>
                            
                            {nft.metadata.attributes && nft.metadata.attributes.length > 0 && (
                                <div className="mt-3">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Attributes</h4>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {nft.metadata.attributes.map((attr, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                            >
                                                {attr.trait_type}: {attr.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-4 flex flex-col space-y-2">
                                <a
                                    href={nft.ipfs_gateway_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    View on IPFS
                                </a>
                                <button
                                    onClick={() => handleVerifyNFT(nft.metadata_cid)}
                                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                >
                                    Verify on Blockchain
                                </button>
                                {nft.pinned && (
                                    <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Pinned on IPFS
                                    </div>
                                )}
                                {!nft.pinned && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                // Pin both metadata and image
                                                await ipfsService.pinContent(nft.metadata_cid);
                                                if (nft.image_cid) {
                                                    await ipfsService.pinContent(nft.image_cid);
                                                }
                                                
                                                // Update NFTs array to show pinned status
                                                setNfts(prevNfts => 
                                                    prevNfts.map(item => 
                                                        item.metadata_cid === nft.metadata_cid 
                                                            ? { ...item, pinned: true } 
                                                            : item
                                                    )
                                                );
                                                
                                                alert('Content successfully pinned to IPFS!');
                                            } catch (error) {
                                                console.error('Error pinning content:', error);
                                                alert(`Failed to pin content: ${error.message}`);
                                            }
                                        }}
                                        className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2a6 6 0 110 12 6 6 0 010-12z" />
                                        </svg>
                                        Pin to IPFS
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NFTCollection;
