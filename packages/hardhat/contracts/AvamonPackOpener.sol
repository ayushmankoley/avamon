// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

// Import interfaces for the token contracts
interface IAvamonCards {
    function mintCard(
        address to,
        uint256 templateId,
        uint256 attack,
        uint256 defense,
        uint256 agility,
        uint256 hp,
        uint8 rarity
    ) external returns (uint256);
    function batchMintCards(
        address to,
        uint256[] calldata templateIds,
        uint256[] calldata attacks,
        uint256[] calldata defenses,
        uint256[] calldata agilities,
        uint256[] calldata hps,
        uint8[] calldata rarities
    ) external returns (uint256[] memory);
}

interface IAvamonPacks {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burnPack(address account, uint256 id, uint256 amount) external;
    function packInfo(uint256 packId) external view returns (uint256 packTypeId, string memory name, uint256 price, bool isActive);
}

interface IAvamonCore {
    function getPackType(uint256 _packTypeId) external view returns (
        uint256 id,
        string memory name,
        uint256 price,
        uint8[3] memory rarityChances,
        bool isActive
    );
    function getCardTemplate(uint256 _templateId) external view returns (
        uint256 id,
        string memory name,
        uint8 rarity,
        uint256 attack,
        uint256 defense,
        uint256 agility,
        uint256 hp,
        bool isActive
    );
    function getCommonCardIds() external view returns (uint256[] memory);
    function getRareCardIds() external view returns (uint256[] memory);
    function getMythicCardIds() external view returns (uint256[] memory);
}

/**
 * @title AvamonPackOpener
 * @dev Handles pack opening logic with VRF integration
 */
