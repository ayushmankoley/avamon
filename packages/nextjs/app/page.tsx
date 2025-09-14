"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  CurrencyDollarIcon,
  BoltIcon,
  CubeIcon,
  ArchiveBoxIcon,
  TrophyIcon,
  PlayIcon,
  SparklesIcon,
  WalletIcon
} from "@heroicons/react/24/outline";
import { Address, Balance, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { usePlayerStats, usePlayerPacks, useEnergySystem, useQuestSystem } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const {
    avamonBalance,
    energyRemaining,
    maxDeckSlots,
    totalAvamons,
    unopenedPacks,
    isLoading: statsLoading,
    error: statsError
  } = usePlayerStats();

  const {
    totalUnopenedPacks,
    isLoading: packsLoading,
    error: packsError
  } = usePlayerPacks();

  const {
    timeUntilReset,
    canReset,
    formatTimeRemaining,
    purchaseEnergy,
    isLoading: energyLoading,
    error: energyError
  } = useEnergySystem();

  const {
    availableQuests,
    userProgress,
    claimQuestReward,
    isLoading: questsLoading,
    error: questsError
  } = useQuestSystem();

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 10**18).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const isLoading = statsLoading || packsLoading || energyLoading || questsLoading;
  const error = statsError || packsError || energyError || questsError;

  // Show loading state only when connected
  if (isConnected && isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-base-content/70">Loading your Avamon stats...</p>
        </div>
      </div>
    );
  }

  // Show error state only when connected and there's an error
  if (isConnected && error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-base-content/70 mb-4">
            Unable to load your Avamon data. Please check your connection and try again.
          </p>
          <p className="text-sm text-base-content/50">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-page video when wallet is not connected */}
      {!isConnected && (
        <div className="h-full flex items-center justify-center relative">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          >
            <source src="/landing.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center gap-[20px] pt-[15vh]">
            <div className="bg-gray-600 bg-opacity-100 px-8 py-4 rounded-full">
              <h1 className="text-white text-[180px] font-bold text-center">
                Avamon
              </h1>
            </div>
            <div className="bg-gray-700 bg-opacity-75 px-6 py-4 rounded-lg">
              <h1 className="text-white text-4xl font-bold text-center">
                Start Your Trading Card Collection
              </h1>
            </div>
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      )}

      {/* Connected user content */}
      {isConnected && (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-6 w-full max-w-7xl mx-auto">
              <h1 className="text-center mb-6">
                <span className="block text-4xl font-bold text-primary">Welcome to Avamon TCG</span>
                <span className="block text-lg text-base-content/70 mt-2">Your Epic Card Battle Adventure</span>
              </h1>

              {/* Stats - Only show when connected */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-base-100 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-base-content/70">$AM Balance</p>
                      <p className="text-xl font-bold">{formatBalance(avamonBalance)} $AM</p>
                    </div>
                  </div>
                </div>

                <div className="bg-base-100 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <BoltIcon className="h-8 w-8 text-yellow-500" />
                    <div className="w-full">
                      <p className="text-sm text-base-content/70">Energy</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-base-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(energyRemaining / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{energyRemaining}/10</span>
                      </div>
                      <p className="text-xs text-base-content/60 mt-1">
                        {canReset ? "Ready to reset!" : `Resets in: ${formatTimeRemaining(timeUntilReset)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-base-100 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <CubeIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-base-content/70">Avamons Owned</p>
                      <p className="text-xl font-bold">{totalAvamons}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-base-100 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <ArchiveBoxIcon className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-base-content/70">Packs to Open</p>
                      <p className="text-xl font-bold">{totalUnopenedPacks}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quest Popup Widget - Only show when connected */}
              <div className="bg-base-100 rounded-lg p-4 shadow-lg mb-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-500" />
                  Today's Quests
                </h2>
                <div className="space-y-2">
                  {availableQuests
                    .filter(quest => quest.timeWindow.end - quest.timeWindow.start <= 24 * 60 * 60)
                    .slice(0, 3)
                    .map(quest => {
                      const progress = userProgress.find(p => p.questId === quest.id);
                      const currentProgress = progress?.progress || 0;
                      const target = quest.requirements.target;
                      const isCompleted = progress?.isCompleted || false;
                      const isClaimed = progress?.isClaimed || false;

                      return (
                        <div key={quest.id} className="flex items-center justify-between p-2 bg-base-200 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{quest.title}</p>
                            <p className="text-xs text-base-content/70 truncate">{quest.description}</p>
                          </div>
                          {/* Special handling for daily check-in - always show claim button if not claimed */}
                          {quest.id === "1" ? (
                            !isClaimed ? (
                              <button
                                className="btn btn-primary btn-xs ml-2"
                                onClick={() => claimQuestReward(quest.id)}
                              >
                                Check In
                              </button>
                            ) : (
                              <div className="text-xs text-green-600 ml-2">✓ Done</div>
                            )
                          ) : isCompleted && !isClaimed ? (
                            <button
                              className="btn btn-primary btn-xs ml-2"
                              onClick={() => claimQuestReward(quest.id)}
                            >
                              Claim
                            </button>
                          ) : (
                            <div className="text-xs text-base-content/70 ml-2">
                              {currentProgress}/{target}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <div className="mt-3 text-center">
                  <Link href="/quests" className="btn btn-outline btn-xs">
                    View All Quests
                  </Link>
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/packs" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="text-center">
                    <ArchiveBoxIcon className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="text-base font-bold">Open Packs</h3>
                    <p className="text-xs opacity-90">Reveal new cards</p>
                  </div>
                </Link>

                <Link href="/quests" className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="text-center">
                    <TrophyIcon className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="text-base font-bold">Quests</h3>
                    <p className="text-xs opacity-90">Complete missions</p>
                  </div>
                </Link>

                <Link href="/cards" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="text-center">
                    <SparklesIcon className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="text-base font-bold">Cards & Decks</h3>
                    <p className="text-xs opacity-90">Build your team</p>
                  </div>
                </Link>

                <Link href="/adventures" className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                  <div className="text-center">
                    <PlayIcon className="h-8 w-8 mx-auto mb-2" />
                    <h3 className="text-base font-bold">Adventures</h3>
                    <p className="text-xs opacity-90">Battle & earn</p>
                  </div>
                </Link>
              </div>

              {/* Connected Address - Only show when connected */}
              {connectedAddress && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-base-content/70 mb-2">Connected Wallet</p>
                  <Address address={connectedAddress} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;