import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "./useScaffoldWriteContract";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useScaffoldContract } from "./useScaffoldContract";
import { useState, useEffect, useMemo, useCallback } from "react";

export interface PackOpeningResult {
  packId: bigint;
  avamonIds: readonly bigint[];
  isCompleted: boolean;
}

export interface PackOpeningState {
  isOpening: boolean;
  currentPackId: bigint | null;
  openingResult: PackOpeningResult | null;
  timeRemaining: number;
  error: string | null;
}

export function usePackOpening() {
  const { address } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonPackOpener");

  const [openingState, setOpeningState] = useState<PackOpeningState>({
    isOpening: false,
    currentPackId: null,
    openingResult: null,
    timeRemaining: 0,
    error: null,
  });

  // Listen for pack opening events
  const { data: packOpenedEvents } = useScaffoldEventHistory({
    contractName: "AvamonPackOpener",
    eventName: "PackOpened",
    fromBlock: 0n, // Get all historical events
    watch: true,
  });

  // Listen for VRF fulfillment events (if available)
  const { data: vrfEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureCompleted", // This might need to be adjusted based on VRF events
    fromBlock: BigInt(-1000),
    watch: true,
  });

  // Memoize events to prevent infinite re-renders
  const memoizedPackEvents = useMemo(() => {
    if (packOpenedEvents && packOpenedEvents.length > 0) {
      console.log(`📦 PackOpened events loaded: ${packOpenedEvents.length} total events`);
      console.log("📦 Latest pack events:", packOpenedEvents.slice(-3).map(e => ({
        user: e.args?.user,
        packId: e.args?.packId?.toString(),
        cardIds: e.args?.cardIds?.map(id => id.toString())
      })));
    } else {
      console.log("📦 No PackOpened events loaded yet");
    }
    return packOpenedEvents;
  }, [packOpenedEvents?.length]);

  // Update opening state when events occur
  useEffect(() => {
    if (memoizedPackEvents && memoizedPackEvents.length > 0 && address) {
      // Look for the most recent pack opening event for this user
      const userEvents = memoizedPackEvents.filter(event => 
        event.args?.user?.toLowerCase() === address.toLowerCase()
      );
      
      if (userEvents.length > 0) {
        const latestEvent = userEvents[userEvents.length - 1];
        const cardIds = latestEvent.args?.cardIds || [];
        
        console.log(`🎉 Found pack opening event for user: packId=${latestEvent.args?.packId}, cards=${cardIds.length}`);

        setOpeningState(prev => ({
          ...prev,
          isOpening: false,
          openingResult: {
            packId: latestEvent.args?.packId || 0n,
            avamonIds: cardIds,
            isCompleted: true,
          },
          timeRemaining: 0,
          error: null,
        }));
      }
    }
  }, [memoizedPackEvents, address]);

  // Countdown timer for opening animation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (openingState.isOpening && openingState.timeRemaining > 0) {
      interval = setInterval(() => {
        setOpeningState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1),
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [openingState.isOpening, openingState.timeRemaining]);

  const openPack = async (packId: bigint) => {
    if (!address) {
      setOpeningState(prev => ({ ...prev, error: "No wallet connected" }));
      return;
    }

    try {
      setOpeningState({
        isOpening: true,
        currentPackId: packId,
        openingResult: null,
        timeRemaining: 10, // 10 seconds for VRF + animation
        error: null,
      });

      // Call the emergency pack opening function (bypasses VRF issues)
      // Note: This requires admin permissions. For testing, use emergencyMintPacks first
      await writeContractAsync({
        functionName: "emergencyOpenPack",
        args: [packId],
      });

      // The result will be handled by the event listener above

    } catch (error) {
      console.error("Error opening pack:", error);
      setOpeningState(prev => ({
        ...prev,
        isOpening: false,
        error: error instanceof Error ? error.message : "Failed to open pack",
      }));
    }
  };

  const resetOpeningState = () => {
    setOpeningState({
      isOpening: false,
      currentPackId: null,
      openingResult: null,
      timeRemaining: 0,
      error: null,
    });
  };

  return {
    openingState,
    openPack,
    resetOpeningState,
  };
}

