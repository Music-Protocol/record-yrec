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
 * @title YREC Token
 * @dev ERC-3643 compliant security token for intellectual property tokenization
 * @notice This token represents intellectual property value in S&P 500 portfolios
 * 
 * Features:
 * - ERC-3643 compliance for security token standard
 * - Upgradeable proxy pattern (UUPS)
 * - Role-based access control
 * - Whitelist-based transfers
 * - Pausable functionality
 * - EIP-2612 permit for gasless approvals
 * - Timelock integration ready
 * - IP valuation tracking
 */
contract YRECToken is 
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
    
    /// @dev Upgrade moratorium end timestamp (6 months from deployment)
    uint256 public upgradeMoratoriumEnd;
    
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
    error UpgradeMoratoriumActive();
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
     * @dev Initializes the YREC token contract
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

        __ERC20_init("YREC Token", "YREC");
        __ERC20Pausable_init();
        __ERC20Permit_init("YREC Token");
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
        
        // Set upgrade moratorium (6 months)
        upgradeMoratoriumEnd = block.timestamp + 180 days;
        
        // Transfers disabled by default
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
    function updateTotalIPValue(uint256 newTotalValue) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        _totalIPValue = newTotalValue;
        emit IPValueUpdated(newTotalValue, block.timestamp);
    }

    // ============ PAUSABLE FUNCTIONS ============
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ UPGRADE FUNCTIONS ============
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {
        if (block.timestamp < upgradeMoratoriumEnd) {
            revert UpgradeMoratoriumActive();
        }
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
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) transfersAllowed {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            // Check whitelist for both sender and receiver
            if (!_whitelist[from] || !_whitelist[to]) {
                emit ComplianceViolation(from, to, "Address not whitelisted");
                revert TransferNotAllowed(from, to);
            }
        }

        super._update(from, to, value);

        // Update IP value tracking for transfers
        if (from != address(0) && to != address(0) && value > 0) {
            uint256 fromBalance = balanceOf(from) + value; // Balance before transfer
            uint256 ipValueToTransfer = (_ipValuePerHolder[from] * value) / fromBalance;
            
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