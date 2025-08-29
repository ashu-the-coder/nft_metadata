# IPFS Pinning System

The Xinetee platform includes an automatic IPFS pinning system to ensure all content remains available on the IPFS network. This system works in the following ways:

## Automatic Pinning During Upload

When files or metadata are uploaded to IPFS, they are automatically pinned to ensure persistence:

- All NFT image files are pinned during upload
- All NFT metadata JSON is pinned during upload
- The system uses both the IPFS HTTP client's built-in pinning and an explicit pin request to maximize reliability

## Automatic Pinning During Retrieval

The system also implements "opportunistic pinning" when content is viewed:

- When an NFT is loaded in the collection view, both its metadata and image are automatically checked for pin status
- If either the metadata or image is not pinned, the system will automatically pin it
- This ensures that even content created before the pinning feature was implemented will be preserved

## Manual Pinning

For maximum control, manual pinning is also available:

- Users can explicitly pin any NFT from the collection view
- A visual indicator shows whether an NFT is currently pinned
- If content is not pinned, a "Pin to IPFS" button appears

## Technical Implementation

The pinning functionality is implemented in the `ipfsService.js` file with the following key functions:

- `uploadFileToIPFS(file)`: Uploads and pins files to IPFS
- `uploadJSONToIPFS(jsonData)`: Uploads and pins JSON metadata to IPFS
- `pinContent(cid)`: Pins existing content by CID
- `isPinned(cid)`: Checks if content is already pinned

## Best Practices for IPFS Pinning

For optimal performance and reliability:

1. **Run a Local IPFS Node**: Configure the application to use a local IPFS node running as a daemon
2. **Ensure Sufficient Storage**: IPFS nodes need sufficient storage for pinned content
3. **Consider Multiple Pinning Solutions**: For critical data, use multiple pinning services
4. **Monitor Pin Status**: Regularly check that important content remains pinned

## Environment Configuration

Configure the IPFS node connection in your `.env` file:

```
VITE_IPFS_API_HOST=localhost
VITE_IPFS_API_PORT=5001
VITE_IPFS_GATEWAY=http://localhost:8080/ipfs
```

For production environments, consider using a dedicated IPFS node with sufficient resources to maintain pins reliably.
