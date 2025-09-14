"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  QueueListIcon,
  PlusIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { usePlayerCards, usePlayerDecks, usePlayerStats, useDeckBuilder } from "~~/hooks/scaffold-eth";

interface AvamonCardProps {
  tokenId: string;
  templateId: string;
  name: string;
  rarity: number;
  attack: number;
  defense: number;
  agility: number;
  hp: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const AvamonCard = ({
  tokenId,
  templateId,
  name,
  rarity,
  attack,
  defense,
  agility,
  hp,
  isSelected = false,
  onClick
}: AvamonCardProps) => {
  const rarityColors = {
    0: "border-gray-400", // Common
    1: "border-blue-400", // Rare
    2: "border-yellow-400" // Mythic
  };

  return (
    <div
      className={`relative w-full h-full rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden ${
        rarityColors[rarity as keyof typeof rarityColors]
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <img
        src={`https://gateway.pinata.cloud/ipfs/bafybeigumdywpusxc6kgt32yxyegrhhcdkm4pzk3payv632o4gzcmspqim/${templateId}.png`}
        alt={name}
        className="w-full h-full object-cover"
      />

      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  );
};

const Cards = () => {
  const { address } = useAccount();
  const { ownedCards, isLoading: cardsLoading, error: cardsError, refreshCards } = usePlayerCards();
  const {
    savedDecks,
    maxDeckSlots,
    currentDeck,
    selectedDeckIndex,
    saveDeck,
    loadDeck,
    addCardToDeck,
    removeCardFromDeck,
    clearDeck,
    upgradeDeckSlots,
    validateDeck,
    isLoading: deckLoading,
    error: deckError
  } = useDeckBuilder();

  const [viewMode, setViewMode] = useState<'inventory' | 'deckBuilder'>('inventory');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<number | null>(null);

  const filteredCards = ownedCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === null || card.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  const isLoading = cardsLoading || deckLoading;
  const error = cardsError || deckError;

  const handleCardSelect = (tokenId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(tokenId)) {
      newSelected.delete(tokenId);
      removeCardFromDeck(BigInt(tokenId));
    } else if (newSelected.size < 4) {
      newSelected.add(tokenId);
      addCardToDeck(BigInt(tokenId));
    }
    setSelectedCards(newSelected);
  };

  const handleSaveDeck = async () => {
    if (currentDeck.length !== 4) {
      alert("Please select exactly 4 cards for your deck");
      return;
    }

    try {
      const deckName = `Deck ${selectedDeckIndex + 1}`;
      await saveDeck(selectedDeckIndex, deckName, currentDeck);
      alert("Deck saved successfully!");
    } catch (error) {
      console.error("Error saving deck:", error);
      alert("Failed to save deck");
    }
  };

  const handleUpgradeDeckSlots = async () => {
    try {
      await upgradeDeckSlots();
      alert("Deck slots upgraded successfully!");
    } catch (error) {
      console.error("Error upgrading deck slots:", error);
      alert("Failed to upgrade deck slots");
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70">Please connect your wallet to view your Avamon cards</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-100 to-base-200">
        <div className="text-center max-w-md">
          {/* Animated Card Stack */}
          <div className="relative mb-8">
            <div className="flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-16 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border-2 border-primary/30 shadow-lg transform transition-all duration-1000 ${
                    i === 0 ? 'animate-bounce' : i === 1 ? 'animate-pulse' : 'animate-ping'
                  }`}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `rotate(${(i - 1) * 5}deg) translateY(${i * 2}px)`
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent rounded-md flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Magical sparkles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
                  style={{
                    top: `${20 + (i * 15)}%`,
                    left: `${10 + (i * 15)}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Loading Text with Animation */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Summoning Your Cards
            </h3>
            <div className="flex justify-center space-x-1">
              {['Scanning', 'the', 'blockchain'].map((word, i) => (
                <span
                  key={i}
                  className="text-base-content/70 animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  {word}
                </span>
              ))}
              <div className="flex space-x-1 ml-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
            </div>
            <p className="text-sm text-base-content/50">
              ✨ Gathering your legendary collection...
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="w-64 h-2 bg-base-300 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Cards</h2>
          <p className="text-base-content/70 mb-4">Unable to load your card collection.</p>
          <p className="text-sm text-base-content/50">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Cards & Decks</h1>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-base-200 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'inventory' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setViewMode('inventory')}
          >
            <Squares2X2Icon className="h-4 w-4 inline mr-2" />
            Inventory
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'deckBuilder' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setViewMode('deckBuilder')}
          >
            <Cog6ToothIcon className="h-4 w-4 inline mr-2" />
            Deck Builder
          </button>
        </div>
      </div>

