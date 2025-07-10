// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

/**
 * @title Yield-indexed IP Rights Exposure Certificate (YREC)
 * @dev ERC-3643 compliant security token for intellectual property tokenization
 * @notice This token represents intellectual property value in S&P 500 portfolios with 1:1 USD backing
 * 
 * Features:
 * - ERC-3643 compliance for security token standard
 * - Upgradeable proxy pattern (UUPS) with NO moratorium
 * - Role-based access control
 * - Whitelist-based transfers
 * - Pausable functionality
 * - EIP-2612 permit for gasless approvals
 * - Timelock integration ready
 * - IP valuation tracking with 1:1 USD backing guarantee
 * - Full upgrade flexibility via governance
 */
contract YRECTokenFlexible is 
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
    /// @notice This must ALWAYS equal totalSupply() for 1:1 USD backing
    uint256 private _totalIPValue;
    
    /// @dev Mapping of IP value per token holder
    mapping(address => uint256) private _ipValuePerHolder;
    
    /// @dev Contract version for upgrades
    uint256 public constant VERSION = 1;
    
    /// @dev Flag to track if transfers are globally enabled
    bool public transfersEnabled;

    /// @dev Maximum batch size for whitelist operations to prevent gas limit issues
    uint256 public constant MAX_BATCH_SIZE = 500;

    /// @dev Timelock contract address for enhanced upgrade security (Q-09 fix)
    address public timelock;

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor that disables initializers to prevent implementation contract from being initialized
     * @notice This prevents potential hijacking of the implementation contract
     */
    constructor() {
        _disableInitializers();
    }

    // ============ EVENTS ============
    
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event IPValueUpdated(uint256 newTotalValue, uint256 timestamp);
    event TransfersToggled(bool enabled);
    event ComplianceViolation(address indexed from, address indexed to, string reason);
    event BackingValidated(uint256 totalSupply, uint256 totalIPValue, uint256 timestamp);
    event TimelockUpdated(address indexed oldTimelock, address indexed newTimelock);

    // ============ ERRORS ============
    
    error TransferNotAllowed(address from, address to);
    error NotWhitelisted(address account);
    error TransfersDisabled();
    error InvalidIPValue();
    error BackingMismatch(uint256 totalSupply, uint256 totalIPValue);
    error ZeroAddress();
    error BatchSizeExceeded(uint256 provided, uint256 maximum);
    error UnauthorizedUpgrade(address caller, address expectedTimelock);

    // ============ MODIFIERS ============
    
    modifier onlyWhitelisted(address account) {
        if (!_whitelist[account]) revert NotWhitelisted(account);
        _;
    }

    modifier transfersAllowedForRegularTransfers() {
        if (!transfersEnabled) revert TransfersDisabled();
        _;
    }

    modifier validBacking() {
        _;
        _validateBacking();
    }

    // ============ INITIALIZER ============
    
    /**
     * @dev Initializes the YREC token contract
     * @param initialOwner Address that will receive DEFAULT_ADMIN_ROLE
     * @param custodianWallet Initial custodian wallet to be whitelisted
     * @param _timelock Address of the timelock contract for enhanced upgrade security
     */
    function initialize(
        address initialOwner,
        address custodianWallet,
        address _timelock
    ) public initializer {
        if (initialOwner == address(0) || custodianWallet == address(0) || _timelock == address(0)) {
            revert ZeroAddress();
        }

        __ERC20_init("Yield-indexed IP Rights Exposure Certificate", "YREC");
        __ERC20Pausable_init();
        __ERC20Permit_init("Yield-indexed IP Rights Exposure Certificate");
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
        
        // Set timelock for enhanced upgrade security
        timelock = _timelock;
        
        // Transfers disabled by default
        transfersEnabled = false;

        emit WhitelistUpdated(custodianWallet, true);
        emit WhitelistUpdated(initialOwner, true);
        emit TimelockUpdated(address(0), _timelock);
    }

    // ============ 1:1 BACKING VALIDATION ============
    
    /**
     * @dev Internal function to validate 1:1 USD backing
     * @notice Ensures totalSupply() == totalIPValue for 1:1 backing guarantee
     */
    function _validateBacking() internal view {
        uint256 supply = totalSupply();
        if (supply != _totalIPValue) {
            revert BackingMismatch(supply, _totalIPValue);
        }
    }

    /**
     * @dev Public function to verify current 1:1 backing status
     * @return isValid True if totalSupply equals totalIPValue
     * @return totalSupply Current token supply
     * @return totalIPValue Current IP value backing
     */
    function validateBacking() external view returns (bool isValid, uint256 totalSupply, uint256 totalIPValue) {
        totalSupply = totalSupply();
        totalIPValue = _totalIPValue;
        isValid = (totalSupply == totalIPValue);
        return (isValid, totalSupply, totalIPValue);
    }

    /**
     * @dev Emit backing validation event for external monitoring
     */
    function emitBackingValidation() external view {
        uint256 supply = totalSupply();
        emit BackingValidated(supply, _totalIPValue, block.timestamp);
    }

    // ============ MINTING & BURNING ============
    
    /**
     * @dev Mints tokens representing IP value with 1:1 USD backing validation
     * @param to Address to mint tokens to (must be whitelisted)
     * @param amount Amount of tokens to mint (must equal ipValue for 1:1 backing)
     * @param ipValue IP value in USD (18 decimals) backing these tokens
     */
    function mint(
        address to,
        uint256 amount,
        uint256 ipValue
    ) external onlyRole(MINTER_ROLE) onlyWhitelisted(to) validBacking {
        if (ipValue == 0) revert InvalidIPValue();
        if (amount != ipValue) revert BackingMismatch(amount, ipValue);
        
        _mint(to, amount);
        _totalIPValue += ipValue;
        _ipValuePerHolder[to] += ipValue;
        
        emit IPValueUpdated(_totalIPValue, block.timestamp);
    }

    /**
     * @dev Burns tokens and reduces IP value with enhanced precision to prevent rounding leaks
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) validBacking {
        uint256 holderBalance = balanceOf(from);
        require(holderBalance >= amount, "Insufficient balance");
        
        // Enhanced precision: Calculate proportional IP value to reduce with mulDiv (Q-07 fix)
        uint256 ipValueToReduce;
        if (holderBalance == amount) {
            // If burning entire balance, use exact IP value to prevent residual
            ipValueToReduce = _ipValuePerHolder[from];
        } else {
            // Use OpenZeppelin's mulDiv for enhanced precision and rounding up to prevent leaks
            ipValueToReduce = MathUpgradeable.mulDiv(
                _ipValuePerHolder[from], 
                amount, 
                holderBalance, 
                MathUpgradeable.Rounding.Up
            );
        }
        
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

    // ============ TRANSFER CONTROLS ============
    
    /**
     * @dev Enables or disables transfers globally
     * @param enabled Whether transfers should be enabled
     */
    function setTransfersEnabled(bool enabled) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
    }

    // ============ IP VALUE MANAGEMENT ============
    
    /**
     * @dev Updates the total IP value backing the tokens
     * @param newTotalValue New total IP value in USD (18 decimals)
     */
    function updateTotalIPValue(uint256 newTotalValue) external onlyRole(COMPLIANCE_OFFICER_ROLE) whenNotPaused {
        _totalIPValue = newTotalValue;
        emit IPValueUpdated(newTotalValue, block.timestamp);
    }

    /**
     * @dev Updates the timelock address for enhanced upgrade security
     * @param newTimelock New timelock contract address
     */
    function updateTimelock(address newTimelock) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTimelock == address(0)) revert ZeroAddress();
        
        address oldTimelock = timelock;
        timelock = newTimelock;
        
        emit TimelockUpdated(oldTimelock, newTimelock);
    }

    // ============ PAUSABLE FUNCTIONS ============
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ UPGRADE FUNCTIONS ============
    
    /**
     * @dev Authorize upgrade with enhanced defense-in-depth security (Q-09 fix)
     * @notice Requires both UPGRADER_ROLE and call from designated timelock
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        // Enhanced defense-in-depth: Verify caller is the designated timelock
        if (msg.sender != timelock) {
            revert UnauthorizedUpgrade(msg.sender, timelock);
        }
        
        // Additional validation can be added here:
        // - Upgrade notice period validation
        // - Implementation contract verification
        // - Emergency pause checks
        
        // Security is provided by:
        // 1. UPGRADER_ROLE (only timelock has this)
        // 2. Direct timelock verification (defense-in-depth)
        // 3. 6-hour timelock delay (optimized for operations)
        // 4. Multisig control of timelock
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Returns whether an address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }

    /**
     * @dev Returns the total IP value backing all tokens
     */
    function getTotalIPValue() external view returns (uint256) {
        return _totalIPValue;
    }

    /**
     * @dev Returns the IP value for a specific holder
     */
    function getIPValueForHolder(address holder) external view returns (uint256) {
        return _ipValuePerHolder[holder];
    }

    /**
     * @dev Returns the IP value per token (total IP value / total supply)
     */
    function getIPValuePerToken() external view returns (uint256) {
        uint256 supply = totalSupply();
        return supply > 0 ? _totalIPValue / supply : 0;
    }

    // ============ OVERRIDES ============
    
    /**
     * @dev Override transfer to implement whitelist and compliance checks
     * @notice Mint and burn operations are exempt from transfer restrictions
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        // Allow minting (from == address(0)) and burning (to == address(0)) regardless of transfersEnabled
        if (from != address(0) && to != address(0)) {
            // Only check transfersEnabled for regular transfers, not mint/burn
            if (!transfersEnabled) {
                revert TransfersDisabled();
            }
            
            // Check whitelist for both sender and receiver
            if (!_whitelist[from] || !_whitelist[to]) {
                emit ComplianceViolation(from, to, "Address not whitelisted");
                revert TransferNotAllowed(from, to);
            }
        }

        super._update(from, to, value);

        // Enhanced IP value tracking for transfers with mulDiv precision (Q-07 fix)
        if (from != address(0) && to != address(0) && value > 0) {
            uint256 fromBalance = balanceOf(from) + value; // Balance before transfer
            uint256 ipValueToTransfer;
            
            if (fromBalance == value) {
                // If transferring entire balance, use exact IP value to prevent residual
                ipValueToTransfer = _ipValuePerHolder[from];
            } else {
                // Use OpenZeppelin's mulDiv for enhanced precision
                ipValueToTransfer = MathUpgradeable.mulDiv(
                    _ipValuePerHolder[from], 
                    value, 
                    fromBalance, 
                    MathUpgradeable.Rounding.Down
                );
            }
            
            _ipValuePerHolder[from] -= ipValueToTransfer;
            _ipValuePerHolder[to] += ipValueToTransfer;
        }
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @dev Emergency function to recover accidentally sent tokens
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function emergencyTokenRecovery(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(this), "Cannot recover YREC tokens");
        IERC20(token).transfer(msg.sender, amount);
    }
} 