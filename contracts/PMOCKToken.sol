// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title PMOCK Token (Professional Mock Token)
 * @dev ERC-3643 compliant security token for testing intellectual property tokenization
 * @notice This token represents a testing version for IP value in S&P 500 portfolios
 * 
 * Features:
 * - ERC-3643 compliance for security token standard
 * - Upgradeable proxy pattern (UUPS)
 * - Role-based access control
 * - Whitelist-based transfers
 * - Pausable functionality
 * - EIP-2612 permit for gasless approvals
 * - IP valuation tracking
 * - Simplified for testing (no timelock requirement)
 */
contract PMOCKToken is 
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
    bytes32 public constant WHITELIST_MANAGER_ROLE = keccak256("WHITELIST_MANAGER_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");

    // ============ STATE VARIABLES ============
    
    /// @dev Mapping of whitelisted addresses for transfers
    mapping(address => bool) private _whitelist;
    
    /// @dev Total IP value backing the tokens (in USD, 18 decimals)
    uint256 private _totalIPValue;
    
    /// @dev Mapping of IP value per token holder
    mapping(address => uint256) private _ipValuePerHolder;
    
    /// @dev Contract version for upgrades
    uint256 public constant VERSION = 1;
    
    /// @dev Flag to track if transfers are globally enabled
    bool public transfersEnabled;

    // ============ EVENTS ============
    
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event IPValueUpdated(uint256 newTotalValue, uint256 timestamp);
    event TransfersToggled(bool enabled);
    event ComplianceViolation(address indexed from, address indexed to, string reason);

    // ============ ERRORS ============
    
    error TransferNotAllowed(address from, address to);
    error NotWhitelisted(address account);
    error TransfersDisabled();
    error InvalidIPValue();
    error ZeroAddress();

    // ============ MODIFIERS ============
    
    modifier onlyWhitelisted(address account) {
        if (!_whitelist[account]) revert NotWhitelisted(account);
        _;
    }

    modifier transfersAllowed() {
        if (!transfersEnabled) revert TransfersDisabled();
        _;
    }

    // ============ INITIALIZER ============
    
    /**
     * @dev Initializes the PMOCK token contract
     * @param initialOwner Address that will receive DEFAULT_ADMIN_ROLE
     * @param custodianWallet Initial custodian wallet to be whitelisted
     */
    function initialize(
        address initialOwner,
        address custodianWallet
    ) public initializer {
        if (initialOwner == address(0) || custodianWallet == address(0)) {
            revert ZeroAddress();
        }

        __ERC20_init("Professional Mock Token", "PMOCK");
        __ERC20Pausable_init();
        __ERC20Permit_init("Professional Mock Token");
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(BURNER_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(WHITELIST_MANAGER_ROLE, initialOwner);
        _grantRole(COMPLIANCE_OFFICER_ROLE, initialOwner);

        // Initialize whitelist with custodian
        _whitelist[custodianWallet] = true;
        _whitelist[initialOwner] = true;
        
        // Transfers disabled by default for testing
        transfersEnabled = false;

        emit WhitelistUpdated(custodianWallet, true);
        emit WhitelistUpdated(initialOwner, true);
    }

    // ============ MINTING & BURNING ============
    
    /**
     * @dev Mints tokens representing IP value
     * @param to Address to mint tokens to (must be whitelisted)
     * @param amount Amount of tokens to mint
     * @param ipValue IP value in USD (18 decimals) backing these tokens
     */
    function mint(
        address to,
        uint256 amount,
        uint256 ipValue
    ) external onlyRole(MINTER_ROLE) onlyWhitelisted(to) {
        if (ipValue == 0) revert InvalidIPValue();
        
        _mint(to, amount);
        _totalIPValue += ipValue;
        _ipValuePerHolder[to] += ipValue;
        
        emit IPValueUpdated(_totalIPValue, block.timestamp);
    }

    /**
     * @dev Burns tokens and reduces IP value
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        uint256 holderBalance = balanceOf(from);
        require(holderBalance >= amount, "Insufficient balance");
        
        // Calculate proportional IP value to reduce
        uint256 ipValueToReduce = (_ipValuePerHolder[from] * amount) / holderBalance;
        
        _burn(from, amount);
        _totalIPValue -= ipValueToReduce;
        _ipValuePerHolder[from] -= ipValueToReduce;
        
        emit IPValueUpdated(_totalIPValue, block.timestamp);
    }

    // ============ WHITELIST MANAGEMENT ============
    
    /**
     * @dev Adds or removes an address from the whitelist
     * @param account Address to update
     * @param whitelisted Whether the address should be whitelisted
     */
    function updateWhitelist(
        address account,
        bool whitelisted
    ) external onlyRole(WHITELIST_MANAGER_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        
        _whitelist[account] = whitelisted;
        emit WhitelistUpdated(account, whitelisted);
    }

    /**
     * @dev Batch whitelist update for efficiency
     * @param accounts Array of addresses to update
     * @param whitelisted Whether the addresses should be whitelisted
     */
    function batchUpdateWhitelist(
        address[] calldata accounts,
        bool whitelisted
    ) external onlyRole(WHITELIST_MANAGER_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert ZeroAddress();
            _whitelist[accounts[i]] = whitelisted;
            emit WhitelistUpdated(accounts[i], whitelisted);
        }
    }

    /**
     * @dev Checks if an address is whitelisted
     * @param account Address to check
     * @return bool Whether the address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }

    // ============ TRANSFER CONTROLS ============
    
    /**
     * @dev Enables or disables transfers globally
     * @param enabled Whether transfers should be enabled
     */
    function toggleTransfers(bool enabled) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
    }

    // ============ IP VALUE TRACKING ============
    
    /**
     * @dev Gets the total IP value backing all tokens
     * @return uint256 Total IP value in USD (18 decimals)
     */
    function getTotalIPValue() external view returns (uint256) {
        return _totalIPValue;
    }

    /**
     * @dev Gets the IP value for a specific token holder
     * @param holder Address of the token holder
     * @return uint256 IP value for the holder in USD (18 decimals)
     */
    function getIPValueForHolder(address holder) external view returns (uint256) {
        return _ipValuePerHolder[holder];
    }

    /**
     * @dev Updates IP value for accounting purposes (compliance officer only)
     * @param newTotalValue New total IP value
     */
    function updateTotalIPValue(uint256 newTotalValue) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _totalIPValue = newTotalValue;
        emit IPValueUpdated(_totalIPValue, block.timestamp);
    }

    // ============ PAUSABLE FUNCTIONALITY ============
    
    /**
     * @dev Pauses all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ TRANSFER LOGIC OVERRIDE ============
    
    /**
     * @dev Override transfer logic to include whitelist and transfer controls
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            // Regular transfers require both addresses to be whitelisted and transfers to be enabled
            if (!transfersEnabled) revert TransfersDisabled();
            if (!_whitelist[from] || !_whitelist[to]) {
                emit ComplianceViolation(from, to, "Addresses not whitelisted");
                revert TransferNotAllowed(from, to);
            }
        }
        
        super._update(from, to, amount);
    }

    // ============ UPGRADE FUNCTIONALITY ============
    
    /**
     * @dev Authorize upgrade (only UPGRADER_ROLE can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // ============ ACCESS CONTROL EXTENSIONS ============
    
    /**
     * @dev Grant multiple roles to an address (for efficiency)
     * @param account Address to grant roles to
     * @param roles Array of role identifiers
     */
    function grantMultipleRoles(
        address account,
        bytes32[] calldata roles
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < roles.length; i++) {
            _grantRole(roles[i], account);
        }
    }

    /**
     * @dev Revoke multiple roles from an address (for efficiency)
     * @param account Address to revoke roles from
     * @param roles Array of role identifiers
     */
    function revokeMultipleRoles(
        address account,
        bytes32[] calldata roles
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < roles.length; i++) {
            _revokeRole(roles[i], account);
        }
    }

    // ============ EMERGENCY FUNCTIONS (Testing Only) ============
    
    /**
     * @dev Emergency function to reset contract state for testing
     * @notice This function should be removed for production deployment
     */
    function emergencyReset() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _totalIPValue = 0;
        transfersEnabled = false;
        // Note: Cannot easily reset all holder IP values without additional mapping
        emit IPValueUpdated(0, block.timestamp);
        emit TransfersToggled(false);
    }
} 