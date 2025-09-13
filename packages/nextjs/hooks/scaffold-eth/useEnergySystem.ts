import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useState, useEffect } from "react";

export interface EnergyInfo {
  currentEnergy: number;
  maxEnergy: number;
  lastResetTime: number;
  timeUntilReset: number;
  canReset: boolean;
  refillCost: bigint;
  isLoading: boolean;
  error: string | null;
}

export function useEnergySystem() {
  const { address } = useAccount();
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_ENERGY = 10;
  const RESET_INTERVAL = 24 * 60 * 60; // 24 hours in seconds
  const ENERGY_REFILL_COST = 10000000000000000n; // 0.01 AVAX in wei

  // Get current energy
  const {
    data: currentEnergy,
    isLoading: energyLoading,
    error: energyError,
    refetch: refetchEnergy
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getCurrentEnergy",
    args: address ? [address] : undefined,
  });

  // Get last energy reset time from contract
  const {
    data: lastResetTime,
    isLoading: resetTimeLoading,
    error: resetTimeError,
    refetch: refetchResetTime
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "lastEnergyResetIST",
    args: address ? [address] : undefined,
  });

  // Write contract for purchasing energy
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCore");

  // Listen for energy-related events
  const { data: energyEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "EnergyPurchased",
    fromBlock: -1000,
    watch: true,
  });

  const { data: adventureEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureJoined",
    fromBlock: -1000,
    watch: true,
  });

  // Calculate time until next reset
  useEffect(() => {
    if (lastResetTime) {
      const now = Math.floor(Date.now() / 1000);
      const lastReset = Number(lastResetTime);
      const nextReset = lastReset + RESET_INTERVAL;
      const timeLeft = Math.max(0, nextReset - now);
      setTimeUntilReset(timeLeft);
    }
  }, [lastResetTime]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Refresh energy when events occur
  useEffect(() => {
    if (energyEvents || adventureEvents) {
      refetchEnergy();
      refetchResetTime();
    }
  }, [energyEvents, adventureEvents, refetchEnergy, refetchResetTime]);

  // Set loading and error states
  useEffect(() => {
    setIsLoading(energyLoading || resetTimeLoading);
    const activeError = energyError || resetTimeError;
    setError(activeError ? String(activeError) : null);
  }, [energyLoading, resetTimeLoading, energyError, resetTimeError]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Ready to reset";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Purchase energy function
  const purchaseEnergy = async (amount: number) => {
    if (!address) throw new Error("No wallet connected");

    try {
      const totalCost = BigInt(amount) * ENERGY_REFILL_COST;

      await writeContractAsync({
        functionName: "purchaseEnergy",
        args: [BigInt(amount)],
        value: totalCost,
      });

      // Refresh energy after purchase
      await refetchEnergy();

      return { success: true };
    } catch (error) {
      console.error("Error purchasing energy:", error);
      throw error;
    }
  };

  // Calculate if energy can be reset (24 hours passed)
  const canReset = timeUntilReset === 0;

  return {
    currentEnergy: Number(currentEnergy || 0),
    maxEnergy: MAX_ENERGY,
    lastResetTime: Number(lastResetTime || 0),
    timeUntilReset,
    canReset,
    refillCost: ENERGY_REFILL_COST,
    isLoading,
    error,
    formatTimeRemaining,
    purchaseEnergy,
  };
}

// Hook for energy countdown display
export function useEnergyCountdown() {
  const { timeUntilReset, formatTimeRemaining } = useEnergySystem();

  return {
    timeRemaining: timeUntilReset,
    formattedTime: formatTimeRemaining(timeUntilReset),
    isReady: timeUntilReset === 0,
  };
}