contract AvamonPackOpener is Ownable, ReentrancyGuard, Pausable, VRFConsumerBaseV2 {
    // Chainlink VRF Configuration
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    uint256 private immutable subscriptionId;
    bytes32 private immutable keyHash;
    uint32 private immutable callbackGasLimit = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;

    // Contract addresses
    IAvamonCards public immutable avamonCards;
    IAvamonPacks public immutable avamonPacks;
    IAvamonCore public immutable avamonCore;

    // VRF Request tracking
    struct PackOpenRequest {
        address user;
        uint256 packId;
        uint256 packTypeId;
        bool fulfilled;
    }

    mapping(uint256 => PackOpenRequest) public vrfRequests;

    // Events
    event PackOpenRequested(address indexed user, uint256 indexed packId, uint256 requestId);
    event PackOpened(address indexed user, uint256 indexed packId, uint256[] cardIds);

    constructor(
        address initialOwner,
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        address _avamonCards,
        address _avamonPacks,
        address _avamonCore
    )
        Ownable(initialOwner)
        VRFConsumerBaseV2(_vrfCoordinator)
    {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        avamonCards = IAvamonCards(_avamonCards);
        avamonPacks = IAvamonPacks(_avamonPacks);
        avamonCore = IAvamonCore(_avamonCore);
    }

    /**
     * @dev Open a pack using VRF for randomness
     */
    function openPack(uint256 _packId) external nonReentrant whenNotPaused {
        require(avamonPacks.balanceOf(msg.sender, _packId) > 0, "Does not own this pack");
        
        // Get pack info from packs contract to find the pack type ID
        (uint256 packTypeId, , , bool packIsActive) = avamonPacks.packInfo(_packId);
        require(packIsActive, "Pack not active");
        
        // Get pack type info from core contract using the pack type ID
        (uint256 id, , , uint8[3] memory rarityChances, bool isActive) = avamonCore.getPackType(packTypeId);
        require(isActive, "Pack type not active");

        // Burn the pack
        avamonPacks.burnPack(msg.sender, _packId, 1);

        // Request randomness from VRF
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            uint64(subscriptionId),
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            5 // Number of random words (5 cards per pack)
        );

        vrfRequests[requestId] = PackOpenRequest({
            user: msg.sender,
            packId: _packId,
            packTypeId: packTypeId,
            fulfilled: false
        });

        emit PackOpenRequested(msg.sender, _packId, requestId);
    }

    /**
     * @dev Callback function used by VRF Coordinator
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        PackOpenRequest storage request = vrfRequests[_requestId];
        require(!request.fulfilled, "Invalid VRF request");
        
        request.fulfilled = true;

        // Generate cards based on pack type and random words
        uint256[] memory newCardIds = new uint256[](5);
        uint256[] memory templateIds = new uint256[](5);
        uint256[] memory attacks = new uint256[](5);
        uint256[] memory defenses = new uint256[](5);
        uint256[] memory agilities = new uint256[](5);
        uint256[] memory hps = new uint256[](5);
        uint8[] memory rarities = new uint8[](5);

        // Generate cards based on specific pack type rules
        uint8[] memory cardRarities = _getPackCardRarities(request.packTypeId, _randomWords);
        
        for (uint256 i = 0; i < 5; i++) {
            uint256 templateId = _getRandomTemplate(cardRarities[i], _randomWords[i]);
            
            if (templateId > 0) {
                (, , , uint256 attack, uint256 defense, uint256 agility, uint256 hp, ) = 
                    avamonCore.getCardTemplate(templateId);
                
                templateIds[i] = templateId;
                attacks[i] = attack;
                defenses[i] = defense;
                agilities[i] = agility;
                hps[i] = hp;
                rarities[i] = cardRarities[i];
            }
        }

        // Mint the cards
        newCardIds = avamonCards.batchMintCards(
            request.user,
            templateIds,
            attacks,
            defenses,
            agilities,
            hps,
            rarities
        );

        emit PackOpened(request.user, request.packId, newCardIds);
    }

    /**
     * @dev Get card rarities for specific pack types
     * Blue Pack: 3 Commons, 1 Rare, 1 Rare/Mythic slot
     * Green Pack: 4 Commons, 1 Rare
     * Red Pack: 2 Commons, 2 Rares, 1 Rare/Mythic slot
     */
    function _getPackCardRarities(uint256 _packTypeId, uint256[] memory _randomWords) internal pure returns (uint8[] memory) {
        uint8[] memory cardRarities = new uint8[](5);
        
        if (_packTypeId == 1) {
            // Blue Pack: 3 Commons, 1 Rare, 1 Rare/Mythic slot
            cardRarities[0] = 0; // Common
            cardRarities[1] = 0; // Common
            cardRarities[2] = 0; // Common
            cardRarities[3] = 1; // Rare
            // Last slot: 80% Rare, 20% Mythic
            cardRarities[4] = (_randomWords[4] % 100) < 80 ? 1 : 2;
        } else if (_packTypeId == 2) {
            // Green Pack: 4 Commons, 1 Rare (small mythic chance)
            cardRarities[0] = 0; // Common
            cardRarities[1] = 0; // Common
            cardRarities[2] = 0; // Common
            cardRarities[3] = 0; // Common
            // Last slot: 95% Rare, 5% Mythic
            cardRarities[4] = (_randomWords[4] % 100) < 95 ? 1 : 2;
        } else if (_packTypeId == 3) {
            // Red Pack: 2 Commons, 2 Rares, 1 Rare/Mythic slot
            cardRarities[0] = 0; // Common
            cardRarities[1] = 0; // Common
            cardRarities[2] = 1; // Rare
            cardRarities[3] = 1; // Rare
            // Last slot: 70% Rare, 30% Mythic
            cardRarities[4] = (_randomWords[4] % 100) < 70 ? 1 : 2;
        } else {
            // Default fallback: all commons
            for (uint256 i = 0; i < 5; i++) {
                cardRarities[i] = 0;
            }
        }
        
        return cardRarities;
    }

    /**
     * @dev Get random template ID for given rarity
     */
    function _getRandomTemplate(uint8 _rarity, uint256 _randomSeed) internal view returns (uint256) {
        uint256[] memory cardIds;
        
        if (_rarity == 0) {
            cardIds = avamonCore.getCommonCardIds();
        } else if (_rarity == 1) {
            cardIds = avamonCore.getRareCardIds();
        } else {
            cardIds = avamonCore.getMythicCardIds();
        }

        if (cardIds.length == 0) return 0;
        
        return cardIds[_randomSeed % cardIds.length];
    }

    /**
     * @dev Emergency function to manually fulfill a pack opening (in case VRF fails)
     */
    function emergencyFulfillPack(uint256 _requestId) external onlyOwner {
        PackOpenRequest storage request = vrfRequests[_requestId];
        require(!request.fulfilled, "Request already fulfilled");
        
        // Use block-based randomness as fallback
        uint256[] memory fallbackRandomWords = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            fallbackRandomWords[i] = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                request.user,
                i
            )));
        }
        
        fulfillRandomWords(_requestId, fallbackRandomWords);
    }

    /**
     * @dev Emergency pack opening without VRF (for testing/debugging)
     */
    function emergencyOpenPack(uint256 _packId) external nonReentrant whenNotPaused {
        require(avamonPacks.balanceOf(msg.sender, _packId) > 0, "Does not own this pack");
        
        // Get pack info from packs contract to find the pack type ID
        (uint256 packTypeId, , , bool packIsActive) = avamonPacks.packInfo(_packId);
        require(packIsActive, "Pack not active");
        
        // Get pack type info from core contract using the pack type ID
        (uint256 id, , , uint8[3] memory rarityChances, bool isActive) = avamonCore.getPackType(packTypeId);
        require(isActive, "Pack type not active");

        // Burn the pack
        avamonPacks.burnPack(msg.sender, _packId, 1);

        // Generate pseudo-random words using block data
        uint256[] memory randomWords = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            randomWords[i] = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                msg.sender,
                _packId,
                i
            )));
        }

        // Generate cards directly without VRF
        uint256[] memory templateIds = new uint256[](5);
        uint256[] memory attacks = new uint256[](5);
        uint256[] memory defenses = new uint256[](5);
        uint256[] memory agilities = new uint256[](5);
        uint256[] memory hps = new uint256[](5);
        uint8[] memory rarities = new uint8[](5);

        // Generate cards based on specific pack type rules
        uint8[] memory cardRarities = _getPackCardRarities(packTypeId, randomWords);
        
        for (uint256 i = 0; i < 5; i++) {
            uint256 templateId = _getRandomTemplate(cardRarities[i], randomWords[i]);
            
            if (templateId > 0) {
                (, , , uint256 attack, uint256 defense, uint256 agility, uint256 hp, ) = 
                    avamonCore.getCardTemplate(templateId);
                
                templateIds[i] = templateId;
                attacks[i] = attack;
                defenses[i] = defense;
                agilities[i] = agility;
                hps[i] = hp;
                rarities[i] = cardRarities[i];
            }
        }

        // Mint the cards
        uint256[] memory newCardIds = avamonCards.batchMintCards(
            msg.sender,
            templateIds,
            attacks,
            defenses,
            agilities,
            hps,
            rarities
        );

        emit PackOpened(msg.sender, _packId, newCardIds);
    }

    /**
     * @dev Get VRF request info
     */
    function getVRFRequest(uint256 _requestId) external view returns (PackOpenRequest memory) {
        return vrfRequests[_requestId];
    }

    // ============ EMERGENCY FUNCTIONS ============

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
