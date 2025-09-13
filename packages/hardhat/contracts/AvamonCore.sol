// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Import interfaces for the token contracts and admin contract
interface IAvamonToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IAvamonCards {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
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
    function exists(uint256 tokenId) external view returns (bool);
}

interface IAvamonPacks {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function mintPack(address to, uint256 packId, uint256 amount) external;
    function burnPack(address from, uint256 packId, uint256 amount) external;
    function getNextPackId() external view returns (uint256);
    function getPackTypeInfo(uint256 packId) external view returns (uint256 packTypeId, string memory name, uint256 price, bool isActive);
    function getAllPackTypes() external view returns (uint256[] memory);
    function emergencyBurnPacks(address from, uint256 packId, uint256 amount) external;
    function updatePackMetadata(uint256 packId, string memory newUri) external;
    function createPackType(uint256 packTypeId, string memory name, uint256 price) external;
}

// Interface for admin functions (called by AvamonAdmin contract)
interface IAvamonCoreAdmin {
    function createCardTemplate(string memory _name, uint8 _rarity, uint256 _attack, uint256 _defense, uint256 _agility, uint256 _hp) external;
    function updateCardTemplate(uint256 _templateId, bool _isActive) external;
    function createPackType(string memory _name, uint256 _price, uint8[3] memory _rarityChances) external;
    function updatePackType(uint256 _packTypeId, bool _isActive) external;
    function createAdventure(string memory _name, string memory _description, uint256 _entryFee, uint256 _minReward, uint256 _maxReward, uint256 _duration, uint256 _packDropChance, uint256 _packTypeId) external;
    function updateAdventure(uint256 _adventureId, bool _isActive) external;
    function createQuest(uint8 _questType, string memory _title, string memory _description, uint256 _rewardAmount, bool _isPackReward, uint256 _packTypeId, uint256 _targetValue, uint256 _timeWindow) external;
    function updateQuest(uint256 _questId, bool _isActive) external;
    function emergencyResetUserEnergy(address _user, uint256 _energyAmount) external;
    function emergencyForceCompleteAdventure(address _user, uint256 _adventureId) external;
    function toggleEmergencyMode() external;
}

/**
 * @title AvamonCore
 * @dev Main game contract for Avamon TCG with VRF integration
 * Coordinates between token contracts for game logic
 */
