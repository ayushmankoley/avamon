// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Import interfaces for the main contracts
interface IAvamonCore {
    function createCardTemplate(
        string memory _name,
        uint8 _rarity,
        uint256 _attack,
        uint256 _defense,
        uint256 _agility,
        uint256 _hp
    ) external;

    function updateCardTemplate(uint256 _templateId, bool _isActive) external;
    function createPackType(string memory _name, uint256 _price, uint8[3] memory _rarityChances) external;
    function updatePackType(uint256 _packTypeId, bool _isActive) external;
    function getPackType(uint256 _packTypeId) external view returns (
        uint256 id,
        string memory name,
        uint256 price,
        uint8[3] memory rarityChances,
        bool isActive
    );
    function createAdventure(
        string memory _name,
        string memory _description,
        uint256 _entryFee,
        uint256 _minReward,
        uint256 _maxReward,
        uint256 _duration,
        uint256 _packDropChance,
        uint256 _packTypeId
    ) external;

    function updateAdventure(uint256 _adventureId, bool _isActive) external;
    function createQuest(
        uint8 _questType,
        string memory _title,
        string memory _description,
        uint256 _rewardAmount,
        bool _isPackReward,
        uint256 _packTypeId,
        uint256 _targetValue,
        uint256 _timeWindow
    ) external;

    function updateQuest(uint256 _questId, bool _isActive) external;
    function emergencyResetUserEnergy(address _user, uint256 _energyAmount) external;
    function emergencyForceCompleteAdventure(address _user, uint256 _adventureId) external;
    function toggleEmergencyMode() external;
}

interface IAvamonToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IAvamonCards {
    function mintCard(
        address to,
        uint256 templateId,
        uint256 attack,
        uint256 defense,
        uint256 agility,
        uint256 hp,
        uint8 rarity
    ) external;

    function setTokenURI(uint256 tokenId, string memory _tokenURI) external;
}

interface IAvamonPacks {
    function mintPack(address to, uint256 packId, uint256 amount) external;
    function createPackType(uint256 packTypeId, string memory name, uint256 price) external;
}

/**
 * @title AvamonAdmin
 * @dev Administrative contract for Avamon TCG
 * Handles admin-only functions to reduce main contract size
 */
