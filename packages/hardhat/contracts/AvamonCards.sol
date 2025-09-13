// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AvamonCards
 * @dev ERC721 token for Avamon TCG cards
 */
contract AvamonCards is ERC721, Ownable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    // Card metadata
    struct CardStats {
        uint256 templateId;
        uint256 attack;
        uint256 defense;
        uint256 agility;
        uint256 hp;
        uint8 rarity; // 0: Common, 1: Rare, 2: Mythic
    }

    mapping(uint256 => CardStats) public cardStats;
    mapping(uint256 => string) private _tokenURIs;

    event CardMinted(address indexed to, uint256 indexed tokenId, uint256 templateId);

    constructor(address initialOwner)
        ERC721("Avamon", "AVAMON")
        Ownable(initialOwner)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }

    /**
     * @dev Mint a new Avamon card
     */
    function mintCard(
        address to,
        uint256 templateId,
        uint256 attack,
        uint256 defense,
        uint256 agility,
        uint256 hp,
        uint8 rarity
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);

        cardStats[tokenId] = CardStats({
            templateId: templateId,
            attack: attack,
            defense: defense,
            agility: agility,
            hp: hp,
            rarity: rarity
        });

        emit CardMinted(to, tokenId, templateId);
        return tokenId;
    }

    /**
     * @dev Batch mint multiple cards
     */
    function batchMintCards(
        address to,
        uint256[] calldata templateIds,
        uint256[] calldata attacks,
        uint256[] calldata defenses,
        uint256[] calldata agilities,
        uint256[] calldata hps,
        uint8[] calldata rarities
    ) external onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        require(
            templateIds.length == attacks.length &&
            attacks.length == defenses.length &&
            defenses.length == agilities.length &&
            agilities.length == hps.length &&
            hps.length == rarities.length,
            "Array lengths mismatch"
        );

        uint256[] memory tokenIds = new uint256[](templateIds.length);

        for (uint256 i = 0; i < templateIds.length; i++) {
            tokenIds[i] = _nextTokenId++;
            _mint(to, tokenIds[i]);

            cardStats[tokenIds[i]] = CardStats({
                templateId: templateIds[i],
                attack: attacks[i],
                defense: defenses[i],
                agility: agilities[i],
                hp: hps[i],
                rarity: rarities[i]
            });

            emit CardMinted(to, tokenIds[i], templateIds[i]);
        }

        return tokenIds;
    }

    /**
     * @dev Set token URI
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        require(exists(tokenId), "ERC721: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev Override tokenURI to return custom URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }

        // IPFS metadata - updated with new CID for card metadata
        return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/bafybeig5qr54usveydn7rvcwatglszea4a4z62yu4nsn3ow5cigx6ai5re/", Strings.toString(cardStats[tokenId].templateId), ".json"));
    }

    /**
     * @dev Check if token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Grant minter role to a contract (e.g., AvamonCore, AvamonPackOpener)
     */
    function grantMinterRole(address account) external onlyOwner {
        grantRole(MINTER_ROLE, account);
    }

    /**
     * @dev Override supportsInterface to support AccessControl
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