contract AvamonCore is Ownable, ReentrancyGuard, Pausable {
    // Contract addresses
    IAvamonToken public immutable avamonToken;
    IAvamonCards public immutable avamonCards;
    IAvamonPacks public immutable avamonPacks;

    // Admin contract address (set after deployment)
    address public adminContract;

    // Game Constants
    uint256 private constant DAILY_ENERGY = 10;
    uint256 private constant ENERGY_REFILL_COST = 0.01 ether;
    uint256 private constant MAX_DECK_SLOTS_DEFAULT = 2;
    uint256 private constant MAX_DECK_SLOTS_PREMIUM = 3;
    uint256 private constant DECK_SLOT_UPGRADE_COST = 0.1 ether;
    uint256 private constant MIN_ADVENTURE_DURATION = 10 minutes;

    // Pack Opener contract address
    address public packOpenerContract;

    // Quest Types
    enum QuestType { DailyCheckin, WinBattles, OpenPacks, Custom }

    // Structs
    struct CardTemplate {
        uint256 id;
        string name;
        uint8 rarity;
        uint256 attack;
        uint256 defense;
        uint256 agility;
        uint256 hp;
        bool isActive;
    }

    struct PackType {
        uint256 id;
        string name;
        uint256 price;
        uint8[3] rarityChances; // [common%, rare%, mythic%]
        bool isActive;
    }

    struct PackInfo {
        uint256 packTypeId;
        string name;
        uint256 price;
        bool isActive;
    }

    struct Adventure {
        uint256 id;
        string name;
        string description;
        uint256 entryFee;
        uint256 minReward;
        uint256 maxReward;
        uint256 duration;
        uint256 packDropChance;
        uint256 packTypeId;
        bool isActive;
    }

    struct ActiveAdventure {
        uint256 adventureId;
        uint256 startTime;
        uint256[] avamonIds;
        bool isCompleted;
        bool rewardClaimed;
    }

    struct PlayerDeck {
        uint256[] avamonIds;
        string name;
    }

    struct Quest {
        uint256 id;
        QuestType questType;
        string title;
        string description;
        uint256 rewardAmount;
        bool isPackReward;
        uint256 packTypeId;
        uint256 targetValue;
        uint256 timeWindow; // 1 for daily, 7 for weekly
        bool isActive;
    }

    struct UserQuestProgress {
        uint256 questId;
        uint256 progress;
        bool isCompleted;
        bool isClaimed;
        uint256 lastUpdated;
        uint256 resetTime;
    }

    // State Variables
    mapping(uint256 => CardTemplate) public cardTemplates;
    mapping(uint256 => PackType) public packTypes;
    mapping(uint256 => Adventure) public adventures;

    mapping(address => mapping(uint256 => ActiveAdventure)) public activeAdventures;
    mapping(address => PlayerDeck[]) public savedDecks;
    mapping(address => uint256) public maxDeckSlots;
    mapping(address => uint256) public energyRemaining;
    mapping(address => uint256) public lastEnergyResetIST;


    // Rarity distribution for each pack type
    uint256[] private commonCardIds;
    uint256[] private rareCardIds;
    uint256[] private mythicCardIds;

    uint256 private nextCardTemplateId = 1;
    uint256 private nextPackTypeId = 1;
    uint256 private nextAdventureId = 1;
    uint256 private nextQuestId = 1;

    // Quest mappings
    mapping(uint256 => Quest) public quests;
    mapping(address => mapping(uint256 => UserQuestProgress)) public userQuestProgress;
    mapping(address => uint256[]) public userActiveQuests;
    mapping(address => uint256) public userWeeklyQuestSlots;

    // Events
    event CardTemplateCreated(uint256 indexed templateId, string name, uint8 rarity);
    event CardTemplateUpdated(uint256 indexed templateId, bool isActive);
    event PackTypeCreated(uint256 indexed packTypeId, string name, uint256 price);
    event PackTypeUpdated(uint256 indexed packTypeId, bool isActive);
    event AdventureCreated(uint256 indexed adventureId, string name, uint256 entryFee);
    event AdventureUpdated(uint256 indexed adventureId, bool isActive);
    event AdventureJoined(address indexed player, uint256 indexed adventureId, uint256[] avamonIds);
    event AdventureCompleted(address indexed player, uint256 indexed adventureId, uint256 reward, bool packDropped);
    event PackOpened(address indexed player, uint256 indexed packId, uint256[] avamonIds);
    event EnergyPurchased(address indexed player, uint256 energyAmount, uint256 cost);
    event DeckSlotUpgraded(address indexed player, uint256 newMaxSlots);
    event DeckSaved(address indexed player, uint256 deckIndex, string name);
    event AvamonMinted(address indexed to, uint256 indexed tokenId, uint256 templateId);
    event PackMinted(address indexed to, uint256 indexed tokenId, uint256 packTypeId);

    // Quest Events
    event QuestCreated(uint256 indexed questId, QuestType questType, string title);
    event QuestUpdated(uint256 indexed questId, bool isActive);
    event EnergyReset(address indexed user, uint256 energyAmount);
    event EmergencyModeToggled();
    event QuestProgressUpdated(address indexed player, uint256 indexed questId, uint256 progress);
    event QuestCompleted(address indexed player, uint256 indexed questId);
    event QuestRewardClaimed(address indexed player, uint256 indexed questId, uint256 rewardAmount, bool isPack);
    event WeeklyQuestSlotPurchased(address indexed player, uint256 cost);

    // Modifiers
    modifier onlyValidAdventure(uint256 _adventureId) {
        require(adventures[_adventureId].isActive, "Adventure not active");
        require(adventures[_adventureId].duration >= MIN_ADVENTURE_DURATION, "Adventure duration too short");
        _;
    }

    modifier adventureNotActive(address _player, uint256 _adventureId) {
        require(activeAdventures[_player][_adventureId].startTime == 0, "Adventure already active");
        _;
    }

    modifier adventureActive(address _player, uint256 _adventureId) {
        require(activeAdventures[_player][_adventureId].startTime > 0, "Adventure not active");
        require(!activeAdventures[_player][_adventureId].isCompleted, "Adventure already completed");
        _;
    }

    modifier hasEnergy(address _player, uint256 _required) {
        _resetEnergyIfNeeded(_player);
        require(energyRemaining[_player] >= _required, "Not enough energy");
        _;
    }

    modifier ownsAvamons(address _player, uint256[] memory _avamonIds) {
        for (uint256 i = 0; i < _avamonIds.length; i++) {
            require(avamonCards.ownerOf(_avamonIds[i]) == _player, "Does not own Avamon");
        }
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == adminContract, "Only admin contract can call this");
        _;
    }

    constructor(
        address initialOwner,
        address _avamonToken,
        address _avamonCards,
        address _avamonPacks
    )
        Ownable(initialOwner)
    {
        avamonToken = IAvamonToken(_avamonToken);
        avamonCards = IAvamonCards(_avamonCards);
        avamonPacks = IAvamonPacks(_avamonPacks);

        // Initialize default deck slots
        maxDeckSlots[msg.sender] = MAX_DECK_SLOTS_DEFAULT;
    }

    // ============ ADMIN FUNCTIONS (Called by AvamonAdmin) ============

    function createCardTemplate(
        string memory _name,
        uint8 _rarity,
        uint256 _attack,
        uint256 _defense,
        uint256 _agility,
        uint256 _hp
    ) external onlyAdmin {
        require(_rarity <= 2, "Invalid rarity");

        uint256 templateId = nextCardTemplateId++;
        cardTemplates[templateId] = CardTemplate({
            id: templateId,
            name: _name,
            rarity: _rarity,
            attack: _attack,
            defense: _defense,
            agility: _agility,
            hp: _hp,
            isActive: true
        });

        // Add to appropriate rarity arrays for efficient random selection
        if (_rarity == 0) commonCardIds.push(templateId);
        else if (_rarity == 1) rareCardIds.push(templateId);
        else mythicCardIds.push(templateId);

        emit CardTemplateCreated(templateId, _name, _rarity);
    }

    function updateCardTemplate(uint256 _templateId, bool _isActive) external onlyAdmin {
        require(cardTemplates[_templateId].id != 0, "Template doesn't exist");
        cardTemplates[_templateId].isActive = _isActive;
        emit CardTemplateUpdated(_templateId, _isActive);
    }

    function createPackType(
        string memory _name,
        uint256 _price,
        uint8[3] memory _rarityChances
    ) external onlyAdmin {
        require(_rarityChances[0] + _rarityChances[1] + _rarityChances[2] == 100, "Chances must sum to 100");

        uint256 packTypeId = nextPackTypeId++;
        packTypes[packTypeId] = PackType({
            id: packTypeId,
            name: _name,
            price: _price,
            rarityChances: _rarityChances,
            isActive: true
        });

        // Also create pack info in AvamonPacks contract
        avamonPacks.createPackType(packTypeId, _name, _price);

        emit PackTypeCreated(packTypeId, _name, _price);
    }

    function updatePackType(uint256 _packTypeId, bool _isActive) external onlyAdmin {
        require(packTypes[_packTypeId].id != 0, "Pack type doesn't exist");
        packTypes[_packTypeId].isActive = _isActive;
        emit PackTypeUpdated(_packTypeId, _isActive);
    }

    function createAdventure(
        string memory _name,
        string memory _description,
        uint256 _entryFee,
        uint256 _minReward,
        uint256 _maxReward,
        uint256 _duration,
        uint256 _packDropChance,
        uint256 _packTypeId
    ) external onlyAdmin {
        require(_duration >= MIN_ADVENTURE_DURATION, "Duration too short");
        require(_minReward <= _maxReward, "Invalid reward range");
        require(_packDropChance <= 100, "Invalid pack drop chance");
        require(packTypes[_packTypeId].id != 0, "Pack type doesn't exist");

        uint256 adventureId = nextAdventureId++;
        adventures[adventureId] = Adventure({
            id: adventureId,
            name: _name,
            description: _description,
            entryFee: _entryFee,
            minReward: _minReward,
            maxReward: _maxReward,
            duration: _duration,
            packDropChance: _packDropChance,
            packTypeId: _packTypeId,
            isActive: true
        });

        emit AdventureCreated(adventureId, _name, _entryFee);
    }

    function updateAdventure(uint256 _adventureId, bool _isActive) external onlyAdmin {
        require(adventures[_adventureId].id != 0, "Adventure doesn't exist");
        adventures[_adventureId].isActive = _isActive;
        emit AdventureUpdated(_adventureId, _isActive);
    }

    function createQuest(
        QuestType _questType,
        string memory _title,
        string memory _description,
        uint256 _rewardAmount,
        bool _isPackReward,
        uint256 _packTypeId,
        uint256 _targetValue,
        uint256 _timeWindow
    ) external onlyAdmin {
        require(_timeWindow == 1 || _timeWindow == 7, "Time window must be 1 (daily) or 7 (weekly)");
        require(!_isPackReward || packTypes[_packTypeId].id != 0, "Invalid pack type for reward");

        uint256 questId = nextQuestId++;
        quests[questId] = Quest({
            id: questId,
            questType: _questType,
            title: _title,
            description: _description,
            rewardAmount: _rewardAmount,
            isPackReward: _isPackReward,
            packTypeId: _packTypeId,
            targetValue: _targetValue,
            timeWindow: _timeWindow,
            isActive: true
        });

        emit QuestCreated(questId, _questType, _title);
    }

    function updateQuest(uint256 _questId, bool _isActive) external onlyAdmin {
        require(quests[_questId].id != 0, "Quest doesn't exist");
        quests[_questId].isActive = _isActive;
        emit QuestUpdated(_questId, _isActive);
    }

    function emergencyResetUserEnergy(address _user, uint256 _energyAmount) external onlyAdmin {
        _resetEnergyIfNeeded(_user);
        energyRemaining[_user] = _energyAmount;
        emit EnergyReset(_user, _energyAmount);
    }

    function emergencyForceCompleteAdventure(address _user, uint256 _adventureId) external onlyAdmin {
        require(!activeAdventures[_user][_adventureId].isCompleted, "Adventure already completed");
        activeAdventures[_user][_adventureId].isCompleted = true;
        emit AdventureCompleted(_user, _adventureId, 0, false); // 0 reward, no pack
    }

    function toggleEmergencyMode() external onlyAdmin {
        // Implementation for emergency mode
        emit EmergencyModeToggled();
    }

    // ============ ADMIN SETUP ============

    function setAdminContract(address _adminContract) external onlyOwner {
        require(_adminContract != address(0), "Invalid admin contract address");
        require(adminContract == address(0), "Admin contract already set");
        adminContract = _adminContract;
    }

    function updateAdminContract(address _newAdminContract) external onlyOwner {
        require(_newAdminContract != address(0), "Invalid admin contract address");
        adminContract = _newAdminContract;
    }

    function setPackOpenerContract(address _packOpenerContract) external onlyOwner {
        require(_packOpenerContract != address(0), "Invalid pack opener contract address");
        packOpenerContract = _packOpenerContract;
    }

    // ============ PLAYER FUNCTIONS ============

    function purchaseEnergy(uint256 _energyAmount) external payable nonReentrant whenNotPaused {
        uint256 totalCost = _energyAmount * ENERGY_REFILL_COST;
        require(msg.value >= totalCost, "Insufficient AVAX payment");

        _resetEnergyIfNeeded(msg.sender);
        energyRemaining[msg.sender] += _energyAmount;

        // Refund excess AVAX
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit EnergyPurchased(msg.sender, _energyAmount, totalCost);
    }

    function upgradeDeckSlots() external payable nonReentrant whenNotPaused {
        require(msg.value >= DECK_SLOT_UPGRADE_COST, "Insufficient AVAX payment");
        require(maxDeckSlots[msg.sender] == MAX_DECK_SLOTS_DEFAULT, "Already upgraded");

        maxDeckSlots[msg.sender] = MAX_DECK_SLOTS_PREMIUM;

        if (msg.value > DECK_SLOT_UPGRADE_COST) {
            payable(msg.sender).transfer(msg.value - DECK_SLOT_UPGRADE_COST);
        }

        emit DeckSlotUpgraded(msg.sender, MAX_DECK_SLOTS_PREMIUM);
    }

    function saveDeck(
        uint256 _deckIndex,
        string memory _name,
        uint256[] memory _avamonIds
    ) external nonReentrant whenNotPaused ownsAvamons(msg.sender, _avamonIds) {
        require(_deckIndex < maxDeckSlots[msg.sender], "Invalid deck index");
        require(_avamonIds.length > 0, "Deck cannot be empty");

        if (_deckIndex >= savedDecks[msg.sender].length) {
            savedDecks[msg.sender].push();
        }

        savedDecks[msg.sender][_deckIndex] = PlayerDeck({
            avamonIds: _avamonIds,
            name: _name
        });

        emit DeckSaved(msg.sender, _deckIndex, _name);
    }

    function joinAdventure(
        uint256 _adventureId,
        uint256[] memory _avamonIds
    )
        external
        nonReentrant
        whenNotPaused
        onlyValidAdventure(_adventureId)
        adventureNotActive(msg.sender, _adventureId)
        hasEnergy(msg.sender, 1)
        ownsAvamons(msg.sender, _avamonIds)
    {
        Adventure memory adventure = adventures[_adventureId];

        // Check entry fee
        if (adventure.entryFee > 0) {
            require(avamonToken.balanceOf(msg.sender) >= adventure.entryFee, "Insufficient $AM balance");
            avamonToken.transferFrom(msg.sender, address(this), adventure.entryFee);
        }

        // Consume energy
        energyRemaining[msg.sender]--;

        // Lock Avamons (transfer to contract)
        for (uint256 i = 0; i < _avamonIds.length; i++) {
            avamonCards.transferFrom(msg.sender, address(this), _avamonIds[i]);
        }

        // Create active adventure
        activeAdventures[msg.sender][_adventureId] = ActiveAdventure({
            adventureId: _adventureId,
            startTime: block.timestamp,
            avamonIds: _avamonIds,
            isCompleted: false,
            rewardClaimed: false
        });

        emit AdventureJoined(msg.sender, _adventureId, _avamonIds);
    }

    function claimAdventureReward(uint256 _adventureId)
        external
        nonReentrant
        whenNotPaused
        adventureActive(msg.sender, _adventureId)
    {
        _completeAdventure(msg.sender, _adventureId);
    }

    // Pack purchasing removed - packs are only obtainable through quest rewards and adventure drops

    // Pack opening is now handled by AvamonPackOpener contract
    function updateQuestProgressForPackOpening(address _user) external {
        require(msg.sender == packOpenerContract, "Only pack opener contract can call this");
        _updateQuestProgress(_user, QuestType.OpenPacks, 1);
    }

    // ============ QUEST PLAYER FUNCTIONS ============

    function buyWeeklyQuestSlot() external payable nonReentrant whenNotPaused {
        uint256 cost = 0.05 ether; // 0.05 AVAX
        require(msg.value >= cost, "Insufficient AVAX payment");
        require(userWeeklyQuestSlots[msg.sender] < 3, "Maximum weekly quest slots reached");

        userWeeklyQuestSlots[msg.sender]++;

        // Refund excess AVAX
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit WeeklyQuestSlotPurchased(msg.sender, cost);
    }

    function claimQuestReward(uint256 _questId) external nonReentrant whenNotPaused {
        UserQuestProgress storage progress = userQuestProgress[msg.sender][_questId];
        Quest memory quest = quests[_questId];

        require(progress.isCompleted, "Quest not completed");
        require(!progress.isClaimed, "Reward already claimed");
        require(quest.isActive, "Quest not active");

        // Mark as claimed
        progress.isClaimed = true;

        // Give reward
        if (quest.isPackReward) {
            uint256 packId = avamonPacks.getNextPackId();
            avamonPacks.mintPack(msg.sender, packId, 1);
            emit PackMinted(msg.sender, packId, quest.packTypeId);
            emit QuestRewardClaimed(msg.sender, _questId, 1, true);
        } else {
            require(avamonToken.balanceOf(address(this)) >= quest.rewardAmount, "Insufficient reward pool");
            avamonToken.transfer(msg.sender, quest.rewardAmount);
            emit QuestRewardClaimed(msg.sender, _questId, quest.rewardAmount, false);
        }
    }

    /**
     * @dev Complete and claim daily check-in quest in one transaction
     * Only works for quest ID 1 (daily check-in)
     */
    function completeDailyCheckin() external nonReentrant whenNotPaused {
        require(quests[1].id == 1, "Daily check-in quest not configured");

        UserQuestProgress storage progress = userQuestProgress[msg.sender][1];
        Quest memory quest = quests[1];

        require(quest.isActive, "Quest not active");
        require(!progress.isCompleted, "Quest already completed");
        require(!progress.isClaimed, "Reward already claimed");

        // Mark quest as completed and claimed
        progress.progress = 1;
        progress.isCompleted = true;
        progress.isClaimed = true;
        progress.lastUpdated = block.timestamp;

        // Give reward
        if (quest.isPackReward) {
            // The quest.packTypeId corresponds to the pack ID in AvamonPacks
            // since we create them in order: packTypeId 1 -> packId 1, etc.
            uint256 packId = quest.packTypeId;
            avamonPacks.mintPack(msg.sender, packId, 1);
            emit PackMinted(msg.sender, packId, quest.packTypeId);
            emit QuestRewardClaimed(msg.sender, 1, 1, true);
        } else {
            require(avamonToken.balanceOf(address(this)) >= quest.rewardAmount, "Insufficient reward pool");
            avamonToken.transfer(msg.sender, quest.rewardAmount);
            emit QuestRewardClaimed(msg.sender, 1, quest.rewardAmount, false);
        }

        emit QuestCompleted(msg.sender, 1);
    }

    function getUserQuestProgress(address _user, uint256 _questId) external view returns (UserQuestProgress memory) {
        return userQuestProgress[_user][_questId];
    }

    function getActiveQuestsForUser(address _user) external view returns (uint256[] memory) {
        return userActiveQuests[_user];
    }

    function getQuest(uint256 _questId) external view returns (Quest memory) {
        return quests[_questId];
    }

    // ============ VIEW FUNCTIONS FOR PACK OPENER ============

    function getPackType(uint256 _packTypeId) external view returns (
        uint256 id,
        string memory name,
        uint256 price,
        uint8[3] memory rarityChances,
        bool isActive
    ) {
        PackType memory packType = packTypes[_packTypeId];
        return (packType.id, packType.name, packType.price, packType.rarityChances, packType.isActive);
    }

    function getCardTemplate(uint256 _templateId) external view returns (
        uint256 id,
        string memory name,
        uint8 rarity,
        uint256 attack,
        uint256 defense,
        uint256 agility,
        uint256 hp,
        bool isActive
    ) {
        CardTemplate memory template = cardTemplates[_templateId];
        return (template.id, template.name, template.rarity, template.attack, template.defense, template.agility, template.hp, template.isActive);
    }

    function getCommonCardIds() external view returns (uint256[] memory) {
        return commonCardIds;
    }

    function getRareCardIds() external view returns (uint256[] memory) {
        return rareCardIds;
    }

    function getMythicCardIds() external view returns (uint256[] memory) {
        return mythicCardIds;
    }

    function _completeAdventure(
        address _player,
        uint256 _adventureId
    ) internal {
        ActiveAdventure storage activeAdv = activeAdventures[_player][_adventureId];
        Adventure memory adventure = adventures[_adventureId];

        require(!activeAdv.rewardClaimed, "Reward already claimed");
        require(activeAdv.startTime + adventure.duration <= block.timestamp, "Adventure not completed yet");

        // Calculate reward using block-based randomness
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, _player, _adventureId)));
        uint256 rewardRange = adventure.maxReward - adventure.minReward;
        uint256 reward = adventure.minReward + (randomSeed % (rewardRange + 1));

        // Check for pack drop
        bool packDropped = ((randomSeed >> 128) % 100) < adventure.packDropChance;

        // Mark as completed and claimed
        activeAdv.isCompleted = true;
        activeAdv.rewardClaimed = true;

        // Update quest progress for winning battles
        _updateQuestProgress(_player, QuestType.WinBattles, 1);

        // Return Avamons to player
        for (uint256 i = 0; i < activeAdv.avamonIds.length; i++) {
            avamonCards.transferFrom(address(this), _player, activeAdv.avamonIds[i]);
        }

        // Transfer reward
        if (reward > 0) {
            require(avamonToken.balanceOf(address(this)) >= reward, "Insufficient reward pool");
            avamonToken.transfer(_player, reward);
        }

        // Mint pack if dropped
        if (packDropped) {
            uint256 packId = avamonPacks.getNextPackId();
            avamonPacks.mintPack(_player, packId, 1);
            emit PackMinted(_player, packId, adventure.packTypeId);
        }

        emit AdventureCompleted(_player, _adventureId, reward, packDropped);
    }


    // ============ VIEW FUNCTIONS ============

    function getCurrentEnergy(address _player) external view returns (uint256) {
        uint256 energy = energyRemaining[_player];

        // Check if reset is needed
        if (_shouldResetEnergy(_player)) {
            return DAILY_ENERGY;
        }

        return energy;
    }

    function getActiveAdventures(address _player) external view returns (uint256[] memory) {
        uint256[] memory tempAdventures = new uint256[](nextAdventureId);
        uint256 count = 0;

        for (uint256 i = 1; i < nextAdventureId; i++) {
            if (activeAdventures[_player][i].startTime > 0 && !activeAdventures[_player][i].isCompleted) {
                tempAdventures[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempAdventures[i];
        }

        return result;
    }

    function getSavedDecks(address _player) external view returns (PlayerDeck[] memory) {
        return savedDecks[_player];
    }


    function getAdventure(uint256 _adventureId) external view returns (Adventure memory) {
        return adventures[_adventureId];
    }

    // ============ INTERNAL FUNCTIONS ============

    function _resetEnergyIfNeeded(address _player) internal {
        if (_shouldResetEnergy(_player)) {
            energyRemaining[_player] = DAILY_ENERGY;
            lastEnergyResetIST[_player] = block.timestamp;
        }
    }

    function _shouldResetEnergy(address _player) internal view returns (bool) {
        // Simple daily reset logic (24 hours)
        return block.timestamp >= lastEnergyResetIST[_player] + 24 hours;
    }

    function _updateQuestProgress(address _player, QuestType _questType, uint256 _increment) internal {
        // Find all active quests of this type for the player
        uint256[] memory activeQuestIds = userActiveQuests[_player];

        for (uint256 i = 0; i < activeQuestIds.length; i++) {
            uint256 questId = activeQuestIds[i];
            Quest memory quest = quests[questId];

            if (quest.questType == _questType && quest.isActive) {
                UserQuestProgress storage progress = userQuestProgress[_player][questId];

                // Check if quest needs to be reset (daily/weekly)
                if (_shouldResetQuest(_player, questId)) {
                    _resetUserQuest(_player, questId);
                }

                // Update progress if not completed
                if (!progress.isCompleted) {
                    progress.progress += _increment;
                    progress.lastUpdated = block.timestamp;

                    // Check if quest is completed
                    if (progress.progress >= quest.targetValue) {
                        progress.isCompleted = true;
                        emit QuestCompleted(_player, questId);
                    }

                    emit QuestProgressUpdated(_player, questId, progress.progress);
                }
            }
        }
    }

    function _shouldResetQuest(address _player, uint256 _questId) internal view returns (bool) {
        UserQuestProgress memory progress = userQuestProgress[_player][_questId];
        Quest memory quest = quests[_questId];

        uint256 resetInterval = quest.timeWindow * 1 days; // 1 day for daily, 7 days for weekly
        return block.timestamp >= progress.resetTime + resetInterval;
    }

    function _resetUserQuest(address _player, uint256 _questId) internal {
        userQuestProgress[_player][_questId] = UserQuestProgress({
            questId: _questId,
            progress: 0,
            isCompleted: false,
            isClaimed: false,
            lastUpdated: block.timestamp,
            resetTime: block.timestamp
        });
    }

    // ============ EMERGENCY FUNCTIONS ============

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawAVAX() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // ============ RECEIVE FUNCTION ============
    receive() external payable {}
}

