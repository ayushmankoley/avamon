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
        <div className="text-center pixel-panel-light p-8">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-700 uppercase tracking-wide text-lg font-bold">LOADING YOUR AVAMON STATS...</p>
        </div>
      </div>
    );
  }

  // Show error state only when connected and there's an error
  if (isConnected && error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md pixel-panel p-8">
          <div className="w-20 h-20 bg-red-500 border-4 border-red-700 mx-auto mb-6 flex items-center justify-center text-3xl font-bold" style={{color: '#e8f4f8'}}>!</div>
          <h2 className="text-xl font-bold mb-4 text-red-400 uppercase tracking-wide">CONNECTION ERROR</h2>
          <p className="mb-6 text-base uppercase" style={{color: '#e8f4f8'}}>
            UNABLE TO LOAD YOUR AVAMON DATA. PLEASE CHECK YOUR CONNECTION AND TRY AGAIN.
          </p>
          <p className="text-sm" style={{color: '#d0d0d0'}}>{error}</p>
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
          <div className="absolute inset-0 flex flex-col items-center gap-[20px] pt-[30vh] pb-[5px]">
            <div className="bg-transparent bg-opacity-10 px-8 py-4 rounded-full">
            <h1 className="text-white text-[180px] font-bold text-center [text-shadow:_2px_2px_0_black,_-2px_-2px_0_black,_2px_-2px_0_black,_-2px_2px_0_black]">
              Avamon
            </h1>
            <h1 className="text-white text-4xl font-bold text-center [text-shadow:_2px_2px_0_black,_-2px_-2px_0_black,_2px_-2px_0_black,_-2px_2px_0_black]">
                Start Your Trading Card Collection
              </h1>
            </div>
            <div className="scale-150 transform-gpu">
              <RainbowKitCustomConnectButton />
            </div>
          </div>
        </div>
      )}

      {/* Connected user content */}
      {isConnected && (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-6 w-full max-w-7xl mx-auto">
              <h1 className="text-center mb-8">
                <span className="block text-3xl font-bold text-yellow-400 mb-3 tracking-wider">WELCOME TO AVAMON TCG</span>
                <span className="block text-lg text-cyan-300 mt-2 tracking-widest">YOUR EPIC CARD BATTLE ADVENTURE</span>
              </h1>

              {/* Stats - Only show when connected */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="pixel-panel-light p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 border-2 border-green-700 flex items-center justify-center text-xs font-bold">$</div>
                    <div>
                      <p className="text-sm text-gray-700 uppercase tracking-wide font-bold">AM BALANCE</p>
                      <p className="text-xl font-bold text-green-700">{formatBalance(avamonBalance)} $AM</p>
                    </div>
                  </div>
                </div>

                <div className="pixel-panel-light p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-500 border-2 border-yellow-700 flex items-center justify-center text-xs font-bold">E</div>
                    <div className="w-full">
                      <p className="text-sm text-gray-700 uppercase tracking-wide font-bold">ENERGY</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 energy-bar h-4">
                          <div
                            className="energy-fill h-full transition-all duration-300"
                            style={{ width: `${(energyRemaining / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-base font-bold text-yellow-600">{energyRemaining}/10</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 uppercase font-bold">
                        {canReset ? "READY TO RESET!" : `RESETS IN: ${formatTimeRemaining(timeUntilReset)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pixel-panel-light p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 border-2 border-blue-700 flex items-center justify-center text-xs font-bold">A</div>
                    <div>
                      <p className="text-sm text-gray-700 uppercase tracking-wide font-bold">AVAMONS OWNED</p>
                      <p className="text-xl font-bold text-blue-700">{totalAvamons}</p>
                    </div>
                  </div>
                </div>

                <div className="pixel-panel-light p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 border-2 border-purple-700 flex items-center justify-center text-xs font-bold">P</div>
                    <div>
                      <p className="text-sm text-gray-700 uppercase tracking-wide font-bold">PACKS TO OPEN</p>
                      <p className="text-xl font-bold text-purple-700">{totalUnopenedPacks}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quest Popup Widget - Only show when connected */}
              <div className="pixel-panel-light p-4 mb-6">
                <h2 className="text-yellow-700 font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-5 h-5 bg-yellow-500 border-2 border-yellow-700 flex items-center justify-center text-m font-bold">T</div>
                  TODAY'S QUESTS
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
                        <div key={quest.id} className="flex items-center justify-between p-2 pixel-panel mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm uppercase tracking-wide" style={{color: '#e8f4f8'}}>{quest.title}</p>
                            <p className="text-sm truncate" style={{color: '#d0d0d0'}}>{quest.description}</p>
                          </div>
                          {/* Special handling for daily check-in - always show claim button if not claimed */}
                          {quest.id === "1" ? (
                            !isClaimed ? (
                              <button
                                className="pixel-button-green text-sm px-3 py-2 ml-2"
                                onClick={() => claimQuestReward(quest.id)}
                                style={{color: '#e8f4f8'}}
                              >
                                CHECK IN
                              </button>
                            ) : (
                              <div className="text-sm text-green-400 ml-2 font-bold uppercase">DONE</div>
                            )
                          ) : isCompleted && !isClaimed ? (
                            <button
                              className="pixel-button text-sm px-3 py-2 ml-2"
                              onClick={() => claimQuestReward(quest.id)}
                              style={{color: '#e8f4f8'}}
                            >
                              CLAIM
                            </button>
                          ) : (
                            <div className="text-sm text-gray-300 ml-2 font-bold">
                              {currentProgress}/{target}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <div className="mt-3 text-center">
                  <Link href="/quests" className="pixel-button text-sm px-4 py-2 inline-block" style={{color: '#e8f4f8'}}>
                    VIEW ALL QUESTS
                  </Link>
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/packs" className="pixel-button p-4 block text-center hover:scale-105 transition-transform" style={{color: '#e8f4f8'}}>
                  <div>
                    <div className="w-10 h-10 text-blue-500 border-2 border-blue-300 mx-auto mb-3 flex items-center justify-center font-bold text-lg" style={{background: '#e8f4f8'}}>P</div>
                    <h3 className="text-base font-bold uppercase tracking-wide mb-2">OPEN PACKS</h3>
                    <p className="text-sm opacity-90 uppercase">REVEAL NEW CARDS</p>
                  </div>
                </Link>

                <Link href="/quests" className="pixel-button-green p-4 block text-center hover:scale-105 transition-transform" style={{color: '#e8f4f8'}}>
                  <div>
                    <div className="w-10 h-10 text-green-500 border-2 border-green-300 mx-auto mb-3 flex items-center justify-center font-bold text-lg" style={{background: '#e8f4f8'}}>Q</div>
                    <h3 className="text-base font-bold uppercase tracking-wide mb-2">QUESTS</h3>
                    <p className="text-sm opacity-90 uppercase">COMPLETE MISSIONS</p>
                  </div>
                </Link>

                <Link href="/cards" className="pixel-button-purple p-4 block text-center hover:scale-105 transition-transform" style={{color: '#e8f4f8'}}>
                  <div>
                    <div className="w-10 h-10 text-purple-500 border-2 border-purple-300 mx-auto mb-3 flex items-center justify-center font-bold text-lg" style={{background: '#e8f4f8'}}>C</div>
                    <h3 className="text-base font-bold uppercase tracking-wide mb-2">CARDS & DECKS</h3>
                    <p className="text-sm opacity-90 uppercase">BUILD YOUR TEAM</p>
                  </div>
                </Link>

                <Link href="/adventures" className="pixel-button-red p-4 block text-center hover:scale-105 transition-transform" style={{color: '#e8f4f8'}}>
                  <div>
                    <div className="w-10 h-10 text-red-500 border-2 border-red-300 mx-auto mb-3 flex items-center justify-center font-bold text-lg" style={{background: '#e8f4f8'}}>A</div>
                    <h3 className="text-base font-bold uppercase tracking-wide mb-2">ADVENTURES</h3>
                    <p className="text-sm opacity-90 uppercase">BATTLE & EARN</p>
                  </div>
                </Link>
              </div>

              {/* Connected Address - Only show when connected */}
              {connectedAddress && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-700 mb-2 uppercase tracking-wide font-bold">CONNECTED WALLET</p>
                  <div className="pixel-panel-light p-3 inline-block">
                    <Address address={connectedAddress} />
                  </div>
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