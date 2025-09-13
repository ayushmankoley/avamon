import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useState, useEffect } from "react";

export interface Quest {
  id: string;
  type: 'daily_checkin' | 'win_battles' | 'open_packs' | 'custom';
  title: string;
  description: string;
  reward: {
    type: 'pack' | 'tokens';
    amount: number;
    packTypeId?: number;
  };
  requirements: {
    action: string;
    target: number;
  };
  timeWindow: {
    start: number;
    end: number;
  };
  isActive: boolean;
}

export interface UserQuestProgress {
  questId: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  lastUpdated: number;
}

export interface QuestSystemState {
  availableQuests: Quest[];
  userProgress: UserQuestProgress[];
  dailyResetTime: number;
  weeklyResetTime: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Quest System Implementation Plan
 *
 * When contracts are deployed, this system will work as follows:
 *
 * 1. **On-Chain Quest Storage:**
 *    - Quests are stored in the AvamonCore contract
 *    - Each quest has an ID, type, requirements, rewards, and time windows
 *    - Quest types: daily_checkin, win_battles, open_packs, custom
 *
 * 2. **User Progress Tracking:**
 *    - User quest progress is stored on-chain per user
 *    - Progress is updated when relevant actions occur (battles won, packs opened, etc.)
 *    - Daily quests reset every 24 hours, weekly quests reset every 7 days
 *
 * 3. **Reward Claiming:**
 *    - Users can claim rewards once quests are completed
 *    - Rewards are minted/transferred immediately upon claim
 *    - Quest status is updated to prevent double claiming
 *
 * 4. **Quest Types:**
 *    - Daily Check-in: Guaranteed pack reward, resets daily
 *    - Win Battles: Complete X adventure missions
 *    - Open Packs: Open X booster packs
 *    - Custom: Admin-defined quests with custom requirements
 */

export function useQuestSystem() {
  const { address } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCore");

  const [questState, setQuestState] = useState<QuestSystemState>({
    availableQuests: [],
    userProgress: [],
    dailyResetTime: 0,
    weeklyResetTime: 0,
    isLoading: true,
    error: null,
  });

  // Get quest data from contracts
  const { data: quest1 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getQuest",
    args: [1n],
  });

