import { useAccount } from "wagmi";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { useScaffoldContract } from "./useScaffoldContract";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";

export interface AvamonCard {
  tokenId: bigint;
  templateId: bigint;
  name: string;
  attack: number;
  defense: number;
  agility: number;
  hp: number;
  rarity: number; // 0: Common, 1: Rare, 2: Mythic
}

export interface CardTemplate {
  id: bigint;
  name: string;
  rarity: number;
  attack: number;
  defense: number;
  agility: number;
  hp: number;
  isActive: boolean;
}

// Cache for storing cards by address - using localStorage for persistence
const CACHE_KEY_PREFIX = 'avamon_cards_';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface CachedCardData {
  cards: AvamonCard[];
  timestamp: number;
  tokenIds: Set<string>;
}

// Helper functions for localStorage cache
const getCacheKey = (address: string) => `${CACHE_KEY_PREFIX}${address.toLowerCase()}`;

const loadFromCache = (address: string): CachedCardData | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(address));
    if (!cached) return null;

    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(address));
      return null;
    }

    // Convert tokenIds array back to Set
    data.tokenIds = new Set(data.tokenIds);

    // Convert string values back to BigInt
    data.cards = data.cards.map((card: any) => ({
      ...card,
      tokenId: BigInt(card.tokenId),
      templateId: BigInt(card.templateId),
    }));

    return data;
  } catch (error) {
    console.warn('Error loading from cache:', error);
    return null;
  }
};

const saveToCache = (address: string, cards: AvamonCard[], tokenIds: Set<string>) => {
  try {
    // Convert BigInt values to strings for JSON serialization
    const serializableCards = cards.map(card => ({
      ...card,
      tokenId: card.tokenId.toString(),
      templateId: card.templateId.toString(),
    }));

    const data = {
      cards: serializableCards,
      timestamp: Date.now(),
      tokenIds: Array.from(tokenIds), // Convert Set to Array for JSON
    };
    localStorage.setItem(getCacheKey(address), JSON.stringify(data));
    console.log(`💾 Saved ${cards.length} cards to cache for ${address}`);
  } catch (error) {
    console.warn('Error saving to cache:', error);
  }
};