      {viewMode === 'inventory' && (
        <>
          {/* Filters */}
          <div className="bg-base-100 rounded-lg p-4 mb-6 shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
                  <input
                    type="text"
                    placeholder="Search cards..."
                    className="input input-bordered w-full pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={refreshCards}
                  title="Refresh cards from blockchain"
                >
                  🔄 Refresh
                </button>
                <button
                  className={`btn btn-sm ${rarityFilter === null ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRarityFilter(null)}
                >
                  All
                </button>
                <button
                  className={`btn btn-sm ${rarityFilter === 0 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRarityFilter(0)}
                >
                  Common
                </button>
                <button
                  className={`btn btn-sm ${rarityFilter === 1 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRarityFilter(1)}
                >
                  Rare
                </button>
                <button
                  className={`btn btn-sm ${rarityFilter === 2 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRarityFilter(2)}
                >
                  Mythic
                </button>
              </div>
            </div>
          </div>

          {/* Card Grid - MODIFIED: Changed from 6 columns to 3 columns and aspect ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
            {filteredCards.map((card) => (
              <div key={card.tokenId.toString()} className="aspect-[3/4] h-100 p-5">
                <AvamonCard
                  tokenId={card.tokenId.toString()}
                  templateId={card.templateId.toString()}
                  name={card.name}
                  rarity={card.rarity}
                  attack={card.attack}
                  defense={card.defense}
                  agility={card.agility}
                  hp={card.hp}
                />
              </div>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-base-content/70">No cards found matching your criteria</p>
            </div>
          )}
        </>
      )}

{viewMode === 'deckBuilder' && (
  <div className="space-y-6">
    {/* Top Row: Deck Slots and Selected Cards with Equal Height */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Deck Slots */}
      <div className="lg:col-span-1">
        <div className="bg-base-100 rounded-lg p-4 shadow-lg h-110">
          <h2 className="text-xl font-bold mb-4">Deck Slots</h2>
          <div className="space-y-2 overflow-y-auto h-60">
            {Array.from({ length: maxDeckSlots }, (_, index) => (
              <button
                key={index}
                className={`w-full p-3 rounded-lg border-2 transition-colors ${
                  selectedDeckIndex === index
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 hover:border-primary'
                }`}
                onClick={() => loadDeck(index)}
              >
                <div className="flex justify-between items-center">
                  <span>Deck {index + 1}</span>
                  {savedDecks[index] && <span className="text-sm text-base-content/70">{savedDecks[index].name}</span>}
                </div>
              </button>
            ))}
            {maxDeckSlots < 3 && (
              <button
                className="w-full p-3 rounded-lg border-2 border-dashed border-primary hover:bg-primary/10 transition-colors"
                onClick={handleUpgradeDeckSlots}
              >
                <div className="flex items-center justify-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Upgrade to 3 Slots (0.1 AVAX)</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Cards */}
      <div className="lg:col-span-2">
        <div className="bg-base-100 rounded-lg p-4 shadow-lg h-110">
          <h2 className="text-xl font-bold mb-4">
            Selected Cards ({currentDeck.length}/4)
          </h2>
          
          {/* Empty Slots in Single Row - Rectangle Layout */}
          <div className="grid grid-cols-4 gap-3 mb-4 min-h-80 p-5">
            {Array.from({ length: 4 }, (_, index) => {
              const cardId = currentDeck[index];
              const card = cardId ? ownedCards.find(c => c.tokenId === cardId) : null;

              return (
                <div
                  key={index}
                  className="bg-base-200 rounded-lg border-2 border-dashed border-base-300 flex items-center justify-center relative overflow-hidden"
                >
                  {card ? (
                    <div className="w-full h-full">
                      <AvamonCard
                        tokenId={card.tokenId.toString()}
                        templateId={card.templateId.toString()}
                        name={card.name}
                        rarity={card.rarity}
                        attack={card.attack}
                        defense={card.defense}
                        agility={card.agility}
                        hp={card.hp}
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-base-content/30 text-2xl mb-1">+</div>
                      <span className="text-base-content/50 text-xs font-medium">Slot {index + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handleSaveDeck}
            disabled={currentDeck.length !== 4}
          >
            Save Deck
          </button>
        </div>
      </div>
    </div>

    {/* Available Cards - Full Width */}
    <div className="bg-base-100 rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Available Cards</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {ownedCards.map((card) => (
          <div key={card.tokenId.toString()} className="aspect-[3/4]">
            <AvamonCard
              tokenId={card.tokenId.toString()}
              templateId={card.templateId.toString()}
              name={card.name}
              rarity={card.rarity}
              attack={card.attack}
              defense={card.defense}
              agility={card.agility}
              hp={card.hp}
              isSelected={currentDeck.includes(card.tokenId)}
              onClick={() => handleCardSelect(card.tokenId.toString())}
            />
          </div>
        ))}
      </div>
      {ownedCards.length === 0 && (
        <div className="text-center py-8">
          <p className="text-base-content/70">No cards available. Open some packs to get started!</p>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default Cards;