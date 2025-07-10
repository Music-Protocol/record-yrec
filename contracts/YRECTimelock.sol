// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title YRECTimelock
 * @dev Enhanced TimelockController for YREC governance with additional security features
 */
contract YRECTimelock is TimelockController {
    // Emergency delay for critical operations (48 hours)
    uint256 public constant EMERGENCY_DELAY = 48 hours;
    
    // Multisig threshold for emergency operations
    uint256 public constant MULTISIG_THRESHOLD = 3;
    uint256 public constant MULTISIG_TOTAL = 5;
    
    // Emergency multisig signers
    mapping(address => bool) public emergencySigners;
    mapping(bytes32 => mapping(address => bool)) public emergencyApprovals;
    mapping(bytes32 => uint256) public emergencyApprovalCount;
    
    // Events
    event EmergencySignerAdded(address indexed signer);
    event EmergencySignerRemoved(address indexed signer);
    event EmergencyApproval(bytes32 indexed operationId, address indexed signer);
    event EmergencyExecution(bytes32 indexed operationId);
    
    /**
     * @dev Constructor with implementation protection
     * @param minDelay Minimum delay for regular operations (24 hours)
     * @param proposers List of addresses that can propose operations
     * @param executors List of addresses that can execute operations
     * @param admin Admin address (should be the timelock itself for self-governance)
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        // Disable initializers to prevent potential implementation attacks
        // Even though this is not upgradeable, it's a best practice for defense-in-depth
        Initializable._disableInitializers();
    }
    
    /**
     * @dev Add an emergency signer
     * @param signer Address to add as emergency signer
     */
    function addEmergencySigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(signer != address(0), "Invalid signer address");
        require(!emergencySigners[signer], "Signer already exists");
        
        emergencySigners[signer] = true;
        emit EmergencySignerAdded(signer);
    }
    
    /**
     * @dev Remove an emergency signer
     * @param signer Address to remove from emergency signers
     */
    function removeEmergencySigner(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(emergencySigners[signer], "Signer does not exist");
        
        emergencySigners[signer] = false;
        emit EmergencySignerRemoved(signer);
    }
    
    /**
     * @dev Schedule an emergency operation with reduced delay
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Encoded function call data
     * @param predecessor Predecessor operation ID
     * @param salt Salt for operation uniqueness
     */
    function scheduleEmergency(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(PROPOSER_ROLE) {
        schedule(target, value, data, predecessor, salt, EMERGENCY_DELAY);
    }
    
    /**
     * @dev Approve an emergency operation (multisig)
     * @param operationId The operation ID to approve
     */
    function approveEmergency(bytes32 operationId) external {
        require(emergencySigners[msg.sender], "Not an emergency signer");
        require(isOperationPending(operationId), "Operation not pending");
        require(!emergencyApprovals[operationId][msg.sender], "Already approved");
        
        emergencyApprovals[operationId][msg.sender] = true;
        emergencyApprovalCount[operationId]++;
        
        emit EmergencyApproval(operationId, msg.sender);
    }
    
    /**
     * @dev Execute an emergency operation with multisig approval
     * @param target Target contract address
     * @param value ETH value to send
     * @param payload Encoded function call data
     * @param predecessor Predecessor operation ID
     * @param salt Salt for operation uniqueness
     */
    function executeEmergency(
        address target,
        uint256 value,
        bytes calldata payload,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(EXECUTOR_ROLE) {
        bytes32 operationId = hashOperation(target, value, payload, predecessor, salt);
        
        require(isOperationReady(operationId), "Operation not ready");
        require(
            emergencyApprovalCount[operationId] >= MULTISIG_THRESHOLD,
            "Insufficient emergency approvals"
        );
        
        execute(target, value, payload, predecessor, salt);
        emit EmergencyExecution(operationId);
    }
    
    /**
     * @dev Batch schedule multiple operations
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param payloads Array of encoded function calls
     * @param predecessor Predecessor operation ID
     * @param salt Salt for operation uniqueness
     * @param delay Delay before execution
     */
    function scheduleBatchCustom(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata payloads,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external onlyRole(PROPOSER_ROLE) {
        scheduleBatch(targets, values, payloads, predecessor, salt, delay);
    }
    
    /**
     * @dev Check if an operation is ready for execution
     * @param id Operation ID
     * @return bool True if operation is ready
     */
    function isReady(bytes32 id) external view returns (bool) {
        return isOperationReady(id);
    }
    
    /**
     * @dev Get operation timestamp
     * @param id Operation ID
     * @return uint256 Timestamp when operation becomes ready
     */
    function getOperationTimestamp(bytes32 id) external view returns (uint256) {
        return getTimestamp(id);
    }
    
    /**
     * @dev Check if address is an emergency signer
     * @param signer Address to check
     * @return bool True if address is emergency signer
     */
    function isEmergencySigner(address signer) external view returns (bool) {
        return emergencySigners[signer];
    }
    
    /**
     * @dev Get emergency approval count for operation
     * @param operationId Operation ID
     * @return uint256 Number of emergency approvals
     */
    function getEmergencyApprovalCount(bytes32 operationId) external view returns (uint256) {
        return emergencyApprovalCount[operationId];
    }
    
    /**
     * @dev Check if signer has approved emergency operation
     * @param operationId Operation ID
     * @param signer Signer address
     * @return bool True if signer has approved
     */
    function hasApprovedEmergency(bytes32 operationId, address signer) external view returns (bool) {
        return emergencyApprovals[operationId][signer];
    }
} 