import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "./";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useState, useEffect } from "react";

import { AvamonCard } from "./usePlayerCards";

export interface PlayerDeckBuilder {
  avamonIds: readonly bigint[];
  name: string;
  createdAt: number;
  lastModified: number;
}

export interface DeckBuilderState {
  ownedCards: AvamonCard[];
  savedDecks: PlayerDeckBuilder[];
  maxDeckSlots: number;
  currentDeck: bigint[];
  selectedDeckIndex: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Deck Builder Implementation Plan
 *
 * When contracts are deployed, this system will work as follows:
 *
 * 1. **Card Ownership Verification:**
 *    - Check which AvamonCards the user owns using ERC721 ownerOf
 *    - Fetch card stats from AvamonCards contract
 *    - Verify cards are not locked in active adventures
 *
 * 2. **Deck Management:**
 *    - Save/load decks to/from AvamonCore contract
 *    - Track deck slots (2 default, upgradable to 3)
 *    - Validate deck composition (exactly 4 cards)
 *
 * 3. **Real-time Updates:**
 *    - Listen for card minting events to update owned cards
 *    - Listen for deck saving events to update saved decks
 *    - Refresh when adventure states change (locked cards)
 */

export function useDeckBuilder() {
  const { address } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonCore");

  const [deckState, setDeckState] = useState<DeckBuilderState>({
    ownedCards: [],
    savedDecks: [],
    maxDeckSlots: 2,
    currentDeck: [],
    selectedDeckIndex: 0,
    isLoading: true,
    error: null,
  });

  // Get max deck slots
  const {
    data: maxDeckSlots,
    isLoading: slotsLoading,
    error: slotsError
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "maxDeckSlots",
    args: address ? [address] : undefined,
  });

