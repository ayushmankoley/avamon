// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AvamonToken
 * @dev ERC20 token for Avamon TCG ($AM)
 * Total supply: 10,000,000 $AM
 */
contract AvamonToken is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 10000000 * 10**18; // 10M $AM

    constructor(address initialOwner)
        ERC20("Avamon Token", "AM")
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from specific account (only owner)
     */
    function burnFrom(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}