  const { data: quest2 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getQuest",
    args: [2n],
  });

  const { data: quest3 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getQuest",
    args: [3n],
  });

  const { data: quest4 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getQuest",
    args: [4n],
  });

  const { data: quest5 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getQuest",
    args: [5n],
  });

  // Get user quest progress - only fetch if address is available
  const { data: userProgress1 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getUserQuestProgress",
    args: [address || "0x0000000000000000000000000000000000000000", 1n],
  });

  const { data: userProgress2 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getUserQuestProgress",
    args: [address || "0x0000000000000000000000000000000000000000", 2n],
  });

  const { data: userProgress3 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getUserQuestProgress",
    args: [address || "0x0000000000000000000000000000000000000000", 3n],
  });

  const { data: userProgress4 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getUserQuestProgress",
    args: [address || "0x0000000000000000000000000000000000000000", 4n],
  });

  const { data: userProgress5 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getUserQuestProgress",
    args: [address || "0x0000000000000000000000000000000000000000", 5n],
  });

  // Convert contract data to quest format
  useEffect(() => {
    const quests = [quest1, quest2, quest3, quest4, quest5];
    const progressData = [userProgress1, userProgress2, userProgress3, userProgress4, userProgress5];

    // Process quest data - filter out null/undefined quests
    const validQuests = quests.filter(quest => quest && quest.id && quest.id !== 0n);
    
    if (validQuests.length > 0) {
      const availableQuests: Quest[] = validQuests.map((quest) => {
        if (!quest || !quest.id || quest.id === 0n) return null;
        
        const questType = Number(quest.questType || 0);
        const timeWindow = Number(quest.timeWindow || 1);
        
        return {
          id: quest.id.toString(),
          type: questType === 0 ? 'daily_checkin' : questType === 1 ? 'win_battles' : questType === 2 ? 'open_packs' : 'custom',
          title: quest.title || 'Unknown Quest',
          description: quest.description || 'No description available',
          reward: {
            type: quest.isPackReward ? 'pack' : 'tokens',
            amount: Number(quest.rewardAmount || 0),
            packTypeId: quest.isPackReward ? Number(quest.packTypeId || 1) : undefined,
          },
          requirements: {
            action: questType === 0 ? 'login' : questType === 1 ? 'adventure_complete' : 'pack_open',
            target: Number(quest.targetValue || 1),
          },
      timeWindow: {
        start: Math.floor(Date.now() / 1000),
            end: Math.floor(Date.now() / 1000) + (timeWindow * 24 * 60 * 60)
          },
          isActive: quest.isActive ?? true,
        };
      }).filter(Boolean) as Quest[];

      const userProgress: UserQuestProgress[] = validQuests.map((quest) => {
        if (!quest) {
          console.log("Quest is null/undefined");
          return {
            questId: "0",
            progress: 0,
      isCompleted: false,
      isClaimed: false,
            lastUpdated: 0,
          };
        }
        const questId = quest.id.toString();
        // Find matching progress data by questId
        const questIndex = parseInt(questId) - 1; // Quest IDs start from 1, array starts from 0
        const progress = questIndex >= 0 && questIndex < progressData.length ? progressData[questIndex] : null;

        // For daily check-in quest, check if user has logged in today
        // This is a special case - daily check-ins should complete when user first interacts
        if (questId === "1" && quest.targetValue === 1n) {
          // If no progress exists or progress is 0, user hasn't completed daily check-in
          // We'll handle this by allowing completion through a special function
          // For now, return actual progress from contract
        }

        if (!progress) {
          // No progress yet - return default values
          return {
            questId: questId,
            progress: 0,
      isCompleted: false,
      isClaimed: false,
            lastUpdated: 0,
          };
        }

        const progressValue = Number(progress.progress || 0);
        return {
          questId: questId,
          progress: progressValue,
          isCompleted: progress.isCompleted || false,
          isClaimed: progress.isClaimed || false,
          lastUpdated: Number(progress.lastUpdated || 0),
        };
      }).filter(p => p.questId !== "0");


    const now = Math.floor(Date.now() / 1000);
    setQuestState({
        availableQuests,
        userProgress,
      dailyResetTime: now + 24 * 60 * 60,
      weeklyResetTime: now + 7 * 24 * 60 * 60,
      isLoading: false,
      error: null,
    });
    } else {
      // No quest data available yet
      setQuestState(prev => ({
        ...prev,
        availableQuests: [],
        userProgress: [],
        isLoading: false,
        error: null,
      }));
    }
  }, [
    quest1?.id, quest1?.title, quest1?.isActive,
    quest2?.id, quest2?.title, quest2?.isActive,
    quest3?.id, quest3?.title, quest3?.isActive,
    quest4?.id, quest4?.title, quest4?.isActive,
    quest5?.id, quest5?.title, quest5?.isActive,
    userProgress1?.progress, userProgress1?.isCompleted, userProgress1?.isClaimed,
    userProgress2?.progress, userProgress2?.isCompleted, userProgress2?.isClaimed,
    userProgress3?.progress, userProgress3?.isCompleted, userProgress3?.isClaimed,
    userProgress4?.progress, userProgress4?.isCompleted, userProgress4?.isClaimed,
    userProgress5?.progress, userProgress5?.isCompleted, userProgress5?.isClaimed,
  ]);

  // Listen for quest-related events (when contracts are deployed)
  const { data: questCompletedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "QuestCompleted", // This event would need to be added to the contract
    watch: true,
  });

  const { data: questClaimedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "QuestRewardClaimed", // This event would need to be added to the contract
    watch: true,
  });

  // Update progress when events occur
  useEffect(() => {
    if (questCompletedEvents || questClaimedEvents) {
      // Refresh quest progress from contract
      refreshQuestProgress();
    }
  }, [questCompletedEvents?.length, questClaimedEvents?.length]);

  const refreshQuestProgress = async () => {
    try {
      // This would call contract functions to get updated quest progress
      // For now, it's a placeholder
      console.log("Refreshing quest progress...");
    } catch (error) {
      console.error("Error refreshing quest progress:", error);
      setQuestState(prev => ({ ...prev, error: "Failed to refresh quest progress" }));
    }
  };

  const claimQuestReward = async (questId: string) => {
    if (!address) throw new Error("No wallet connected");

    try {
      // Special handling for daily check-in quest (ID 1)
      if (questId === "1") {
        // Use the new completeDailyCheckin function that completes and claims in one transaction
        await writeContractAsync({
          functionName: "completeDailyCheckin",
          args: [],
        });
        console.log("Daily check-in completed and claimed successfully!");
      } else {
        // For other quests, use the regular claimQuestReward function
      await writeContractAsync({
        functionName: "claimQuestReward",
          args: [BigInt(questId)],
      });
      }

      // Update local state
      setQuestState(prev => ({
        ...prev,
        userProgress: prev.userProgress.map(progress =>
          progress.questId === questId
            ? { ...progress, progress: 1, isCompleted: true, isClaimed: true }
            : progress
        ),
      }));

      return { success: true };
    } catch (error) {
      console.error("Error claiming quest reward:", error);
      throw error;
    }
  };

  const buyWeeklyQuestSlot = async () => {
    if (!address) throw new Error("No wallet connected");

    try {
      // This would call the contract's buyWeeklyQuestSlot function
      await writeContractAsync({
        functionName: "buyWeeklyQuestSlot",
      });

      return { success: true };
    } catch (error) {
      console.error("Error buying weekly quest slot:", error);
      throw error;
    }
  };

  const getQuestStats = () => {
    const completedQuests = questState.userProgress.filter(q => q.isCompleted).length;
    const claimedRewards = questState.userProgress.filter(q => q.isClaimed).length;
    const activeQuests = questState.availableQuests.filter(q => q.isActive).length;

    return {
      completedQuests,
      claimedRewards,
      activeQuests,
      completionRate: activeQuests > 0 ? (completedQuests / activeQuests) * 100 : 0,
    };
  };

  return {
    ...questState,
    claimQuestReward,
    buyWeeklyQuestSlot,
    refreshQuestProgress,
    getQuestStats,
  };
}

/**
 * Contract Implementation Requirements:
 *
 * The AvamonCore contract would need these additional functions and events:
 *
 * Functions:
 * - function createQuest(string memory _type, string memory _title, ...) external onlyOwner
 * - function updateQuestProgress(address _user, string memory _questId, uint256 _progress) internal
 * - function claimQuestReward(string memory _questId) external
 * - function buyWeeklyQuestSlot() external payable
 * - function getUserQuestProgress(address _user, string memory _questId) external view returns (...)
 * - function getAvailableQuests() external view returns (Quest[] memory)
 *
 * Events:
 * - event QuestCompleted(address indexed user, string questId, uint256 rewardAmount);
 * - event QuestRewardClaimed(address indexed user, string questId, uint256 rewardAmount);
 * - event WeeklyQuestSlotPurchased(address indexed user, uint256 cost);
 *
 * Storage:
 * - mapping(string => Quest) public quests;
 * - mapping(address => mapping(string => UserQuestProgress)) public userQuestProgress;
 * - mapping(address => uint256) public weeklyQuestSlots;
 */
