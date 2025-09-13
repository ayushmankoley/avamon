// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AvamonPacks
 * @dev ERC1155 token for Avamon TCG booster packs
 */
contract AvamonPacks is ERC1155, Ownable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    // Pack metadata
    struct PackInfo {
        uint256 packTypeId;
        string name;
        uint256 price; // $AM cost
        bool isActive;
    }

    mapping(uint256 => PackInfo) public packInfo;
    mapping(uint256 => string) private _uris;
    uint256 private _nextPackId = 1; // Start from 1 to match AvamonCore pack type IDs

    event PackCreated(uint256 indexed packId, uint256 indexed packTypeId, string name);
    event PackMinted(address indexed to, uint256 indexed packId, uint256 amount);

    constructor(address initialOwner)
        ERC1155("")
        Ownable(initialOwner)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(BURNER_ROLE, initialOwner);
    }

    /**
     * @dev Create a new pack type
     */
    function createPackType(
        uint256 packTypeId,
        string memory name,
        uint256 price
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 packId = _nextPackId++;

        packInfo[packId] = PackInfo({
            packTypeId: packTypeId,
            name: name,
            price: price,
            isActive: true
        });

        emit PackCreated(packId, packTypeId, name);
    }

    /**
     * @dev Mint packs
     */
    function mintPack(
        address to,
        uint256 packId,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        require(packInfo[packId].isActive, "Pack type not active");
        _mint(to, packId, amount, "");
        emit PackMinted(to, packId, amount);
    }

    /**
     * @dev Batch mint packs
     */
    function batchMintPacks(
        address to,
        uint256[] calldata packIds,
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) {
        require(packIds.length == amounts.length, "Array lengths mismatch");

        for (uint256 i = 0; i < packIds.length; i++) {
            require(packInfo[packIds[i]].isActive, "Pack type not active");
            _mint(to, packIds[i], amounts[i], "");
            emit PackMinted(to, packIds[i], amounts[i]);
        }
    }

    /**
     * @dev Burn packs (when opening)
     */
    function burnPack(
        address from,
        uint256 packId,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) {
        _burn(from, packId, amount);
    }

    /**
     * @dev Set URI for pack type
     */
    function setURI(uint256 packId, string memory newuri) external onlyOwner {
        _uris[packId] = newuri;
    }

    /**
     * @dev Override uri function
     */
    function uri(uint256 packId) public view virtual override returns (string memory) {
        string memory _uri = _uris[packId];
        if (bytes(_uri).length > 0) {
            return _uri;
        }
        // IPFS metadata - updated with new CID for pack metadata
        string memory filename = _getPackFilename(packId);
        return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/bafybeig5qr54usveydn7rvcwatglszea4a4z62yu4nsn3ow5cigx6ai5re/", filename));
    }

    /**
     * @dev Get the filename for a pack ID
     */
    function _getPackFilename(uint256 packId) internal pure returns (string memory) {
        if (packId == 1) return "blue.json";  // Pack ID 1 = Blue Pack (pack type ID 1)
        if (packId == 2) return "green.json"; // Pack ID 2 = Green Pack (pack type ID 2)
        if (packId == 3) return "red.json";   // Pack ID 3 = Red Pack (pack type ID 3)
        return "unknown.json"; // fallback
    }

    /**
     * @dev Update pack type status
     */
    function setPackActive(uint256 packId, bool isActive) external onlyOwner {
        packInfo[packId].isActive = isActive;
    }

    /**
     * @dev Get next pack ID
     */
    function getNextPackId() external view returns (uint256) {
        return _nextPackId;
    }

    /**
     * @dev Get pack info
     */
    function getPackInfo(uint256 packId) external view returns (PackInfo memory) {
        return packInfo[packId];
    }

    /**
     * @dev Grant minter role to a contract (e.g., AvamonCore)
     */
    function grantMinterRole(address account) external onlyOwner {
        grantRole(MINTER_ROLE, account);
    }

    /**
     * @dev Grant burner role to a contract (e.g., AvamonPackOpener)
     */
    function grantBurnerRole(address account) external onlyOwner {
        grantRole(BURNER_ROLE, account);
    }

    /**
     * @dev Override supportsInterface to support AccessControl
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get pack type info (for core contract)
     */
    function getPackTypeInfo(uint256 packId) external view returns (uint256 packTypeId, string memory name, uint256 price, bool isActive) {
        PackInfo memory info = packInfo[packId];
        return (info.packTypeId, info.name, info.price, info.isActive);
    }

    /**
     * @dev Get all pack types (for frontend)
     */
    function getAllPackTypes() external view returns (uint256[] memory) {
        if (_nextPackId <= 1) {
            return new uint256[](0);
        }
        
        uint256[] memory packTypeIds = new uint256[](_nextPackId - 1);
        for (uint256 i = 1; i < _nextPackId; i++) {
            packTypeIds[i - 1] = i;
        }
        return packTypeIds;
    }

    /**
     * @dev Emergency burn packs (admin only)
     */
    function emergencyBurnPacks(address from, uint256 packId, uint256 amount) external onlyOwner {
        _burn(from, packId, amount);
    }

    /**
     * @dev Update pack metadata URI
     */
    function updatePackMetadata(uint256 packId, string memory newUri) external onlyOwner {
        _uris[packId] = newUri;
    }
}
