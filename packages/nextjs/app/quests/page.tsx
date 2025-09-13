"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  GiftIcon,
  StarIcon,
  FireIcon
} from "@heroicons/react/24/outline";
import { useScaffoldWriteContract, useQuestSystem } from "~~/hooks/scaffold-eth";

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: {
    type: 'pack' | 'tokens';
    amount: number;
  };
  progress: number;
  target: number;
  isCompleted: boolean;
  isClaimed: boolean;
  timeRemaining?: string;
}

const Quests = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCore");
  const { availableQuests, userProgress, claimQuestReward, isLoading, error } = useQuestSystem();

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Helper function to format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Convert quest system data to page format
  const convertToPageQuest = (quest: any, progress: any): Quest => ({
    id: quest.id,
    title: quest.title,
    description: quest.description,
    reward: quest.reward,
    progress: progress?.progress || 0,
    target: quest.requirements.target,
    isCompleted: progress?.isCompleted || false,
    isClaimed: progress?.isClaimed || false,
    timeRemaining: quest.timeWindow.end > Math.floor(Date.now() / 1000)
      ? formatTimeRemaining(quest.timeWindow.end - Math.floor(Date.now() / 1000))
      : undefined,
  });

  // Filter quests by type from contract data
  const dailyQuests: Quest[] = availableQuests
    .filter(quest => quest.timeWindow.end - quest.timeWindow.start <= 24 * 60 * 60)
    .map(quest => {
      const progress = userProgress.find(p => p.questId === quest.id);
      return convertToPageQuest(quest, progress);
    });

  const weeklyQuests: Quest[] = availableQuests
    .filter(quest => quest.timeWindow.end - quest.timeWindow.start > 24 * 60 * 60)
    .map(quest => {
      const progress = userProgress.find(p => p.questId === quest.id);
      return convertToPageQuest(quest, progress);
    });

  const handleClaimReward = async (questId: string) => {
    try {
      await claimQuestReward(questId);
      alert("Quest reward claimed successfully!");
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Failed to claim reward");
    }
  };

  const handleBuyWeeklyQuest = () => {
    // Buy extra weekly quest logic would go here
    alert("Buy extra weekly quest functionality would be implemented here");
  };

  const QuestCard = ({ quest }: { quest: Quest }) => {
    const progressPercentage = (quest.progress / quest.target) * 100;

    return (
      <div className={`bg-base-100 rounded-lg p-6 shadow-lg border-2 transition-all ${
        quest.isCompleted && !quest.isClaimed
          ? 'border-green-500 bg-green-50'
          : quest.isCompleted && quest.isClaimed
          ? 'border-gray-300 bg-gray-50'
          : 'border-base-300'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              {quest.isCompleted && quest.isClaimed && (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              )}
              {quest.isCompleted && !quest.isClaimed && (
                <StarIcon className="h-5 w-5 text-yellow-500" />
              )}
              {!quest.isCompleted && (
                <ClockIcon className="h-5 w-5 text-blue-500" />
              )}
              {quest.title}
            </h3>
            <p className="text-sm text-base-content/70 mt-1">{quest.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm">
              <GiftIcon className="h-4 w-4" />
              <span>
                {quest.reward.type === 'pack'
                  ? `${quest.reward.amount} Pack${quest.reward.amount > 1 ? 's' : ''}`
                  : `${quest.reward.amount} $AM`
                }
              </span>
            </div>
            {quest.timeRemaining && (
              <p className="text-xs text-base-content/50 mt-1">{quest.timeRemaining} left</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{quest.progress}/{quest.target}</span>
          </div>
          <div className="w-full bg-base-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                quest.isCompleted ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-end">
          {/* Special handling for daily check-in */}
          {quest.id === "1" ? (
            !quest.isClaimed ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleClaimReward(quest.id)}
              >
                Check In
              </button>
            ) : (
              <span className="text-sm text-green-600 font-medium">Checked In ✓</span>
            )
          ) : quest.isCompleted && !quest.isClaimed ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleClaimReward(quest.id)}
            >
              Claim Reward
            </button>
          ) : quest.isCompleted && quest.isClaimed ? (
            <span className="text-sm text-green-600 font-medium">Claimed ✓</span>
          ) : (
            <span className="text-sm text-base-content/50">In Progress</span>
          )}
        </div>
      </div>
    );
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70">Please connect your wallet to view quests</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-base-content/70">Loading quests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-error">Error Loading Quests</h2>
          <p className="text-base-content/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Quests & Missions</h1>
        <p className="text-base-content/70">Complete quests to earn rewards and progress in Avamon TCG</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-base-200 p-1 rounded-lg">
          <button
            className={`px-6 py-3 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'daily' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            <FireIcon className="h-4 w-4" />
            Daily Quests
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {dailyQuests.filter(q => q.isCompleted && !q.isClaimed).length}
            </span>
          </button>
          <button
            className={`px-6 py-3 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'weekly' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setActiveTab('weekly')}
          >
            <TrophyIcon className="h-4 w-4" />
            Weekly Quests
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {weeklyQuests.filter(q => q.isCompleted && !q.isClaimed).length}
            </span>
          </button>
        </div>
      </div>

      {/* Daily Quests */}
      {activeTab === 'daily' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Daily Quests</h2>
              <p className="text-base-content/70">Reset daily at 5:30 IST</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-base-content/70">Progress</p>
              <p className="text-lg font-bold">
                {dailyQuests.filter(q => q.isCompleted).length}/{dailyQuests.length}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {dailyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Quests */}
      {activeTab === 'weekly' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Weekly Quests</h2>
              <p className="text-base-content/70">Higher rewards, harder challenges</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-base-content/70">Progress</p>
                <p className="text-lg font-bold">
                  {weeklyQuests.filter(q => q.isCompleted).length}/{weeklyQuests.length}
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleBuyWeeklyQuest}
              >
                + Buy Extra Quest (0.05 AVAX)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      {/* Quest Statistics */}
      <div className="mt-12 bg-base-100 rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Quest Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {dailyQuests.filter(q => q.isClaimed).length + weeklyQuests.filter(q => q.isClaimed).length}
            </div>
            <p className="text-sm text-base-content/70">Quests Completed</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {dailyQuests.filter(q => q.isCompleted && !q.isClaimed).length +
               weeklyQuests.filter(q => q.isCompleted && !q.isClaimed).length}
            </div>
            <p className="text-sm text-base-content/70">Rewards Available</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500">
              {dailyQuests.filter(q => !q.isCompleted).length +
               weeklyQuests.filter(q => !q.isCompleted).length}
            </div>
            <p className="text-sm text-base-content/70">Active Quests</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quests;