contract AvamonAdmin is Ownable, ReentrancyGuard {
    IAvamonCore public immutable avamonCore;
    IAvamonToken public immutable avamonToken;
    IAvamonCards public immutable avamonCards;
    IAvamonPacks public immutable avamonPacks;

    event AdminAction(string action, address indexed admin, uint256 timestamp);

    constructor(
        address initialOwner,
        address _avamonCore,
        address _avamonToken,
        address _avamonCards,
        address _avamonPacks
    ) Ownable(initialOwner) {
        avamonCore = IAvamonCore(_avamonCore);
        avamonToken = IAvamonToken(_avamonToken);
        avamonCards = IAvamonCards(_avamonCards);
        avamonPacks = IAvamonPacks(_avamonPacks);
    }

    // ============ CARD TEMPLATE ADMIN FUNCTIONS ============

    function createCardTemplate(
        string memory _name,
        uint8 _rarity,
        uint256 _attack,
        uint256 _defense,
        uint256 _agility,
        uint256 _hp
    ) external {
        avamonCore.createCardTemplate(_name, _rarity, _attack, _defense, _agility, _hp);
        emit AdminAction("CreateCardTemplate", msg.sender, block.timestamp);
    }

    function updateCardTemplate(uint256 _templateId, bool _isActive) external {
        avamonCore.updateCardTemplate(_templateId, _isActive);
        emit AdminAction("UpdateCardTemplate", msg.sender, block.timestamp);
    }

    // ============ PACK TYPE ADMIN FUNCTIONS ============

    function createPackType(
        string memory _name,
        uint256 _price,
        uint8[3] memory _rarityChances
    ) external {
        avamonCore.createPackType(_name, _price, _rarityChances);
        emit AdminAction("CreatePackType", msg.sender, block.timestamp);
    }

    function updatePackType(uint256 _packTypeId, bool _isActive) external {
        avamonCore.updatePackType(_packTypeId, _isActive);
        emit AdminAction("UpdatePackType", msg.sender, block.timestamp);
    }

    /**
     * @dev Sync pack info from AvamonCore to AvamonPacks
     * This is needed when pack types exist in AvamonCore but not in AvamonPacks
     */
    function syncPackInfo(uint256 _packTypeId) external {
        (
            uint256 id,
            string memory name,
            uint256 price,
            ,
            bool isActive
        ) = avamonCore.getPackType(_packTypeId);

        require(id != 0, "Pack type doesn't exist in AvamonCore");

        // Create pack info in AvamonPacks if it doesn't exist
        avamonPacks.createPackType(_packTypeId, name, price);

        emit AdminAction("SyncPackInfo", msg.sender, block.timestamp);
    }

    // ============ ADVENTURE ADMIN FUNCTIONS ============

    function createAdventure(
        string memory _name,
        string memory _description,
        uint256 _entryFee,
        uint256 _minReward,
        uint256 _maxReward,
        uint256 _duration,
        uint256 _packDropChance,
        uint256 _packTypeId
    ) external {
        avamonCore.createAdventure(_name, _description, _entryFee, _minReward, _maxReward, _duration, _packDropChance, _packTypeId);
        emit AdminAction("CreateAdventure", msg.sender, block.timestamp);
    }

    function updateAdventure(uint256 _adventureId, bool _isActive) external {
        avamonCore.updateAdventure(_adventureId, _isActive);
        emit AdminAction("UpdateAdventure", msg.sender, block.timestamp);
    }

    // ============ QUEST ADMIN FUNCTIONS ============

    function createQuest(
        uint8 _questType,
        string memory _title,
        string memory _description,
        uint256 _rewardAmount,
        bool _isPackReward,
        uint256 _packTypeId,
        uint256 _targetValue,
        uint256 _timeWindow
    ) external {
        avamonCore.createQuest(_questType, _title, _description, _rewardAmount, _isPackReward, _packTypeId, _targetValue, _timeWindow);
        emit AdminAction("CreateQuest", msg.sender, block.timestamp);
    }

    function updateQuest(uint256 _questId, bool _isActive) external {
        avamonCore.updateQuest(_questId, _isActive);
        emit AdminAction("UpdateQuest", msg.sender, block.timestamp);
    }

    // ============ TOKEN MANAGEMENT ============

    function adminClaim(uint256 _amount) external {
        require(avamonToken.balanceOf(address(avamonCore)) >= _amount, "Insufficient contract balance");
        // Note: This would need to be implemented in AvamonCore or transfer from AvamonCore
        emit AdminAction("AdminClaim", msg.sender, block.timestamp);
    }

    function emergencyMintTokens(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");

        avamonToken.transfer(_to, _amount);
        emit AdminAction("EmergencyMintTokens", msg.sender, block.timestamp);
    }

    // ============ EMERGENCY CARD MANAGEMENT ============

    function emergencyMintCards(
        address _to,
        uint256 _templateId,
        uint256 _attack,
        uint256 _defense,
        uint256 _agility,
        uint256 _hp,
        uint8 _rarity
    ) external onlyOwner {
        require(_to != address(0), "Invalid address");

        avamonCards.mintCard(_to, _templateId, _attack, _defense, _agility, _hp, _rarity);
        emit AdminAction("EmergencyMintCards", msg.sender, block.timestamp);
    }

    // ============ EMERGENCY PACK MANAGEMENT ============

    function emergencyMintPacks(address _to, uint256 _packTypeId, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");

        avamonPacks.mintPack(_to, _packTypeId, _amount);
        emit AdminAction("EmergencyMintPacks", msg.sender, block.timestamp);
    }

    // ============ EMERGENCY USER MANAGEMENT ============

    function emergencyResetUserEnergy(address _user, uint256 _energyAmount) external onlyOwner {
        avamonCore.emergencyResetUserEnergy(_user, _energyAmount);
        emit AdminAction("EmergencyResetEnergy", msg.sender, block.timestamp);
    }

    function emergencyForceCompleteAdventure(address _user, uint256 _adventureId) external onlyOwner {
        avamonCore.emergencyForceCompleteAdventure(_user, _adventureId);
        emit AdminAction("EmergencyForceComplete", msg.sender, block.timestamp);
    }

    // ============ EMERGENCY SYSTEM CONTROLS ============

    function toggleEmergencyMode() external onlyOwner {
        avamonCore.toggleEmergencyMode();
        emit AdminAction("ToggleEmergencyMode", msg.sender, block.timestamp);
    }

    // ============ BATCH OPERATIONS ============

    function batchCreateCardTemplates(
        string[] memory _names,
        uint8[] memory _rarities,
        uint256[] memory _attacks,
        uint256[] memory _defenses,
        uint256[] memory _agilities,
        uint256[] memory _hps
    ) external onlyOwner {
        require(
            _names.length == _rarities.length &&
            _rarities.length == _attacks.length &&
            _attacks.length == _defenses.length &&
            _defenses.length == _agilities.length &&
            _agilities.length == _hps.length,
            "Array lengths mismatch"
        );

        for (uint256 i = 0; i < _names.length; i++) {
            avamonCore.createCardTemplate(_names[i], _rarities[i], _attacks[i], _defenses[i], _agilities[i], _hps[i]);
        }

        emit AdminAction("BatchCreateCardTemplates", msg.sender, block.timestamp);
    }

    // ============ VIEW FUNCTIONS ============

    function isAdmin(address _account) external view returns (bool) {
        return _account == owner();
    }

    // ============ METADATA MANAGEMENT ============

    function updateCardMetadata(uint256 tokenId, string memory newTokenURI) external onlyOwner {
        // Call the cards contract to update metadata
        avamonCards.setTokenURI(tokenId, newTokenURI);
        emit AdminAction("UpdateCardMetadata", msg.sender, block.timestamp);
    }

    function batchUpdateCardMetadata(uint256[] memory tokenIds, string[] memory newTokenURIs) external onlyOwner {
        require(tokenIds.length == newTokenURIs.length, "Array lengths mismatch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            avamonCards.setTokenURI(tokenIds[i], newTokenURIs[i]);
        }

        emit AdminAction("BatchUpdateCardMetadata", msg.sender, block.timestamp);
    }

    // ============ RECEIVE FUNCTION ============
    receive() external payable {}
}
