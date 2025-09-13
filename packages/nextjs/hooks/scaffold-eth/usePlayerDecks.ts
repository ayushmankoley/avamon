import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "./useScaffoldReadContract";

export interface PlayerDeck {
  avamonIds: readonly bigint[];
  name: string;
}

export function usePlayerDecks() {
  const { address } = useAccount();

  const { data: savedDecks, refetch } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getSavedDecks",
    args: address ? [address] : undefined,
  });

  return {
    decks: (savedDecks as PlayerDeck[]) || [],
    refetchDecks: refetch,
  };
}