const clearCache = (address: string) => {
  try {
    localStorage.removeItem(getCacheKey(address));
    console.log(`🗑️ Cleared cache for ${address}`);
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

export function usePlayerCards() {
  const { address } = useAccount();
  const [ownedCards, setOwnedCards] = useState<AvamonCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasCheckedCache, setHasCheckedCache] = useState<boolean>(false);

  // Get AvamonCards contract
  const { data: avamonCardsContract } = useScaffoldContract({
    contractName: "AvamonCards",
  });

  // Get AvamonCore contract for template data
  const { data: avamonCoreContract } = useScaffoldContract({
    contractName: "AvamonCore",
  });

  // Get total supply to know how many tokens exist
  // Note: Using a state variable since _nextTokenId might not be exposed
  const [maxTokenId, setMaxTokenId] = useState<bigint>(0n);

  // Track card ownership through CardMinted events for real-time updates
  const { data: cardMintedEvents } = useScaffoldEventHistory({
    contractName: "AvamonCards",
    eventName: "CardMinted",
    watch: true,
  });

  // Memoize events to prevent infinite re-renders
  const memoizedEvents = useMemo(() => cardMintedEvents, [cardMintedEvents?.length]);

  // Memoize the fetchOwnedCards function to prevent infinite re-renders
  const fetchOwnedCards = useCallback(async (forceRefresh = false) => {
    if (!address) {
      setOwnedCards([]);
      setIsLoading(false);
      setHasLoadedFromCache(false);
      setIsFetching(false);
      setHasCheckedCache(false);
      return;
    }

    // Prevent multiple concurrent fetches
    if (isFetching && !forceRefresh) {
      return;
    }

    // Skip if we already loaded from cache and not forcing refresh
    if (!forceRefresh && hasLoadedFromCache) {
      return;
    }

    if (!avamonCardsContract || !avamonCoreContract) {
      setIsLoading(false);
      return;
    }

    setIsFetching(true);

    setIsLoading(true);
    setError(null);
    console.log("🔍 Fetching owned cards for address:", address);

    try {
      const cards: AvamonCard[] = [];

      // Get all unique token IDs from events to check only existing tokens
      let tokenIdsToCheck: bigint[] = [];
      
      if (memoizedEvents && memoizedEvents.length > 0) {
        tokenIdsToCheck = memoizedEvents
          .map(event => event.args?.tokenId)
          .filter((id): id is bigint => id !== undefined)
          .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
          .sort((a, b) => Number(a - b)); // Sort numerically
        
        // Update maxTokenId for future reference
        if (tokenIdsToCheck.length > 0) {
          const highestToken = tokenIdsToCheck[tokenIdsToCheck.length - 1];
          setMaxTokenId(highestToken + 1n);
        }
      }
      
      // If no events found, try scanning a small range (maybe tokens were minted before we started watching)
      if (tokenIdsToCheck.length === 0) {
        console.log("🔍 No events found, scanning first 50 tokens...");
        tokenIdsToCheck = Array.from({ length: 15 }, (_, i) => BigInt(i));
      }
      
      console.log("📊 Token IDs to check:", tokenIdsToCheck.map(id => Number(id)));

      // Check only the tokens we know exist from events
      for (const tokenId of tokenIdsToCheck) {
        try {
          // Check if token exists and who owns it
          const owner = await avamonCardsContract.read.ownerOf([tokenId]);
          
          if (owner.toLowerCase() === address.toLowerCase()) {
            console.log(`✅ User owns token ${tokenId}`);
            
            // Get real card stats from the contract
            const cardStats = await avamonCardsContract.read.cardStats([tokenId]);
            
            // Get template information from AvamonCore
            const templateId = cardStats[0]; // templateId from cardStats
            
            // Try to get template name, fallback to token ID if not available
            let cardName = `Avamon #${tokenId}`;
            try {
              const templateData = await avamonCoreContract.read.getCardTemplate([templateId]);
              if (templateData && templateData[1]) {
                cardName = templateData[1]; // Use template name
              }
            } catch (templateError) {
              // Keep fallback name if template fetch fails
              console.warn(`Could not fetch template name for template ${templateId}:`, templateError);
            }
            
            // Create card with real blockchain data
          const card: AvamonCard = {
            tokenId: tokenId,
              templateId: templateId,
              name: cardName,
              attack: Number(cardStats[1]), // attack from cardStats
              defense: Number(cardStats[2]), // defense from cardStats
              agility: Number(cardStats[3]), // agility from cardStats
              hp: Number(cardStats[4]), // hp from cardStats
              rarity: Number(cardStats[5]), // rarity from cardStats
          };

          cards.push(card);
          }
        } catch (tokenError: unknown) {
          // Token doesn't exist or other error
          const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
          
          if (errorMessage.includes("ERC721NonexistentToken") || 
              errorMessage.includes("ERC721: invalid token ID") ||
              errorMessage.includes("nonexistent token")) {
            // Token doesn't exist - this shouldn't happen since we're checking from events
            console.warn(`Token ${tokenId} doesn't exist but was in events`);
            continue;
          } else {
            // Other error - log it but continue
            console.warn(`Error checking token ${tokenId}:`, tokenError);
            continue;
          }
        }
      }

      console.log(`🎯 Found ${cards.length} cards owned by user from blockchain`);

      // Save to cache
      const tokenIdsSet = new Set(tokenIdsToCheck.map(id => id.toString()));
      saveToCache(address, cards, tokenIdsSet);

      setOwnedCards(cards);
      setHasLoadedFromCache(true);
      console.log("✅ Cards saved to cache and state updated");
    } catch (err) {
      console.error("❌ Error fetching owned cards:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch owned cards");
      setOwnedCards([]);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [address, maxTokenId, memoizedEvents, hasLoadedFromCache, isFetching]); // Depend on address, maxTokenId, and events

  // Fetch from blockchain if no cache is available (only after cache check is complete)
  useEffect(() => {
    if (address && !hasCheckedCache && !isFetching && avamonCardsContract && avamonCoreContract) {
      console.log("🔍 Checking for cached cards...");
      setHasCheckedCache(true);

      // Check if cache exists before fetching from blockchain
      const cached = loadFromCache(address);
      if (cached) {
        console.log("📦 Loading cards from localStorage cache");
        setOwnedCards(cached.cards);
        setIsLoading(false);
        setHasLoadedFromCache(true);
      } else {
        console.log("💡 No cache found, fetching from blockchain...");
        fetchOwnedCards();
      }
    }
  }, [address, hasCheckedCache, isFetching, avamonCardsContract, avamonCoreContract, fetchOwnedCards]);

  // Handle wallet changes - reset cache state when wallet changes
  useEffect(() => {
    if (address) {
      setHasLoadedFromCache(false);
      setIsFetching(false);
      setHasCheckedCache(false);
      setError(null);
    } else {
      setOwnedCards([]);
      setIsLoading(false);
      setHasLoadedFromCache(false);
      setIsFetching(false);
      setHasCheckedCache(false);
    }
  }, [address]);

  // Automatically fetch cards when wallet reconnects (after state reset)
  useEffect(() => {
    if (address && !hasLoadedFromCache && !isFetching && hasCheckedCache) {
      console.log("🔄 Wallet reconnected, fetching cards from blockchain...");
      fetchOwnedCards();
    }
  }, [address, hasLoadedFromCache, isFetching, hasCheckedCache, fetchOwnedCards]);

  // Refresh when new cards are minted (for real-time updates)
  useEffect(() => {
    if (memoizedEvents && memoizedEvents.length > 0 && hasLoadedFromCache) {
      // Check if any new events are for this user
      const userEvents = memoizedEvents.filter(event => 
        event.args?.to?.toLowerCase() === address?.toLowerCase()
      );
      if (userEvents.length > 0) {
        console.log("🔄 New card minted for user, refreshing...");
        fetchOwnedCards(true); // Force refresh to get new cards
      }
    }
  }, [memoizedEvents, address, hasLoadedFromCache, fetchOwnedCards]);

  // Add a manual refresh function
  const refreshCards = useCallback(() => {
    console.log("🔄 Manual refresh triggered by user");
    setHasLoadedFromCache(false);
    setIsFetching(false);
    setHasCheckedCache(false);
    setIsLoading(true);
    fetchOwnedCards(true); // Force refresh
  }, [fetchOwnedCards]);

  // Clear cache function
  const clearCardsCache = useCallback(() => {
    if (address) {
      clearCache(address);
      setHasLoadedFromCache(false);
      setIsFetching(false);
      setHasCheckedCache(false);
      setOwnedCards([]);
      setIsLoading(true);
      fetchOwnedCards(true);
    }
  }, [address, fetchOwnedCards]);

  return {
    ownedCards,
    totalSupply: Number(maxTokenId),
    isLoading,
    error,
    refreshCards,
    clearCache: clearCardsCache,
    hasCache: hasLoadedFromCache,
    // Debug function to check cache status
    debugCache: () => {
      if (!address) return null;
      const cached = loadFromCache(address);
      if (cached) {
        console.log("🔍 Cache debug:", {
          cardsCount: cached.cards.length,
          timestamp: new Date(cached.timestamp),
          age: Math.round((Date.now() - cached.timestamp) / 1000) + " seconds ago",
          tokenIds: Array.from(cached.tokenIds)
        });
        return cached;
      } else {
        console.log("🔍 No cache found for address:", address);
        return null;
      }
    },
  };
}

export function useCardTemplate(templateId: bigint) {
  const { data: template, isLoading, error } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getCardTemplate",
    args: [templateId],
  });

  // Transform the raw contract data into our CardTemplate interface
  const cardTemplate: CardTemplate | undefined = template ? {
    id: template[0],
    name: template[1],
    rarity: template[2],
    attack: Number(template[3]),
    defense: Number(template[4]),
    agility: Number(template[5]),
    hp: Number(template[6]),
    isActive: template[7],
  } : undefined;

  return {
    cardTemplate,
    isLoading,
    error: error ? String(error) : null,
  };
}