  // Get saved decks
  const {
    data: savedDecks,
    isLoading: decksLoading,
    error: decksError,
    refetch: refetchDecks
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getSavedDecks",
    args: address ? [address] : undefined,
  });

  // Listen for card minting events
  const { data: cardMintedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCards",
    eventName: "CardMinted",
    fromBlock: -1000,
    watch: true,
  });

  // Listen for deck saving events
  const { data: deckSavedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "DeckSaved",
    fromBlock: -1000,
    watch: true,
  });

  // Listen for adventure events (cards might be locked)
  const { data: adventureEvents } = useScaffoldEventHistory({
    contractName: "AvamonCore",
    eventName: "AdventureJoined",
    fromBlock: -1000,
    watch: true,
  });

  // Initialize with real data - no mock data
  useEffect(() => {
    if (!address) {
      setDeckState(prev => ({
        ...prev,
        ownedCards: [],
        maxDeckSlots: 2,
        savedDecks: [],
        isLoading: false,
      }));
      return;
    }

    // Set initial state with real contract data
    setDeckState(prev => ({
      ...prev,
      ownedCards: [], // Will be populated by usePlayerCards hook
      maxDeckSlots: Number(maxDeckSlots || 2),
      savedDecks: (savedDecks as PlayerDeckBuilder[]) || [],
      isLoading: false,
    }));
  }, [address, maxDeckSlots, savedDecks]);

  // Update when events occur
  useEffect(() => {
    if (cardMintedEvents || deckSavedEvents || adventureEvents) {
      // Refresh data when relevant events occur
      refetchDecks();
    }
  }, [cardMintedEvents, deckSavedEvents, adventureEvents, refetchDecks]);

  // Set loading and error states
  useEffect(() => {
    setDeckState(prev => ({
      ...prev,
      isLoading: slotsLoading || decksLoading,
      error: slotsError || decksError ? String(slotsError || decksError) : null,
    }));
  }, [slotsLoading, decksLoading, slotsError, decksError]);

  const saveDeck = async (deckIndex: number, name: string, avamonIds: bigint[]) => {
    if (!address) throw new Error("No wallet connected");
    if (avamonIds.length !== 4) throw new Error("Deck must contain exactly 4 cards");

    try {
      await writeContractAsync({
        functionName: "saveDeck",
        args: [BigInt(deckIndex), name, avamonIds],
      });

      // Update local state
      setDeckState(prev => ({
        ...prev,
        savedDecks: prev.savedDecks.map((deck, index) =>
          index === deckIndex
            ? { avamonIds, name, createdAt: Date.now(), lastModified: Date.now() }
            : deck
        ),
      }));

      return { success: true };
    } catch (error) {
      console.error("Error saving deck:", error);
      throw error;
    }
  };

  const loadDeck = (deckIndex: number) => {
    const deck = deckState.savedDecks[deckIndex];
    if (deck) {
      setDeckState(prev => ({
        ...prev,
        currentDeck: [...deck.avamonIds],
        selectedDeckIndex: deckIndex,
      }));
    }
  };

  const addCardToDeck = (tokenId: bigint) => {
    if (deckState.currentDeck.length >= 4) {
      throw new Error("Deck is already full (4 cards maximum)");
    }

    if (deckState.currentDeck.includes(tokenId)) {
      throw new Error("Card is already in the deck");
    }

    setDeckState(prev => ({
      ...prev,
      currentDeck: [...prev.currentDeck, tokenId],
    }));
  };

  const removeCardFromDeck = (tokenId: bigint) => {
    setDeckState(prev => ({
      ...prev,
      currentDeck: prev.currentDeck.filter(id => id !== tokenId),
    }));
  };

  const clearDeck = () => {
    setDeckState(prev => ({
      ...prev,
      currentDeck: [],
    }));
  };

  const upgradeDeckSlots = async () => {
    if (!address) throw new Error("No wallet connected");

    try {
      await writeContractAsync({
        functionName: "upgradeDeckSlots",
        args: [],
      });

      setDeckState(prev => ({
        ...prev,
        maxDeckSlots: 3,
      }));

      return { success: true };
    } catch (error) {
      console.error("Error upgrading deck slots:", error);
      throw error;
    }
  };

  const validateDeck = (avamonIds: bigint[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (avamonIds.length !== 4) {
      errors.push("Deck must contain exactly 4 cards");
    }

    // Check if all cards are owned
    const unownedCards = avamonIds.filter(id =>
      !deckState.ownedCards.some(card => card.tokenId === id)
    );
    if (unownedCards.length > 0) {
      errors.push(`You don't own cards: ${unownedCards.join(", ")}`);
    }

    // Check for duplicates
    const uniqueIds = new Set(avamonIds);
    if (uniqueIds.size !== avamonIds.length) {
      errors.push("Deck cannot contain duplicate cards");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    ...deckState,
    saveDeck,
    loadDeck,
    addCardToDeck,
    removeCardFromDeck,
    clearDeck,
    upgradeDeckSlots,
    validateDeck,
  };
}

/**
 * Contract Implementation Requirements:
 *
 * The AvamonCore contract needs these functions for deck management:
 *
 * Functions:
 * - function saveDeck(uint256 _deckIndex, string memory _name, uint256[] memory _avamonIds) external
 * - function getSavedDecks(address _player) external view returns (PlayerDeck[] memory)
 * - function upgradeDeckSlots() external payable
 * - function maxDeckSlots(address _player) external view returns (uint256)
 *
 * Events:
 * - event DeckSaved(address indexed player, uint256 deckIndex, string name);
 * - event DeckSlotUpgraded(address indexed player, uint256 newMaxSlots);
 *
 * Storage:
 * - mapping(address => PlayerDeck[]) public savedDecks;
 * - mapping(address => uint256) public maxDeckSlots;
 *
 * Additional validation in saveDeck:
 * - Check that player owns all Avamon cards
 * - Check that cards are not locked in active adventures
 * - Validate deck size (exactly 4 cards)
 */
