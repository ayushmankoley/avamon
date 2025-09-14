"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ArchiveBoxIcon, ArrowPathIcon, CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useCardDetails, usePackOpening, usePlayerPacks, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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

interface RevealedCard {
  id: string;
  name: string;
  rarity: "common" | "rare" | "mythic";
  templateId: string;
  attack: number;
  defense: number;
  agility: number;
  hp: number;
  isRevealed: boolean;
}

const Packs = () => {
  const { address } = useAccount();
  const { packBalances } = usePlayerPacks();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonPackOpener");
  const { openingState, openPack, resetOpeningState } = usePackOpening();
  const { cardDetails, isLoading: cardsLoading } = useCardDetails(openingState.openingResult?.avamonIds || []);

  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [revealedCards, setRevealedCards] = useState<RevealedCard[]>([]);
  const [revealStep, setRevealStep] = useState(0);
  const [openingComplete, setOpeningComplete] = useState(false);



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

  // Get real card data from pack opening results (memoized to prevent infinite re-renders)
  const getRevealedCardsFromResult = useMemo((): RevealedCard[] => {
    if (openingState.openingResult && cardDetails && cardDetails.length > 0) {
      return cardDetails.map((card, index) => ({
        id: card.tokenId.toString(),
        name: card.name,
        rarity: (card.rarity === 0 ? "common" : card.rarity === 1 ? "rare" : "mythic") as "common" | "rare" | "mythic",
        templateId: card.templateId.toString(),
        attack: card.attack,
        defense: card.defense,
        agility: card.agility,
        hp: card.hp,
        isRevealed: false,
      }));
    }
    return [];
  }, [openingState.openingResult?.avamonIds?.join(','), cardDetails?.length]); // Memoize to prevent infinite re-renders

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-400 bg-gray-50";
      case "rare":
        return "border-blue-400 bg-blue-50";
      case "mythic":
        return "border-yellow-400 bg-yellow-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "shadow-gray-400";
      case "rare":
        return "shadow-blue-400";
      case "mythic":
        return "shadow-yellow-400";
      default:
        return "";
    }
  };

  const handleOpenPack = async (pack: Pack) => {
    if (pack.count <= 0) {
      alert("You don't have any packs of this type!");
      return;
    }

    setSelectedPack(pack);
    setRevealStep(0);
    setOpeningComplete(false);

    try {
      // Use the pack opening hook
      await openPack(BigInt(pack.id));

      console.log("✅ Pack opening transaction sent successfully");
    } catch (error) {
      console.error("Error opening pack:", error);
      alert("Failed to open pack");
    }
  };


  // Packs are not purchasable - they come from quest rewards and adventure drops only

  const handleReset = () => {
    resetOpeningState();
    setSelectedPack(null);
    setRevealedCards([]);
    setRevealStep(0);
    setOpeningComplete(false);
  };

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

      {!openingState.isOpening ? (
        <>
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
                            >
                              Open Pack
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
                  {revealedCards.filter(card => card.isRevealed).length}
                </div>
                <p className="text-sm text-base-content/70">Cards Revealed Today</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Pack Opening Animation */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Opening {selectedPack?.name}
            </h2>

            {/* Pack Animation */}
            <div className="relative mb-8">
              <div
                className={`w-32 h-32 mx-auto rounded-lg overflow-hidden transition-all duration-1000 ${
                  revealStep >= 1 ? "animate-bounce scale-110" : ""
                } ${revealStep >= 3 ? "animate-pulse" : ""} ${revealStep >= 5 ? "opacity-50" : ""}`}
              >
                <img
                  src={`https://gateway.pinata.cloud/ipfs/bafybeigumdywpusxc6kgt32yxyegrhhcdkm4pzk3payv632o4gzcmspqim/pack_${selectedPack?.type}.png`}
                  alt={`${selectedPack?.name} pack opening`}
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
                    selectedPack?.type === "blue"
                      ? "bg-blue-500"
                      : selectedPack?.type === "green"
                        ? "bg-green-500"
                        : "bg-red-500"
                  }`}
                >
                  <ArchiveBoxIcon className="h-16 w-16 text-white" />
                </div>
              </div>

              {/* Enhanced sparkle effects */}
              {revealStep >= 1 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <SparklesIcon className="h-8 w-8 text-yellow-400 animate-ping" />
                    {revealStep >= 2 && (
                      <>
                        <SparklesIcon className="absolute -top-2 -left-2 h-4 w-4 text-yellow-300 animate-bounce" />
                        <SparklesIcon
                          className="absolute -top-2 -right-2 h-4 w-4 text-yellow-300 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <SparklesIcon
                          className="absolute -bottom-2 -left-2 h-4 w-4 text-yellow-300 animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                        <SparklesIcon
                          className="absolute -bottom-2 -right-2 h-4 w-4 text-yellow-300 animate-bounce"
                          style={{ animationDelay: "0.6s" }}
                        />
                      </>
                    )}
                    {revealStep >= 4 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 border-4 border-yellow-400 rounded-full animate-ping opacity-20"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opening progress indicator */}
              <div className="mt-4 text-center">
                <div className="text-sm text-base-content/70 mb-2">
                  {openingState.isOpening && "🔗 Processing pack opening transaction..."}
                  {!openingState.isOpening && openingState.openingResult && "🎉 Pack opened! Cards received..."}
                  {!openingState.isOpening && !openingState.openingResult && "⏳ Waiting for blockchain confirmation..."}
                </div>
                <div className="flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map(step => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                        revealStep >= step ? "bg-yellow-400" : "bg-base-300"
                      }`}
                    />
                  ))}
                </div>

              </div>
            </div>
          </div>

          {/* Card Reveal Grid */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {revealedCards.map((card, index) => (
              <div
                key={card.id}
                className={`relative p-4 rounded-lg border-2 transition-all duration-500 ${
                  card.isRevealed ? getRarityColor(card.rarity) : "border-base-300 bg-base-200"
                } ${card.isRevealed ? `shadow-lg ${getRarityGlow(card.rarity)}` : ""}`}
                style={{
                  animationDelay: `${index * 0.5}s`,
                  transform: card.isRevealed ? "scale(1)" : "scale(0.95)",
                  opacity: card.isRevealed ? 1 : 0.7,
                }}
              >
                {!card.isRevealed ? (
                  <div className="w-full aspect-square bg-base-300 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">❓</span>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-3">
                      <div className="aspect-square w-16 bg-base-200 rounded-lg mx-auto mb-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/bafybeigumdywpusxc6kgt32yxyegrhhcdkm4pzk3payv632o4gzcmspqim/${card.templateId}.png`}
                          alt={card.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={e => {
                            // Fallback to emoji if image fails to load
                            const img = e.target as HTMLImageElement;
                            const fallback = img.nextElementSibling as HTMLElement;
                            img.style.display = "none";
                            if (fallback) fallback.style.display = "block";
                          }}
                        />
                      </div>
                      <h3 className="font-bold text-sm">{card.name}</h3>
                      <p className="text-xs text-base-content/70 capitalize">{card.rarity}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>⚔️ {card.attack}</div>
                      <div>🛡️ {card.defense}</div>
                      <div>💨 {card.agility}</div>
                      <div>❤️ {card.hp}</div>
                    </div>
                  </>
                )}

                {/* Rarity glow effect */}
                {card.isRevealed && card.rarity === "mythic" && (
                  <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 animate-pulse pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>

          {/* Completion Actions */}
          {openingComplete && (
            <div className="text-center">
              <div
                className="px-4 py-3 rounded-lg mb-4 inline-block bg-green-100 border border-green-400 text-green-700"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span>Packs opened successfully! Cards added to your collection.</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button className="btn btn-primary" onClick={handleReset}>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Open Another Pack
                </button>
                <button className="btn btn-outline" onClick={() => (window.location.href = "/cards")}>
                  View Collection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Packs;
