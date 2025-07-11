// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Yield-indexed IP Rights Exposure Certificate (YREC)
 * @dev Simple ERC20 token for intellectual property tokenization
 * @notice Standard OpenZeppelin implementation with minimal modifications
 * 
 * Features:
 * - Upgradeable proxy pattern (UUPS)
 * - Role-based access control
 * - Pausable functionality
 * - EIP-2612 permit for gasless approvals
 * - Simple mint/burn to custodial safe wallet
 * - Non-transferable (only mint/burn allowed)
 */
contract YRECTokenSimple is 
    Initializable,
    ERC20Upgradeable,
    ERC20PausableUpgradeable,
    ERC20PermitUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // ============ ROLES ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ============ STATE VARIABLES ============
    
    /// @dev Contract version for upgrades
    uint256 public constant VERSION = 2;
    
    /// @dev Custodial safe wallet - only address that can receive tokens
    address public custodialSafe;

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor that disables initializers to prevent implementation contract hijacking
     */
    constructor() {
        _disableInitializers();
    }

    // ============ EVENTS ============
    
    event CustodialSafeUpdated(address indexed oldSafe, address indexed newSafe);

    // ============ ERRORS ============
    
    error TransferNotAllowed(address from, address to);
    error OnlyCustodialSafe(address provided, address required);
    error ZeroAddress();

    // ============ INITIALIZER ============
    
    /**
     * @dev Initializes the YREC token contract
     * @param initialOwner Address that will receive DEFAULT_ADMIN_ROLE and other roles
     * @param _custodialSafe Custodial safe wallet that will hold all tokens
     */
    function initialize(
        address initialOwner,
        address _custodialSafe
    ) public initializer {
        if (initialOwner == address(0) || _custodialSafe == address(0)) {
            revert ZeroAddress();
        }

        __ERC20_init("Yield-indexed IP Rights Exposure Certificate", "YREC");
        __ERC20Pausable_init();
        __ERC20Permit_init("Yield-indexed IP Rights Exposure Certificate");
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Set up roles - all to initialOwner for simplicity
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(BURNER_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);

        custodialSafe = _custodialSafe;
        
        emit CustodialSafeUpdated(address(0), _custodialSafe);
    }

    // ============ MINTING & BURNING ============
    
    /**
     * @dev Mints tokens to the custodial safe wallet
     * @param amount Amount of tokens to mint
     */
    function mint(uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(custodialSafe, amount);
    }

    /**
     * @dev Burns tokens from the custodial safe wallet
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
        _burn(custodialSafe, amount);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Updates the custodial safe address
     * @param newCustodialSafe New custodial safe address
     */
    function updateCustodialSafe(address newCustodialSafe) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newCustodialSafe == address(0)) revert ZeroAddress();
        
        address oldSafe = custodialSafe;
        custodialSafe = newCustodialSafe;
        
        emit CustodialSafeUpdated(oldSafe, newCustodialSafe);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ UPGRADE FUNCTIONS ============
    
    /**
     * @dev Standard upgrade authorization - only UPGRADER_ROLE can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Standard OpenZeppelin upgrade pattern - no modifications
    }

    // ============ OVERRIDES ============
    
    /**
     * @dev Override transfer to prevent all transfers except mint/burn
     * @notice Only minting (from == address(0)) and burning (to == address(0)) are allowed
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        // Only allow mint (from == address(0)) and burn (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed(from, to);
        }
        
        // For minting, ensure tokens only go to custodial safe
        if (from == address(0) && to != custodialSafe) {
            revert OnlyCustodialSafe(to, custodialSafe);
        }
        
        // For burning, ensure tokens only burn from custodial safe
        if (to == address(0) && from != custodialSafe) {
            revert OnlyCustodialSafe(from, custodialSafe);
        }

        super._update(from, to, value);
    }

    /**
     * @dev Returns 18 decimals (standard)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
} 