// Hook for getting card details from token IDs using Scaffold hooks
export function useCardDetails(tokenIds: readonly bigint[]) {
  const [cardDetails, setCardDetails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get AvamonCards contract for reading card data
  const { data: avamonCardsContract } = useScaffoldContract({
    contractName: "AvamonCards",
  });

  // Get AvamonCore contract for reading template data
  const { data: avamonCoreContract } = useScaffoldContract({
    contractName: "AvamonCore",
  });

  // Create a stable string representation of tokenIds for dependency comparison
  const tokenIdsString = useMemo(() => {
    return tokenIds.map(id => id.toString()).join(',');
  }, [tokenIds]);

  // Memoize the fetchCardDetails function to prevent infinite re-renders
  const fetchCardDetails = useCallback(async () => {
    if (tokenIds.length === 0) {
      setCardDetails([]);
      setIsLoading(false);
      return;
    }

    if (!avamonCardsContract || !avamonCoreContract) {
      console.log("⏳ Contracts not ready yet, waiting...");
      setIsLoading(false);
      return;
    }

    console.log(`🔍 Fetching card details for ${tokenIds.length} cards:`, tokenIds.map(id => id.toString()));
    setIsLoading(true);
    setError(null);

    try {
      const details = [];

      // Fetch real card data from blockchain for each token ID
      for (const tokenId of tokenIds) {
        try {
          console.log(`📋 Fetching data for card ${tokenId}...`);
          
          // Get real card stats from the contract
          const cardStats = await avamonCardsContract.read.cardStats([tokenId]);
          console.log(`📊 Card ${tokenId} stats:`, {
            templateId: cardStats[0].toString(),
            attack: cardStats[1].toString(),
            rarity: cardStats[5].toString()
          });
          
          // Get template information from AvamonCore
          const templateId = cardStats[0]; // templateId from cardStats
          const templateData = await avamonCoreContract.read.getCardTemplate([templateId]);
          
          const cardDetail = {
            tokenId,
            templateId: templateId,
            name: templateData[1] || `Avamon #${tokenId}`, // Use template name if available
            rarity: Number(cardStats[5]), // rarity from cardStats
            attack: Number(cardStats[1]), // attack from cardStats
            defense: Number(cardStats[2]), // defense from cardStats
            agility: Number(cardStats[3]), // agility from cardStats
            hp: Number(cardStats[4]), // hp from cardStats
          };

          console.log(`✅ Card ${tokenId} details loaded:`, cardDetail);
          details.push(cardDetail);
        } catch (cardError) {
          console.error(`❌ Error fetching data for card ${tokenId}:`, cardError);
          
          // Fallback for this specific card if data fetch fails
          const fallbackDetail = {
            tokenId,
            templateId: 1n,
            name: `Avamon #${tokenId}`,
            rarity: 0,
            attack: 50,
            defense: 50,
            agility: 50,
            hp: 100,
          };
          details.push(fallbackDetail);
        }
      }

      console.log(`🎯 All card details loaded: ${details.length} cards`);
      setCardDetails(details);
    } catch (err) {
      console.error("❌ Error fetching card details:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch card details");

      // Fallback to basic data for all cards
      const fallbackDetails = tokenIds.map((tokenId) => ({
        tokenId,
        templateId: 1n,
        name: `Avamon #${tokenId}`,
        rarity: 0,
        attack: 50,
        defense: 50,
        agility: 50,
        hp: 100,
      }));
      setCardDetails(fallbackDetails);
    } finally {
      setIsLoading(false);
    }
  }, [tokenIdsString, avamonCardsContract, avamonCoreContract]); // Include contracts in dependencies

  // Get card details when tokenIds change
  useEffect(() => {
    fetchCardDetails();
  }, [fetchCardDetails]);

  return {
    cardDetails,
    isLoading,
    error,
  };
}
