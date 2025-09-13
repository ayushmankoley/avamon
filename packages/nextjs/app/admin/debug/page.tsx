"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  BeakerIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BoltIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { AddressInput } from "~~/components/scaffold-eth";

const AdminDebug = () => {
  const { address } = useAccount();
  const { writeContractAsync: writeAvamonCoreAsync } = useScaffoldWriteContract("AvamonCore");
  const { writeContractAsync: writeAvamonTokenAsync } = useScaffoldWriteContract("AvamonToken");
  const { writeContractAsync: writeAvamonCardsAsync } = useScaffoldWriteContract("AvamonCards");
  const { writeContractAsync: writeAvamonPacksAsync } = useScaffoldWriteContract("AvamonPacks");

  const [targetAddress, setTargetAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('1000');
  const [energyAmount, setEnergyAmount] = useState('5');
  const [packTypeId, setPackTypeId] = useState('1');
  const [packAmount, setPackAmount] = useState('5');

  const [cardTemplate, setCardTemplate] = useState({
    name: 'Test Avamon',
    attack: '50',
    defense: '50',
    agility: '50',
    hp: '50',
    rarity: '0'
  });

  const handleMintTokens = async () => {
    if (!targetAddress) {
      alert('Please enter a target address');
      return;
    }

    try {
      await writeAvamonTokenAsync({
        functionName: "mint",
        args: [targetAddress, BigInt(mintAmount) * BigInt(10**18)],
      });
      alert(`Successfully minted ${mintAmount} $AM to ${targetAddress}`);
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Failed to mint tokens');
    }
  };

  const handleMintCards = async () => {
    if (!targetAddress) {
      alert('Please enter a target address');
      return;
    }

    try {
      // First create a card template
      await writeAvamonCoreAsync({
        functionName: "createCardTemplate",
        args: [
          cardTemplate.name,
          Number(cardTemplate.rarity),
          BigInt(cardTemplate.attack),
          BigInt(cardTemplate.defense),
          BigInt(cardTemplate.agility),
          BigInt(cardTemplate.hp)
        ],
      });

      // Then mint the card (this would need to be implemented in the contract)
      alert(`Successfully created card template: ${cardTemplate.name}`);
    } catch (error) {
      console.error('Error minting cards:', error);
      alert('Failed to mint cards');
    }
  };

  const handleMintPacks = async () => {
    if (!targetAddress) {
      alert('Please enter a target address');
      return;
    }

    try {
      await writeAvamonPacksAsync({
        functionName: "mintPack",
        args: [targetAddress, BigInt(packTypeId), BigInt(packAmount)],
      });
      alert(`Successfully minted ${packAmount} packs of type ${packTypeId} to ${targetAddress}`);
    } catch (error) {
      console.error('Error minting packs:', error);
      alert('Failed to mint packs');
    }
  };

  const handleResetEnergy = async () => {
    if (!targetAddress) {
      alert('Please enter a target address');
      return;
    }

    try {
      // This would need to be implemented in the contract
      alert(`Energy reset functionality for ${targetAddress} would be implemented here`);
    } catch (error) {
      console.error('Error resetting energy:', error);
      alert('Failed to reset energy');
    }
  };

  const handleForceCompleteAdventure = async () => {
    if (!targetAddress) {
      alert('Please enter a target address');
      return;
    }

    try {
      // This would need to be implemented in the contract
      alert(`Force complete adventure functionality for ${targetAddress} would be implemented here`);
    } catch (error) {
      console.error('Error force completing adventure:', error);
      alert('Failed to force complete adventure');
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70">Please connect your wallet to access debug tools</p>
        </div>
      </div>
    );
  }

  // Note: In a real implementation, you'd check if the connected address is the owner/admin

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <BeakerIcon className="h-8 w-8 text-purple-500" />
          Admin Debug Tools
        </h1>
        <p className="text-base-content/70">Testing utilities for Avamon TCG (Use with caution!)</p>
      </div>

      {/* Target Address Input */}
      <div className="bg-base-100 rounded-lg p-6 shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Target Address</h2>
        <AddressInput
          value={targetAddress}
          onChange={setTargetAddress}
          placeholder="Enter wallet address for testing"
        />
        <p className="text-sm text-base-content/70 mt-2">
          All debug actions will be performed on this address
        </p>
      </div>

      {/* Debug Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mint Tokens */}
        <div className="bg-base-100 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-bold">Mint $AM Tokens</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount ($AM)</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={handleMintTokens}
              disabled={!targetAddress}
            >
              Mint Tokens
            </button>
          </div>
        </div>

        {/* Mint Cards */}
        <div className="bg-base-100 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <CubeIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-lg font-bold">Create Card Template</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Card Name</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={cardTemplate.name}
                onChange={(e) => setCardTemplate({...cardTemplate, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Attack</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={cardTemplate.attack}
                  onChange={(e) => setCardTemplate({...cardTemplate, attack: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Defense</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={cardTemplate.defense}
                  onChange={(e) => setCardTemplate({...cardTemplate, defense: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Agility</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={cardTemplate.agility}
                  onChange={(e) => setCardTemplate({...cardTemplate, agility: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HP</label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={cardTemplate.hp}
                  onChange={(e) => setCardTemplate({...cardTemplate, hp: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rarity (0=Common, 1=Rare, 2=Mythic)</label>
              <select
                className="select select-bordered w-full"
                value={cardTemplate.rarity}
                onChange={(e) => setCardTemplate({...cardTemplate, rarity: e.target.value})}
              >
                <option value="0">Common</option>
                <option value="1">Rare</option>
                <option value="2">Mythic</option>
              </select>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={handleMintCards}
              disabled={!targetAddress}
            >
              Create Card Template
            </button>
          </div>
        </div>

        {/* Mint Packs */}
        <div className="bg-base-100 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <ArchiveBoxIcon className="h-6 w-6 text-purple-500" />
            <h3 className="text-lg font-bold">Mint Packs</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pack Type ID</label>
              <select
                className="select select-bordered w-full"
                value={packTypeId}
                onChange={(e) => setPackTypeId(e.target.value)}
              >
                <option value="1">Blue Pack</option>
                <option value="2">Green Pack</option>
                <option value="3">Red Pack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={packAmount}
                onChange={(e) => setPackAmount(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={handleMintPacks}
              disabled={!targetAddress}
            >
              Mint Packs
            </button>
          </div>
        </div>

        {/* Reset Energy */}
        <div className="bg-base-100 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <BoltIcon className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold">Reset Energy</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Energy Amount</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={energyAmount}
                onChange={(e) => setEnergyAmount(e.target.value)}
              />
            </div>
            <button
              className="btn btn-warning w-full"
              onClick={handleResetEnergy}
              disabled={!targetAddress}
            >
              Reset Energy
            </button>
          </div>
        </div>

        {/* Force Complete Adventure */}
        <div className="bg-base-100 rounded-lg p-6 shadow-lg md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-bold">Force Complete Adventure</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-base-content/70">
              This will instantly complete any active adventure for the target address and grant rewards.
              Use only for testing purposes.
            </p>
            <button
              className="btn btn-error w-full"
              onClick={handleForceCompleteAdventure}
              disabled={!targetAddress}
            >
              Force Complete Adventure
            </button>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-bold text-yellow-800">Important Warning</h3>
        </div>
        <div className="text-yellow-700 space-y-2">
          <p>• These debug tools are for testing purposes only</p>
          <p>• Always test on Fuji testnet before mainnet deployment</p>
          <p>• Minting tokens/cards can affect game economy</p>
          <p>• Use force actions sparingly to avoid disrupting player experience</p>
          <p>• All actions are irreversible once confirmed on blockchain</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-base-100 rounded-lg p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4">Quick Test Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setMintAmount('100');
              handleMintTokens();
            }}
            disabled={!targetAddress}
          >
            +100 $AM
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setPackAmount('1');
              handleMintPacks();
            }}
            disabled={!targetAddress}
          >
            +1 Blue Pack
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setEnergyAmount('10');
              handleResetEnergy();
            }}
            disabled={!targetAddress}
          >
            Max Energy
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => window.open('/debug', '_blank')}
          >
            Debug Contracts
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
