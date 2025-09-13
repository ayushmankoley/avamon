import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { useScaffoldContract } from "./useScaffoldContract";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useState, useEffect } from "react";

export interface PlayerStats {
  avamonBalance: bigint;
  energyRemaining: number;
  maxDeckSlots: number;
  totalAvamons: number;
  unopenedPacks: number;
  lastEnergyReset: number;
  energyRefillCost: bigint;
  deckSlotUpgradeCost: bigint;
  isLoading: boolean;
  error: string | null;
}

export function usePlayerStats() {
  const { address } = useAccount();
  const [totalAvamons, setTotalAvamons] = useState<number>(0);
  const [unopenedPacks, setUnopenedPacks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get AvamonToken balance
  const {
    data: avamonBalance,
    isLoading: balanceLoading,
    error: balanceError
  } = useScaffoldReadContract({
    contractName: "AvamonToken",
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get current energy
  const {
    data: energyRemaining,
    isLoading: energyLoading,
    error: energyError,
    refetch: refetchEnergy
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getCurrentEnergy",
    args: address ? [address] : undefined,
  });

  // Get max deck slots
  const {
    data: maxDeckSlots,
    isLoading: deckSlotsLoading,
    error: deckSlotsError
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "maxDeckSlots",
    args: address ? [address] : undefined,
  });

  // Get last energy reset time (this function might not exist, so we'll mock it)
  const [lastEnergyReset, setLastEnergyReset] = useState<bigint>(0n);
  const [resetTimeLoading, setResetTimeLoading] = useState<boolean>(false);
  const [resetTimeError, setResetTimeError] = useState<any>(null);

  // Get AvamonCards contract
  const { data: avamonCardsContract } = useScaffoldContract({
    contractName: "AvamonCards",
  });

  // Get AvamonPacks contract
  const { data: avamonPacksContract } = useScaffoldContract({
    contractName: "AvamonPacks",
  });

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

  // Listen for card minting events
  const { data: cardMintedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCards",
    eventName: "CardMinted",
    fromBlock: -1000,
    watch: true,
  });

  // Listen for pack-related events
  const { data: packMintedEvents } = useScaffoldEventHistory({
    contractName: "AvamonPacks",
    eventName: "PackMinted",
    fromBlock: -1000,
    watch: true,
  });

  const { data: packOpenedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "PackOpened",
    fromBlock: -1000,
    watch: true,
  });

  // Calculate total Avamons owned by this address
  useEffect(() => {
    if (cardMintedEvents && address) {
      const ownedCards = cardMintedEvents.filter(
        (event: any) => event.args?.to?.toLowerCase() === address.toLowerCase()
      );
      setTotalAvamons(ownedCards.length);
    }
  }, [cardMintedEvents, address]);

  // Calculate unopened packs
  useEffect(() => {
    if (packMintedEvents && packOpenedEvents && address) {
      const mintedPacks = packMintedEvents.filter(
        (event: any) => event.args?.to?.toLowerCase() === address.toLowerCase()
      );

      const openedPacks = packOpenedEvents.filter(
        (event: any) => event.args?.player?.toLowerCase() === address.toLowerCase()
      );

      const unopenedCount = mintedPacks.length - openedPacks.length;
      setUnopenedPacks(Math.max(0, unopenedCount));
    }
  }, [packMintedEvents, packOpenedEvents, address]);

  // Refresh energy when events occur
  useEffect(() => {
    if (energyEvents || adventureEvents) {
      refetchEnergy();
    }
  }, [energyEvents, adventureEvents, refetchEnergy]);

  // Set loading and error states
  useEffect(() => {
    const loadingStates = [balanceLoading, energyLoading, deckSlotsLoading];
    const errorStates = [balanceError, energyError, deckSlotsError];

    setIsLoading(loadingStates.some(loading => loading));

    const activeError = errorStates.find(error => error);
    setError(activeError ? String(activeError) : null);
  }, [balanceLoading, energyLoading, deckSlotsLoading, balanceError, energyError, deckSlotsError]);

  // Constants from contract
  const ENERGY_REFILL_COST = 10000000000000000n; // 0.01 AVAX in wei
  const DECK_SLOT_UPGRADE_COST = 100000000000000000n; // 0.1 AVAX in wei

  return {
    avamonBalance: avamonBalance || 0n,
    energyRemaining: Number(energyRemaining || 0),
    maxDeckSlots: Number(maxDeckSlots || 2),
    totalAvamons,
    unopenedPacks,
    lastEnergyReset: Number(lastEnergyReset || 0),
    energyRefillCost: ENERGY_REFILL_COST,
    deckSlotUpgradeCost: DECK_SLOT_UPGRADE_COST,
    isLoading,
    error,
  };
}
