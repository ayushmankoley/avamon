import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useState, useEffect } from "react";

export interface Adventure {
  id: bigint;
  name: string;
  description: string;
  entryFee: bigint;
  minReward: bigint;
  maxReward: bigint;
  duration: bigint;
  packDropChance: bigint;
  packTypeId: bigint;
  isActive: boolean;
}

export interface ActiveAdventure {
  adventureId: bigint;
  startTime: bigint;
  avamonIds: readonly bigint[];
  vrfRequestId: bigint;
  isCompleted: boolean;
  rewardClaimed: boolean;
}

export function useAdventures() {
  const { address } = useAccount();
  const [availableAdventures, setAvailableAdventures] = useState<Adventure[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get next adventure ID to know how many adventures exist
  const {
    data: nextAdventureId,
    isLoading: nextIdLoading,
    error: nextIdError
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "nextAdventureId",
  });

  // Get active adventure IDs for the user
  const {
    data: activeAdventureIds,
    isLoading: activeIdsLoading,
    error: activeIdsError,
    refetch: refetchActiveIds
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getActiveAdventures",
    args: address ? [address] : undefined,
  });

  // Listen for adventure-related events
  const { data: adventureJoinedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureJoined",
    fromBlock: -1000,
    watch: true,
  });

  const { data: adventureCompletedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureCompleted",
    fromBlock: -1000,
    watch: true,
  });

  // Get individual adventure data
  const { data: adventure1 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [1n],
  });

  const { data: adventure2 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [2n],
  });

  const { data: adventure3 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [3n],
  });

  const { data: adventure4 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [4n],
  });

  const { data: adventure5 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [5n],
  });

  const { data: adventure6 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [6n],
  });

  // Update available adventures when data changes
  useEffect(() => {
    const adventures: Adventure[] = [];
    const allAdventures = [adventure1, adventure2, adventure3, adventure4, adventure5, adventure6];

    allAdventures.forEach((adventure, index) => {
      if (adventure && adventure.isActive) {
        adventures.push(adventure as Adventure);
      }
    });

    setAvailableAdventures(adventures);
  }, [adventure1, adventure2, adventure3, adventure4, adventure5, adventure6]);

  // Refresh active adventures when events occur
  useEffect(() => {
    if (adventureJoinedEvents || adventureCompletedEvents) {
      refetchActiveIds();
    }
  }, [adventureJoinedEvents, adventureCompletedEvents, refetchActiveIds]);

  // Set loading and error states
  useEffect(() => {
    setIsLoading(nextIdLoading || activeIdsLoading);
    const activeError = nextIdError || activeIdsError;
    setError(activeError ? String(activeError) : null);
  }, [nextIdLoading, activeIdsLoading, nextIdError, activeIdsError]);

  return {
    availableAdventures,
    activeAdventureIds: (activeAdventureIds as readonly bigint[]) || [],
    isLoading,
    error,
  };
}

export function useAdventure(adventureId: bigint) {
  const {
    data: adventure,
    isLoading,
    error
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getAdventure",
    args: [adventureId],
  });

  return {
    adventure: adventure as Adventure | undefined,
    isLoading,
    error: error ? String(error) : null,
  };
}

export function useActiveAdventure(adventureId: bigint) {
  const { address } = useAccount();

  const {
    data: activeAdventure,
    isLoading,
    error,
    refetch
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "activeAdventures",
    args: address && adventureId ? [address, adventureId] : undefined,
  });

  // Listen for completion events
  const { data: completionEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureCompleted",
    fromBlock: -1000,
    watch: true,
  });

  // Refresh when adventure is completed
  useEffect(() => {
    if (completionEvents) {
      const relevantEvent = completionEvents.find(
        (event: any) => event.args?.adventureId === adventureId
      );
      if (relevantEvent) {
        refetch();
      }
    }
  }, [completionEvents, adventureId, refetch]);

  return {
    activeAdventure: activeAdventure as ActiveAdventure | undefined,
    isLoading,
    error: error ? String(error) : null,
  };
}

export function useAdventureActions() {
  const { address } = useAccount();
  const { writeContractAsync: writeAvamonCoreAsync } = useScaffoldWriteContract("AvamonCore");
  const { writeContractAsync: writeAvamonTokenAsync } = useScaffoldWriteContract("AvamonToken");

  const joinAdventure = async (adventureId: bigint, avamonIds: bigint[]) => {
    if (!address) throw new Error("No wallet connected");

    try {
      await writeAvamonCoreAsync({
        functionName: "joinAdventure",
        args: [adventureId, avamonIds],
      });

      return { success: true };
    } catch (error) {
      console.error("Error joining adventure:", error);
      throw error;
    }
  };

  const startClaimAdventure = async (adventureId: bigint) => {
    if (!address) throw new Error("No wallet connected");

    try {
      await writeAvamonCoreAsync({
        functionName: "startClaimAdventure",
        args: [adventureId],
      });

      return { success: true };
    } catch (error) {
      console.error("Error starting adventure claim:", error);
      throw error;
    }
  };

  return {
    joinAdventure,
    startClaimAdventure,
  };
}
