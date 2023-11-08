import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { create as ipfsCreateClient } from 'ipfs-http-client';

import { MarketAddress, MarketAddressABI } from './constants';

const projectID = '2XowHJwzMGrIEWm0105PtaPR5tE';
const projectSecret = '8917478de762cad5d4051b7c2482b4bf';
const auth = `Basic ${Buffer.from(`${projectID}:${projectSecret}`).toString('base64')}`;

const ipfs = ipfsCreateClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const nftCurrency = 'ETH';

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log('No accounts found');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    setCurrentAccount(accounts[0]);

    window.location.reload();
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await ipfs.add({ content: file });

      const url = `https://cloudflare-ipfs.com/ipfs/${added.path}`;

      return url;
    } catch (error) {
      console.log('Error uploading file to IPFS');
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    console.log({ name, description, price, fileUrl });

    if (!name || !description || !price || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });
    console.log({ data });

    try {
      const added = await ipfs.add(data);

      console.log(1);

      const url = `https://cloudflare-ipfs.com/ipfs/${added.path}`;

      console.log(2);

      await createSale(url, price);

      console.log(3);

      router.push('/');
    } catch (error) {
      console.log('Error uploading file to IPFS');
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const price = ethers.utils.parseUnits(formInputPrice, 'ether');
    const contract = fetchContract(signer);
    const listingPrice = await contract.getListingPrice();

    const transaction = await contract.createToken(url, price, { value: listingPrice.toString() });

    await transaction.wait();
  };

  return (
    <NFTContext.Provider value={{ nftCurrency, connectWallet, currentAccount, uploadToIPFS, createNFT }}>
      {children}
    </NFTContext.Provider>
  );
};
