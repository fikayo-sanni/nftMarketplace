"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAsset } from "@/utils/getToken";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import Image from "next/image";
import Link from "next/link";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import {
  buyNFT,
  getNFTDetail,
  getNFTList,
  RemoveNFTList,
} from "@/utils/nftMarket";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

interface Product {
  name: string;
  imageURI: string;
  groupAddress: string;
  seller: string;
  price: number; // Price in base currency (e.g., USDC cents)
  listing: string;
}

// Define available tokens and their exchange rates, ideally fetch rates from a marketplace
const availableTokens = [
  { symbol: "USDC", address: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr", rate: 1 },
  { symbol: "USDT", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", rate: 1.01 },
  { symbol: "SOL", address: NATIVE_MINT, rate: 0.0000567},
];

const ProductPage: React.FC = () => {
  const { assetId } = useParams() as { assetId: string };
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>("USDC");
  const [displayedPrice, setDisplayedPrice] = useState<number>(0);

  useEffect(() => {
    if (assetId) {
      const fetchProductDetails = async () => {
        try {
          const provider = new AnchorProvider(connection, wallet as Wallet, {});
          const listings = await getNFTList(provider, connection);
          const listing = listings.find((list) => list.mint === assetId);
          const details = await getNFTDetail(
            new PublicKey(assetId),
            connection,
            listing?.seller,
            listing?.price,
            listing?.pubkey || ""
          );
          setProduct({
            name: details.name,
            imageURI: details.image || "",
            groupAddress: details.group || "",
            seller: details.seller,
            price: details.price,
            listing: details.listing,
          });
          setMainImage(details.image || "");
          setDisplayedPrice(details.price / 1000000); // Default price in base currency (e.g., USDC)
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      };

      fetchProductDetails();
    }
  }, [assetId]);

  useEffect(() => {
    if (product && selectedToken) {
      const selectedTokenData = availableTokens.find((token) => token.symbol === selectedToken);
      if (selectedTokenData) {
        // Calculate price based on selected token's rate
        const convertedPrice = (product.price / 1000000) * selectedTokenData.rate;
        setDisplayedPrice(convertedPrice);
      }
    }
  }, [product, selectedToken]);

  const onBuy = useCallback(
    async (sellerKey: string, listingKey: string, token: string) => {
      if (!publicKey) {
        alert("Please connect your wallet!");
        return;
      }

      const provider = new AnchorProvider(connection, wallet as Wallet, {});
      const mint = new PublicKey(assetId);
      const nftAccount = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const seller = new PublicKey(sellerKey);
      const listing = new PublicKey(listingKey);

      const tokenKey = availableTokens.find((availableToken)=> availableToken.symbol === token)?.address

      try {
        // Call buyNFT function with selected token
        await buyNFT(
          mint,
          seller,
          listing,
          publicKey,
          provider,
          sendTransaction,
          connection,
          tokenKey
        );
      } catch (error) {
        console.error("Purchase failed:", error);
      }
    },
    [publicKey, connection, sendTransaction, assetId]
  );

  const onWithdraw = useCallback(
    async (listingKey: string) => {
      if (!publicKey) {
        alert("Please connect your wallet!");
        return;
      }

      const provider = new AnchorProvider(connection, wallet as Wallet, {});
      const listing = new PublicKey(listingKey);
      const mint = new PublicKey(assetId);

      try {
        await RemoveNFTList(publicKey, mint, listing, provider, connection);
        router.back();
      } catch (err) {
        console.error("Withdraw failed:", err);
      }
    },
    [publicKey, connection, assetId, router]
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-black p-4">
        <Skeleton className="h-[500px] w-[500px] rounded-xl dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black p-4">
      <Card className="flex flex-col items-center p-8 border rounded-lg shadow-lg bg-white dark:bg-gray-900 dark:border-gray-700 w-full max-w-2xl">
        <button
          className="self-start mb-4 text-blue-500 hover:underline"
          onClick={() => router.back()}
        >
          Back to market
        </button>
        <div className="w-full flex flex-col items-center">
          {mainImage && (
            <Image
              src={mainImage}
              alt={product.name}
              width={400}
              height={400}
              className="object-contain rounded-lg mb-4"
              loading="lazy"
            />
          )}
          <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {product.name}
          </h1>
          <p className="text-md text-gray-800 dark:text-gray-200">
            <strong>Group Address:</strong>
            <Link
              href={`https://solscan.io/address/${product.groupAddress}`}
              target="_blank"
              className="text-blue-500 hover:underline ml-2"
            >
              {product.groupAddress}
            </Link>
          </p>

          <div className="mt-4">
            <label htmlFor="token-select" className="text-md font-semibold mr-2">
              Choose Token:
            </label>
            <select
              id="token-select"
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="p-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              {availableTokens.map((token) => (
                <option key={token.address} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="text-md text-gray-800 dark:text-gray-200 mt-4">
            <strong>
              Price: {displayedPrice.toFixed(6)} {selectedToken}
            </strong>
          </div>

          {product.seller === publicKey?.toString() ? (
            <Button
              className="w-full h-12 text-xl bg-blue-400 text-white hover:bg-blue-500 mt-6"
              onClick={() => onWithdraw(product.listing)}
            >
              Withdraw
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-xl bg-blue-400 text-white hover:bg-blue-500 mt-6"
              onClick={() => onBuy(product.seller, product.listing, selectedToken)}
            >
              Buy
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductPage;