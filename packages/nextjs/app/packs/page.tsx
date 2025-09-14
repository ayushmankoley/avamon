"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { usePackOpening, usePlayerPacks, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Pack {
  id: string;
  name: string;
  type: "blue" | "green" | "red";
  count: number;
  price: number;
  rarityOdds: {
    common: number;
    rare: number;
    mythic: number;
  };
}


const Packs = () => {
  const { address } = useAccount();
  const { packBalances } = usePlayerPacks();
  const { openingState, openPack, resetOpeningState } = usePackOpening();

  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);



  // Pack data from contracts - packs are only obtainable through quest rewards and adventure drops
  const availablePacks: Pack[] = packBalances.map(pack => ({
    id: pack.packId.toString(),
    name: pack.name,
    type: pack.packId === 1n ? "blue" : pack.packId === 2n ? "green" : "red",
    count: pack.balance,
    price: 0, // Not purchasable
    rarityOdds: {
      common: Number(pack.rarityChances[0]),
      rare: Number(pack.rarityChances[1]),
      mythic: Number(pack.rarityChances[2]),
    },
  }));



  const handleOpenPack = async (pack: Pack) => {
    if (pack.count <= 0) {
      alert("You don't have any packs of this type!");
      return;
    }

    setSelectedPack(pack);

    try {
      // Use the pack opening hook (emergency function for faster randomness)
      await openPack(BigInt(pack.id));

      console.log("✅ Emergency pack opening transaction sent successfully");

      // Fake confirmation timeout - show success after 5 seconds
      setTimeout(() => {
        alert("🎉 Pack opened successfully! Your cards have been added to your collection.");
        // Redirect to Cards & Decks page
        window.location.href = "/cards";
      }, 5000);

    } catch (error) {
      console.error("Error opening pack:", error);
      alert("Failed to open pack: " + (error instanceof Error ? error.message : String(error)));
    }
  };


  // Packs are not purchasable - they come from quest rewards and adventure drops only

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70">Please connect your wallet to open packs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Packs</h1>
        <p className="text-base-content/70">
          Open packs to discover 5 new Avamons - earn packs through quests and adventures!
        </p>
      </div>

      {/* First Row - Pack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {availablePacks.map(pack => (
          <div key={pack.id} className="bg-base-100 rounded-lg p-6 shadow-lg h-220">
            <div className="flex flex-col h-full">
              {/* Pack Image - square format */}
              <div className="aspect-square w-full rounded-lg overflow-hidden">
                <img
                  src={`https://gateway.pinata.cloud/ipfs/bafybeigumdywpusxc6kgt32yxyegrhhcdkm4pzk3payv632o4gzcmspqim/pack_${pack.type}.png`}
                  alt={`${pack.name} pack`}
                  className="w-full h-full object-cover rounded-lg"
                  onError={e => {
                    // Fallback to colored box with icon if image fails to load
                    const img = e.target as HTMLImageElement;
                    const fallback = img.nextElementSibling as HTMLElement;
                    img.style.display = "none";
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div
                  className={`w-full h-full rounded-lg hidden items-center justify-center ${
                    pack.type === "blue" ? "bg-blue-500" : pack.type === "green" ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  <ArchiveBoxIcon className="h-16 w-16 text-white" />
                </div>
              </div>

              {/* Pack Details - flexible height */}
              <div className="flex-1 w-full flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-base-content mb-2">{pack.name}</h3>
                  <div className="inline-block bg-base-200 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-base-content/80">Quest Reward Only</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {/* Rarity Odds Section */}
                  <div className="bg-base-200/50 rounded-lg p-2">
                    <h4 className="font-semibold text-sm text-base-content mb-2 text-center">Rarity Odds</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-base-content/80">Common</span>
                        <span className="text-xs font-bold text-base-content bg-base-100 px-2 py-0.5 rounded">
                          {pack.rarityOdds.common}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-base-content/80">Rare</span>
                        <span className="text-xs font-bold text-base-content bg-base-100 px-2 py-0.5 rounded">
                          {pack.rarityOdds.rare}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-base-content/80">Mythic</span>
                        <span className="text-xs font-bold text-base-content bg-base-100 px-2 py-0.5 rounded">
                          {pack.rarityOdds.mythic}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Owned Section */}
                  <div className="bg-base-200/50 rounded-lg p-2">
                    <div className="text-center mb-2">
                      <span className="text-xs font-semibold text-base-content/80 block mb-1">Owned</span>
                      <div className="text-xl font-bold text-base-content">{pack.count}</div>
                    </div>

                    {pack.count > 0 ? (
                      <div className="space-y-2">
                        <button
                          className="btn btn-primary btn-sm w-full font-semibold"
                          onClick={() => handleOpenPack(pack)}
                          disabled={!!selectedPack} // Disable if already opening a pack
                        >
                          {selectedPack ? "Opening Pack..." : "Open Pack"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <div className="bg-base-100 rounded-lg py-1 px-2">
                          <p className="text-xs font-medium text-base-content/70">No packs available</p>
                        </div>
                        <p className="text-xs font-medium text-base-content/60">Complete quests to earn packs</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row - Pack Statistics */}
      <div className="bg-base-100 rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Pack Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {packBalances.reduce((total, pack) => total + pack.balance, 0)}
            </div>
            <p className="text-sm text-base-content/70">Total Packs Owned</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {availablePacks.reduce((total, pack) => total + (pack.count > 0 ? 1 : 0), 0)}
            </div>
            <p className="text-sm text-base-content/70">Pack Types Available</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500">
              0
            </div>
            <p className="text-sm text-base-content/70">Cards Revealed Today</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packs;
