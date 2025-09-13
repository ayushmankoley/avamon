"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BoltIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useScaffoldWriteContract, usePlayerStats, usePlayerDecks, useAdventures } from "~~/hooks/scaffold-eth";

interface Adventure {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  energyCost: number;
  entryFee: number; // $AM tokens
  minReward: number;
  maxReward: number;
  packDropChance: number; // percentage
  isActive: boolean;
}

interface ActiveAdventure {
  id: string;
  adventureId: string;
  startTime: number;
  endTime: number;
  isCompleted: boolean;
  rewardClaimed: boolean;
  selectedDeck: number;
}

const Adventures = () => {
  const { address } = useAccount();
  const { energyRemaining } = usePlayerStats();
  const { decks } = usePlayerDecks();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCore");
  const { availableAdventures: contractAdventures, isLoading, error } = useAdventures();

  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState<number>(0);

  // Convert contract adventure data to page format
  const availableAdventures: Adventure[] = contractAdventures.map(adventure => ({
    id: adventure.id.toString(),
    name: adventure.name,
    description: adventure.description,
    duration: Number(adventure.duration) / 60, // Convert seconds to minutes
    energyCost: 1, // All adventures cost 1 energy
    entryFee: Number(adventure.entryFee) / 10**18, // Convert wei to tokens
    minReward: Number(adventure.minReward) / 10**18,
    maxReward: Number(adventure.maxReward) / 10**18,
    packDropChance: Number(adventure.packDropChance),
    isActive: adventure.isActive,
  }));

  // No active adventures for first-time users - will be populated from contract events
  const activeAdventures: ActiveAdventure[] = [];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);

    if (remaining === 0) return "Completed";

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const handleJoinAdventure = async (adventure: Adventure) => {
    if (!address) return;

    try {
      // Check if player has enough energy
      if (energyRemaining < adventure.energyCost) {
        alert("Not enough energy to start this adventure");
        return;
      }

      // Check if player has enough tokens for entry fee
      if (adventure.entryFee > 0) {
        // Token balance check would go here
        alert(`Entry fee of ${adventure.entryFee} $AM required`);
        return;
      }

      // Check if selected deck has 4 cards
      if (!decks[selectedDeckIndex] || decks[selectedDeckIndex].avamonIds.length !== 4) {
        alert("Please select a deck with 4 Avamons");
        return;
      }

      // Join adventure logic would go here
      alert(`Starting adventure: ${adventure.name}`);
    } catch (error) {
      console.error("Error joining adventure:", error);
      alert("Failed to join adventure");
    }
  };

  const handleClaimReward = async (activeAdventure: ActiveAdventure) => {
    try {
      // Claim reward logic would go here
      alert("Reward claimed successfully!");
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Failed to claim reward");
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70">Please connect your wallet to access adventures</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Adventures</h1>
        <p className="text-base-content/70">Embark on epic quests and earn rewards</p>
      </div>

      {/* Active Adventures */}
      {activeAdventures.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <PlayIcon className="h-6 w-6 text-green-500" />
            Active Adventures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAdventures.map((activeAdv) => {
              const adventure = availableAdventures.find(a => a.id === activeAdv.adventureId);
              if (!adventure) return null;

              const isCompleted = Date.now() >= activeAdv.endTime;

              return (
                <div key={activeAdv.id} className="bg-base-100 rounded-lg p-6 shadow-lg border-2 border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{adventure.name}</h3>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <ClockIcon className="h-6 w-6 text-blue-500" />
                    )}
                  </div>

                  <p className="text-sm text-base-content/70 mb-4">{adventure.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Time Remaining:</span>
                      <span className={isCompleted ? "text-green-600 font-bold" : ""}>
                        {formatTimeRemaining(activeAdv.endTime)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reward Range:</span>
                      <span>{adventure.minReward} - {adventure.maxReward} $AM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pack Chance:</span>
                      <span>{adventure.packDropChance}%</span>
                    </div>
                  </div>

                  {isCompleted && !activeAdv.rewardClaimed && (
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => handleClaimReward(activeAdv)}
                    >
                      Claim Rewards
                    </button>
                  )}

                  {isCompleted && activeAdv.rewardClaimed && (
                    <div className="text-center text-green-600 font-medium">
                      Rewards Claimed ✓
                    </div>
                  )}

                  {!isCompleted && (
                    <div className="text-center text-blue-600 font-medium">
                      In Progress...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Adventures */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <PlayIcon className="h-6 w-6 text-purple-500" />
          Available Adventures
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableAdventures.map((adventure) => (
            <div key={adventure.id} className="bg-base-100 rounded-lg p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{adventure.name}</h3>
                  <p className="text-sm text-base-content/70 mt-1">{adventure.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-base-content/70">
                    <ClockIcon className="h-4 w-4" />
                    {formatDuration(adventure.duration)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <BoltIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{adventure.energyCost} Energy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {adventure.entryFee > 0 ? `${adventure.entryFee} $AM` : 'Free'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ArchiveBoxIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{adventure.packDropChance}% Pack</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {adventure.minReward} - {adventure.maxReward} $AM
                  </span>
                </div>
              </div>

              {/* Deck Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Deck:</label>
                <select
                  className="select select-bordered w-full"
                  value={selectedDeckIndex}
                  onChange={(e) => setSelectedDeckIndex(Number(e.target.value))}
                >
                  {decks.map((deck, index) => (
                    <option key={index} value={index}>
                      Deck {index + 1}: {deck?.name || 'Unnamed'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={() => handleJoinAdventure(adventure)}
                disabled={energyRemaining < adventure.energyCost}
              >
                {energyRemaining < adventure.energyCost ? (
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Not Enough Energy
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PlayIcon className="h-4 w-4" />
                    Start Adventure
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Energy Warning */}
      {energyRemaining < 3 && (
        <div className="mt-8 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            <span>
              Low energy! You have {energyRemaining}/10 energy remaining.
              Energy resets daily at 5:30 IST.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adventures;
