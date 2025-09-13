"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ArchiveBoxIcon,
  TrophyIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface AdventureForm {
  name: string;
  description: string;
  duration: number;
  energyCost: number;
  entryFee: number;
  minReward: number;
  maxReward: number;
  packDropChance: number;
  packTypeId: number;
}

const AdminDashboard = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("AvamonAdmin");

  const [activeTab, setActiveTab] = useState<'adventures' | 'quests' | 'packs' | 'emergency'>('adventures');
  const [showAdventureForm, setShowAdventureForm] = useState(false);
  const [adventureForm, setAdventureForm] = useState<AdventureForm>({
    name: '',
    description: '',
    duration: 10,
    energyCost: 3,
    entryFee: 0,
    minReward: 100,
    maxReward: 500,
    packDropChance: 25,
    packTypeId: 1,
  });

  // Get pack type data for each pack type (1, 2, 3)
  const { data: packType1 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [1n],
  });

  const { data: packType2 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [2n],
  });

  const { data: packType3 } = useScaffoldReadContract({
    contractName: "AvamonCore",
    functionName: "getPackType",
    args: [3n],
  });

  // Convert to array format for UI
  const packTypes = [packType1, packType2, packType3]
    .map((packType, index) => {
      if (!packType) return null;
      return {
        id: packType[0] || BigInt(index + 1),
        name: packType[1] || `Pack Type ${index + 1}`,
        price: packType[2] || 0n,
        active: packType[4] || false,
        odds: packType[3] || [0, 0, 0] // [common, rare, mythic] chances
      };
    })
    .filter((pack): pack is NonNullable<typeof pack> => pack !== null);

  // For now, use mock adventures data until we add a getAllAdventures function
  const adventures = [
    { id: 1, name: "Dragon's Lair", active: true, players: 0 },
    { id: 2, name: "Forest Expedition", active: true, players: 0 },
    { id: 3, name: "Underwater Temple", active: false, players: 0 },
  ];

  const handleCreateAdventure = async () => {
    try {
      await writeContractAsync({
        functionName: "createAdventure",
        args: [
          adventureForm.name,
          adventureForm.description,
          BigInt(adventureForm.entryFee),
          BigInt(adventureForm.minReward),
          BigInt(adventureForm.maxReward),
          BigInt(adventureForm.duration * 60), // Convert minutes to seconds
          BigInt(adventureForm.packDropChance),
          BigInt(adventureForm.packTypeId)
        ],
      });
      alert('Adventure created successfully!');
      setShowAdventureForm(false);
      setAdventureForm({
        name: '',
        description: '',
        duration: 10,
        energyCost: 3,
        entryFee: 0,
        minReward: 100,
        maxReward: 500,
        packDropChance: 25,
        packTypeId: 1,
      });
    } catch (error) {
      console.error('Error creating adventure:', error);
      alert('Failed to create adventure');
    }
  };

  const handleToggleAdventure = async (adventureId: number, active: boolean) => {
    try {
      await writeContractAsync({
        functionName: "updateAdventure",
        args: [BigInt(adventureId), active],
      });
      alert(`Adventure ${active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling adventure:', error);
      alert('Failed to toggle adventure');
    }
  };

  const handleUpdatePackOdds = async (packId: number, odds: number[]) => {
    try {
      // Note: Pack odds can only be set during pack type creation
      // To change odds, a new pack type must be created
      alert('Pack odds cannot be updated after creation. Create a new pack type instead.');
    } catch (error) {
      console.error('Error updating pack odds:', error);
      alert('Failed to update pack odds');
    }
  };

  const handleEmergencyAction = async (action: string) => {
    try {
      // Emergency action logic would go here
      alert(`${action} executed successfully!`);
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      alert(`Failed to execute ${action}`);
    }
  };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70">Please connect your wallet to access admin panel</p>
        </div>
      </div>
    );
  }

  // Note: In a real implementation, you'd check if the connected address is the owner/admin

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-base-content/70">Manage Avamon TCG content and settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-base-200 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'adventures' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setActiveTab('adventures')}
          >
            <PlayIcon className="h-4 w-4" />
            Adventures
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'quests' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setActiveTab('quests')}
          >
            <TrophyIcon className="h-4 w-4" />
            Quests
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'packs' ? 'bg-primary text-primary-content' : 'text-base-content'
            }`}
            onClick={() => setActiveTab('packs')}
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            Packs
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'emergency' ? 'bg-red-500 text-white' : 'text-base-content'
            }`}
            onClick={() => setActiveTab('emergency')}
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
            Emergency
          </button>
        </div>
      </div>

      {/* Adventures Tab */}
      {activeTab === 'adventures' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Adventure Management</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAdventureForm(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Adventure
            </button>
          </div>

          {/* Adventure Form */}
          {showAdventureForm && (
            <div className="bg-base-100 rounded-lg p-6 shadow-lg mb-6">
              <h3 className="text-lg font-bold mb-4">Create New Adventure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={adventureForm.name}
                    onChange={(e) => setAdventureForm({...adventureForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.duration}
                    onChange={(e) => setAdventureForm({...adventureForm, duration: Number(e.target.value)})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    value={adventureForm.description}
                    onChange={(e) => setAdventureForm({...adventureForm, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Energy Cost</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.energyCost}
                    onChange={(e) => setAdventureForm({...adventureForm, energyCost: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Entry Fee ($AM)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.entryFee}
                    onChange={(e) => setAdventureForm({...adventureForm, entryFee: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Reward ($AM)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.minReward}
                    onChange={(e) => setAdventureForm({...adventureForm, minReward: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Reward ($AM)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.maxReward}
                    onChange={(e) => setAdventureForm({...adventureForm, maxReward: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pack Drop Chance (%)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.packDropChance}
                    onChange={(e) => setAdventureForm({...adventureForm, packDropChance: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pack Type ID</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={adventureForm.packTypeId}
                    onChange={(e) => setAdventureForm({...adventureForm, packTypeId: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  className="btn btn-primary"
                  onClick={handleCreateAdventure}
                >
                  Create Adventure
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowAdventureForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Adventures List */}
          <div className="space-y-4">
            {adventures.map((adventure) => (
              <div key={adventure.id} className="bg-base-100 rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{adventure.name}</h3>
                    <p className="text-sm text-base-content/70">Active Players: {adventure.players}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      adventure.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {adventure.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleToggleAdventure(adventure.id, !adventure.active)}
                    >
                      {adventure.active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quests Tab */}
      {activeTab === 'quests' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Quest Management</h2>
          <div className="bg-base-100 rounded-lg p-6 shadow-lg">
            <p className="text-base-content/70 mb-4">
              Quest templates are managed through the smart contract.
              Use the Debug page to add/remove quest types.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Daily Check-in</h4>
                  <p className="text-sm text-base-content/70">Guaranteed pack reward</p>
                </div>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Battle Victories</h4>
                  <p className="text-sm text-base-content/70">Complete adventure missions</p>
                </div>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h4 className="font-medium">Pack Opening</h4>
                  <p className="text-sm text-base-content/70">Discover new cards</p>
                </div>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packs Tab */}
      {activeTab === 'packs' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Pack Management</h2>
          <div className="space-y-4">
            {packTypes.map((pack) => (
              <div key={pack.id} className="bg-base-100 rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold">{pack.name}</h3>
                    <p className="text-sm text-base-content/70">Price: {pack.price} $AM</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    pack.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {pack.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Common %</label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={pack.odds[0]}
                      onChange={(e) => {
                        const newOdds = [...pack.odds];
                        newOdds[0] = Number(e.target.value);
                        handleUpdatePackOdds(Number(pack.id), newOdds);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rare %</label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={pack.odds[1]}
                      onChange={(e) => {
                        const newOdds = [...pack.odds];
                        newOdds[1] = Number(e.target.value);
                        handleUpdatePackOdds(Number(pack.id), newOdds);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mythic %</label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={pack.odds[2]}
                      onChange={(e) => {
                        const newOdds = [...pack.odds];
                        newOdds[2] = Number(e.target.value);
                        handleUpdatePackOdds(Number(pack.id), newOdds);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Tab */}
      {activeTab === 'emergency' && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-red-600">Emergency Controls</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="space-y-4">
              <button
                className="btn btn-error w-full"
                onClick={() => handleEmergencyAction('Pause Contract')}
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Emergency Pause
              </button>
              <button
                className="btn btn-warning w-full"
                onClick={() => handleEmergencyAction('Resume Contract')}
              >
                Resume Contract
              </button>
              <button
                className="btn btn-outline w-full"
                onClick={() => handleEmergencyAction('Withdraw Funds')}
              >
                Withdraw Contract Funds
              </button>
            </div>
            <p className="text-sm text-red-600 mt-4">
              ⚠️ These actions should only be used in emergency situations.
              Always test on testnet first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
