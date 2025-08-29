import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import NFTCreate from './components/NFTCreate';
import NFTCollection from './components/NFTCollection';
import { ThemeProvider } from './contexts/ThemeContext';

// Create Blockchain Context
export const BlockchainContext = createContext(null);

function App() {
  const [isConnected, setIsConnected] = useState(localStorage.getItem('walletConnected') === 'true');
  const [userAddress, setUserAddress] = useState(localStorage.getItem('userAddress'));

  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const isConnected = accounts.length > 0;
          setIsConnected(isConnected);
          localStorage.setItem('walletConnected', isConnected);
          
          if (isConnected && accounts[0]) {
            setUserAddress(accounts[0]);
            localStorage.setItem('userAddress', accounts[0]);
          } else {
            setUserAddress(null);
            localStorage.removeItem('userAddress');
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setIsConnected(false);
        setUserAddress(null);
        localStorage.setItem('walletConnected', 'false');
        localStorage.removeItem('userAddress');
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        const isConnected = accounts.length > 0;
        setIsConnected(isConnected);
        localStorage.setItem('walletConnected', isConnected);
        
        if (isConnected && accounts[0]) {
          setUserAddress(accounts[0]);
          localStorage.setItem('userAddress', accounts[0]);
        } else {
          setUserAddress(null);
          localStorage.removeItem('userAddress');
        }
      });

      window.ethereum.on('disconnect', () => {
        setIsConnected(false);
        setUserAddress(null);
        localStorage.setItem('walletConnected', 'false');
        localStorage.removeItem('userAddress');
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setUserAddress(accounts[0]);
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('userAddress', accounts[0]);
          return true;
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask or another Ethereum wallet');
    }
    return false;
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUserAddress(null);
    localStorage.setItem('walletConnected', 'false');
    localStorage.removeItem('userAddress');
  };

  return (
    <ThemeProvider>
      <BlockchainContext.Provider value={{ 
        isConnected, 
        userAddress, 
        connectWallet, 
        disconnectWallet 
      }}>
        <Router>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <Routes>
              <Route path="/nft/create" element={<NFTCreate />} />
              <Route path="/nft/collection" element={<NFTCollection />} />
              <Route path="/" element={<Navigate to="/nft/create" replace />} />
            </Routes>
          </div>
        </Router>
      </BlockchainContext.Provider>
    </ThemeProvider>
  );
}

export default App;