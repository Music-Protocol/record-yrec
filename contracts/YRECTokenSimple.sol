// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Yield-indexed IP Rights Exposure Certificate (YREC)
 * @dev Simple ERC20 token for intellectual property tokenization with governance
 * @notice Standard OpenZeppelin implementation with whitelist and timelock governance
 * 
 * Features:
 * - Upgradeable proxy pattern (UUPS)
 * - Role-based access control
 * - Whitelist management for compliance
 * - Timelock integration for secure upgrades
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
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant WHITELIST_MANAGER_ROLE = keccak256("WHITELIST_MANAGER_ROLE");

    // ============ STATE VARIABLES ============
    
    /// @dev Contract version for upgrades
    uint256 public constant VERSION = 2;
    
    /// @dev Custodial safe wallet - only address that can receive tokens
    address public custodialSafe;
    
    /// @dev Mapping of whitelisted addresses for compliance
    mapping(address => bool) private _whitelist;
    
    /// @dev Timelock contract address for enhanced upgrade security
    address public timelock;
    
    /// @dev Maximum batch size for whitelist operations to prevent gas limit issues
    uint256 public constant MAX_BATCH_SIZE = 500;

    // ============ EVENTS ============
    
    event CustodialSafeUpdated(address indexed oldSafe, address indexed newSafe);
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event TimelockUpdated(address indexed oldTimelock, address indexed newTimelock);

    // ============ ERRORS ============
    
    error TransferNotAllowed(address from, address to);
    error OnlyCustodialSafe(address provided, address required);
    error NotWhitelisted(address account);
    error ZeroAddress();
    error BatchSizeExceeded(uint256 provided, uint256 maximum);
    error UnauthorizedUpgrade(address caller, address expectedTimelock);
    error UnauthorizedMintBurn(address caller, address expectedTimelock);
    error TimelockUpdateNotAllowed();
    error CustodialSafeUpdateNotAllowed();

    // ============ MODIFIERS ============
    
    modifier onlyWhitelisted(address account) {
        if (!_whitelist[account]) revert NotWhitelisted(account);
        _;
    }

    modifier onlyTimelock() {
        if (msg.sender != timelock) revert UnauthorizedMintBurn(msg.sender, timelock);
        _;
    }

    // ============ INITIALIZER ============
    
    /**
     * @dev Initializes the YREC token contract
     * @param initialOwner Address that will receive DEFAULT_ADMIN_ROLE and other roles
     * @param _custodialSafe Custodial safe wallet that will hold all tokens
     * @param _timelock Address of the timelock contract for enhanced upgrade security
     */
    function initialize(
        address initialOwner,
        address _custodialSafe,
        address _timelock
    ) public initializer {
        if (initialOwner == address(0) || _custodialSafe == address(0) || _timelock == address(0)) {
            revert ZeroAddress();
        }

        __ERC20_init("Yield-indexed IP Rights Exposure Certificate", "YREC");
        __ERC20Pausable_init();
        __ERC20Permit_init("Yield-indexed IP Rights Exposure Certificate");
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Set up roles - all to initialOwner for simplicity
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
        _grantRole(UPGRADER_ROLE, initialOwner);
        _grantRole(WHITELIST_MANAGER_ROLE, initialOwner);

        custodialSafe = _custodialSafe;
        timelock = _timelock;
        
        // Initialize whitelist with custodial safe and owner
        _whitelist[_custodialSafe] = true;
        _whitelist[initialOwner] = true;
        
        emit CustodialSafeUpdated(address(0), _custodialSafe);
        emit TimelockUpdated(address(0), _timelock);
        emit WhitelistUpdated(_custodialSafe, true);
        emit WhitelistUpdated(initialOwner, true);
    }

    // ============ MINTING & BURNING ============
    
    /**
     * @dev Mints tokens to the custodial safe wallet (TIMELOCK REQUIRED)
     * @param amount Amount of tokens to mint
     * @notice This function requires a 6-hour timelock delay for security
     */
    function mint(uint256 amount) external onlyWhitelisted(custodialSafe) onlyTimelock whenNotPaused {
        _mint(custodialSafe, amount);
    }

    /**
     * @dev Burns tokens from the custodial safe wallet (TIMELOCK REQUIRED)
     * @param amount Amount of tokens to burn
     * @notice This function requires a 6-hour timelock delay for security
     */
    function burn(uint256 amount) external onlyWhitelisted(custodialSafe) onlyTimelock whenNotPaused {
        _burn(custodialSafe, amount);
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
     * @dev Batch whitelist update for efficiency with gas limit protection
     * @param accounts Array of addresses to update (max 500 to prevent gas limit issues)
     * @param whitelisted Whether the addresses should be whitelisted
     */
    function batchUpdateWhitelist(
        address[] calldata accounts,
        bool whitelisted
    ) external onlyRole(WHITELIST_MANAGER_ROLE) {
        if (accounts.length > MAX_BATCH_SIZE) {
            revert BatchSizeExceeded(accounts.length, MAX_BATCH_SIZE);
        }
        
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0)) {
                _whitelist[accounts[i]] = whitelisted;
                emit WhitelistUpdated(accounts[i], whitelisted);
            }
        }
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Updates the custodial safe address (TIMELOCK REQUIRED)
     * @param newCustodialSafe New custodial safe address
     * @notice This function requires a 6-hour timelock delay for security
     */
    function updateCustodialSafe(address newCustodialSafe) external onlyTimelock {
        if (newCustodialSafe == address(0)) revert ZeroAddress();
        
        address oldSafe = custodialSafe;
        custodialSafe = newCustodialSafe;
        
        // Auto-whitelist new custodial safe
        _whitelist[newCustodialSafe] = true;
        
        emit CustodialSafeUpdated(oldSafe, newCustodialSafe);
        emit WhitelistUpdated(newCustodialSafe, true);
    }

    /**
     * @dev Updates the timelock address (TIMELOCK REQUIRED)
     * @param newTimelock New timelock contract address
     * @notice This function requires a 6-hour timelock delay for security
     */
    function updateTimelock(address newTimelock) external onlyTimelock {
        if (newTimelock == address(0)) revert ZeroAddress();
        if (newTimelock == address(this)) revert TimelockUpdateNotAllowed();
        
        address oldTimelock = timelock;
        timelock = newTimelock;
        
        emit TimelockUpdated(oldTimelock, newTimelock);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ UPGRADE FUNCTIONS ============
    
    /**
     * @dev Standard upgrade authorization - immediate upgrades with role control only
     * @notice Contract upgrades are immediate (no timelock delay) for operational flexibility
     * @notice Upgrades are blocked when contract is paused for security
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) whenNotPaused {
        // Standard OpenZeppelin upgrade pattern - immediate upgrades
        // Only UPGRADER_ROLE required, no timelock delays for upgrades
        // This allows for quick fixes and updates when needed
        // Upgrades blocked when paused for security
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Returns whether an address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }

    /**
     * @dev Returns the total IP value backing all YREC tokens
     * @notice For YREC, total IP value equals total supply due to 1:1 USD backing
     * @return Total IP value in USD (with 18 decimals)
     */
    function getTotalIPValue() external view returns (uint256) {
        // For YREC, total IP value equals total supply due to 1:1 USD backing
        return totalSupply();
    }

    /**
     * @dev Returns the IP value per token
     * @notice For YREC, each token represents exactly $1 USD of IP value
     * @return IP value per token in USD (with 18 decimals)
     */
    function getIPValuePerToken() external view returns (uint256) {
        // Each YREC token represents exactly $1 USD of IP value
        return 1e18; // $1.00 with 18 decimals
    }

    /**
     * @dev Returns the IP value for a specific holder
     * @param holder Address of the token holder
     * @return IP value for the holder in USD (with 18 decimals)
     */
    function getIPValueForHolder(address holder) external view returns (uint256) {
        // IP value equals token balance due to 1:1 backing
        return balanceOf(holder);
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

    // ============ STORAGE GAP ============
    
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * The size of the __gap array is calculated so that the amount of storage used by a
     * contract always adds up to the same 50 slots, plus the storage used by the parent contracts.
     */
    uint256[50] private __gap;
} 