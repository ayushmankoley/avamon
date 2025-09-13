import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { useScaffoldContract } from "./useScaffoldContract";
import { useScaffoldEventHistory } from "./useScaffoldEventHistory";
import { useState, useEffect, useMemo } from "react";

export interface PackType {
  id: bigint;
  name: string;
  price: bigint;
  rarityChances: readonly [bigint, bigint, bigint]; // [common%, rare%, mythic%]
  isActive: boolean;
}

export interface PackBalance {
  packId: bigint;
  balance: number;
  name: string;
  price: bigint;
  rarityChances: readonly [bigint, bigint, bigint];
  isActive: boolean;
}

export function usePlayerPacks() {
  const { address } = useAccount();
  const [packBalances, setPackBalances] = useState<PackBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get pack types with error handling
  const {
    data: packType1,
    isLoading: packType1Loading,
    error: packType1Error
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [1n],
  });

  const {
    data: packType2,
    isLoading: packType2Loading,
    error: packType2Error
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [2n],
  });

  const {
    data: packType3,
    isLoading: packType3Loading,
    error: packType3Error
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [3n],
  });

  // Get pack balances with error handling
  const {
    data: packBalance1,
    isLoading: balance1Loading,
    error: balance1Error,
    refetch: refetchBalance1
  } = useScaffoldReadContract({
    contractName: "AvamonPacks",
    functionName: "balanceOf",
    args: address ? [address, 1n] : undefined,
  });

  const {
    data: packBalance2,
    isLoading: balance2Loading,
    error: balance2Error,
    refetch: refetchBalance2
  } = useScaffoldReadContract({
    contractName: "AvamonPacks",
    functionName: "balanceOf",
    args: address ? [address, 2n] : undefined,
  });

  const {
    data: packBalance3,
    isLoading: balance3Loading,
    error: balance3Error,
    refetch: refetchBalance3
  } = useScaffoldReadContract({
    contractName: "AvamonPacks",
    functionName: "balanceOf",
    args: address ? [address, 3n] : undefined,
  });

  // Listen for pack-related events for real-time updates
  const { data: packMintedEvents } = useScaffoldEventHistory({
    contractName: "AvamonPacks",
    eventName: "PackMinted",
    fromBlock: BigInt(-1000),
    watch: true,
  });

  const { data: packBurnedEvents } = useScaffoldEventHistory({
    contractName: "AvamonPacks",
    eventName: "PackBurned",
    fromBlock: BigInt(-1000),
    watch: true,
  });

  // Memoize events to prevent infinite re-renders
  const memoizedPackMintedEvents = useMemo(() => packMintedEvents, [packMintedEvents?.length]);
  const memoizedPackBurnedEvents = useMemo(() => packBurnedEvents, [packBurnedEvents?.length]);

  // Update pack balances when events occur
  useEffect(() => {
    if (memoizedPackMintedEvents || memoizedPackBurnedEvents) {
      refetchBalance1();
      refetchBalance2();
      refetchBalance3();
    }
    // Scaffold refetch functions should be stable, so we can safely omit them from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedPackMintedEvents, memoizedPackBurnedEvents]);

  // Calculate pack balances with proper data
  useEffect(() => {
    if (packType1 && packType2 && packType3) {
      const balances: PackBalance[] = [
        {
          packId: 1n,
          balance: Number(packBalance1 || 0),
          name: packType1[1] || "Blue Pack", // packType returns [id, name, price, rarityChances, isActive]
          price: packType1[2] || 100000000000000000000n, // 100 $AM
          rarityChances: packType1[3] || [70n, 25n, 5n],
          isActive: packType1[4] ?? true,
        },
        {
          packId: 2n,
          balance: Number(packBalance2 || 0),
          name: packType2[1] || "Green Pack",
          price: packType2[2] || 200000000000000000000n, // 200 $AM
          rarityChances: packType2[3] || [50n, 35n, 15n],
          isActive: packType2[4] ?? true,
        },
        {
          packId: 3n,
          balance: Number(packBalance3 || 0),
          name: packType3[1] || "Red Pack",
          price: packType3[2] || 300000000000000000000n, // 300 $AM
          rarityChances: packType3[3] || [30n, 45n, 25n],
          isActive: packType3[4] ?? true,
        },
      ];
      setPackBalances(balances);
    }
  }, [
    packType1, packType2, packType3,
    packBalance1, packBalance2, packBalance3
  ]);

  // Set loading and error states
  useEffect(() => {
    const loadingStates = [
      packType1Loading, packType2Loading, packType3Loading,
      balance1Loading, balance2Loading, balance3Loading
    ];
    const errorStates = [
      packType1Error, packType2Error, packType3Error,
      balance1Error, balance2Error, balance3Error
    ];

    setIsLoading(loadingStates.some(loading => loading));

    const activeError = errorStates.find(error => error);
    setError(activeError ? String(activeError) : null);
  }, [
    packType1Loading, packType2Loading, packType3Loading,
    balance1Loading, balance2Loading, balance3Loading,
    packType1Error, packType2Error, packType3Error,
    balance1Error, balance2Error, balance3Error
  ]);

  const totalUnopenedPacks = packBalances.reduce((total, pack) => total + pack.balance, 0);

  return {
    packBalances,
    totalUnopenedPacks,
    isLoading,
    error,
  };
}

export function usePackType(packTypeId: bigint) {
  const {
    data: packType,
    isLoading,
    error
  } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [packTypeId],
  });

  return {
    packType: packType as PackType | undefined,
    isLoading,
    error: error ? String(error) : null,
  };
}
