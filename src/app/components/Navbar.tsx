"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { Sun, Moon } from "lucide-react";
import dynamic from "next/dynamic";
import { ethers } from "ethers";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";

// Dynamically load WalletMultiButton to ensure it is only rendered on the client side
const DynamicWalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const NavBar = () => {
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState<string | null>(null);
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:4000/api/userinfo", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setUsername(response.data.username);
        })
        .catch(() => {
          setUsername(null);
        });
    }
  }, []);

  const handleToggleTheme = () => {
    toggleTheme(theme === "light" ? "dark" : "light");
  };

  // Connect to MetaMask for Ethereum wallet
  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setEthAddress(accounts[0]);
      } catch (error) {
        console.error("MetaMask connection error:", error);
      }
    } else {
      alert("MetaMask is not installed.");
    }
  };

  return (
    <nav className="bg-black p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-white text-xl font-bold">Defy</div>
        </Link>
        <div className="space-x-4 flex items-center">
          <Link href="/dashboard" className="text-white hidden sm:inline">
            Profile
          </Link>
          <Link href="/studio" className="text-white hidden sm:inline">
            Studio
          </Link>
          <Link href="/discover" className="text-white hidden sm:inline">
            Discover
          </Link>
          <Link href="/discover/closet" className="text-white hidden sm:inline">
            Closet
          </Link>
          <Link href="/marketplace" className="text-white hidden sm:inline">
            Market
          </Link>
          <button
            onClick={handleToggleTheme}
            className="bg-black text-white px-2 py-1 rounded flex items-center justify-center"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-white" />
            ) : (
              <Sun className="w-5 h-5 text-white" />
            )}
          </button>
          {/* Solana Wallet Button */}
          {!ethAddress ?<DynamicWalletMultiButton />: <></>}
          {/* MetaMask Button */}
          {ethAddress ? (
            <span className="text-white px-2 py-1 rounded bg-green-600">
              Connected: {ethAddress.substring(0, 6)}...{ethAddress.slice(-4)}
            </span>
          ) : (
            !publicKey?<button
              onClick={connectMetaMask}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Connect MetaMask
            </button>:<></>
          )}
        </div>
      </div>
      <div className="container mx-auto flex justify-between items-center sm:hidden mt-2">
        <Link href="/dashboard" className="text-white">
          Profile
        </Link>
        <Link href="/studio" className="text-white">
          Studio
        </Link>
        <Link href="/discover" className="text-white">
          Discover
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
