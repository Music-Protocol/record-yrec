// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title SimpleMultisig
 * @dev A simple multisig wallet for testing purposes on Plume testnet
 * @notice This is a fallback solution if Gnosis Safe SDK doesn't support Plume network yet
 */
contract SimpleMultisig {
    // ============ STATE VARIABLES ============
    
    address[] public owners;
    uint256 public threshold;
    mapping(address => bool) public isOwner;
    
    uint256 public transactionCount;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    
    // ============ STRUCTS ============
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }
    
    // ============ EVENTS ============
    
    event TransactionSubmitted(uint256 indexed transactionId, address indexed to, uint256 value, bytes data);
    event TransactionConfirmed(uint256 indexed transactionId, address indexed owner);
    event TransactionExecuted(uint256 indexed transactionId);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);
    
    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier validThreshold(uint256 _threshold) {
        require(_threshold > 0 && _threshold <= owners.length, "Invalid threshold");
        _;
    }
    
    modifier transactionExists(uint256 _transactionId) {
        require(_transactionId < transactionCount, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 _transactionId) {
        require(!transactions[_transactionId].executed, "Transaction already executed");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(address[] memory _owners, uint256 _threshold) {
        // Disable initializers to prevent potential implementation attacks
        // Even though this is not upgradeable, it's a best practice for defense-in-depth
        Initializable._disableInitializers();
        
        require(_owners.length > 0, "Owners required");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner address");
            require(!isOwner[owner], "Duplicate owner");
            
            isOwner[owner] = true;
            owners.push(owner);
            emit OwnerAdded(owner);
        }
        
        // Validate threshold AFTER owners are added
        require(_threshold > 0 && _threshold <= owners.length, "Invalid threshold");
        
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }
    
    // ============ TRANSACTION FUNCTIONS ============
    
    /**
     * @dev Submit a new transaction proposal
     * @param to Target contract address
     * @param value ETH value to send
     * @param data Encoded function call data
     * @return transactionId The ID of the submitted transaction
     */
    function submitTransaction(address to, uint256 value, bytes memory data) 
        external onlyOwner returns (uint256 transactionId) {
        
        transactionId = transactionCount++;
        
        transactions[transactionId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmationCount: 0
        });
        
        emit TransactionSubmitted(transactionId, to, value, data);
        
        // Automatically confirm the transaction from the submitter
        confirmTransaction(transactionId);
        
        return transactionId;
    }
    
    /**
     * @dev Confirm a transaction proposal
     * @param transactionId The ID of the transaction to confirm
     */
    function confirmTransaction(uint256 transactionId) 
        public 
        onlyOwner 
        transactionExists(transactionId) 
        notExecuted(transactionId) 
    {
        require(!confirmations[transactionId][msg.sender], "Transaction already confirmed by this owner");
        
        confirmations[transactionId][msg.sender] = true;
        transactions[transactionId].confirmationCount++;
        
        emit TransactionConfirmed(transactionId, msg.sender);
        
        // Automatically execute if threshold is reached
        if (transactions[transactionId].confirmationCount >= threshold) {
            executeTransaction(transactionId);
        }
    }
    
    /**
     * @dev Revoke confirmation for a transaction
     * @param transactionId The ID of the transaction to revoke confirmation for
     */
    function revokeConfirmation(uint256 transactionId) 
        external 
        onlyOwner 
        transactionExists(transactionId) 
        notExecuted(transactionId) 
    {
        require(confirmations[transactionId][msg.sender], "Transaction not confirmed by this owner");
        
        confirmations[transactionId][msg.sender] = false;
        transactions[transactionId].confirmationCount--;
        
        // Note: No event for revocation in this simple implementation
    }
    
    /**
     * @dev Execute a confirmed transaction
     * @param transactionId The ID of the transaction to execute
     */
    function executeTransaction(uint256 transactionId) 
        internal 
        transactionExists(transactionId) 
        notExecuted(transactionId) 
    {
        Transaction storage txn = transactions[transactionId];
        require(txn.confirmationCount >= threshold, "Insufficient confirmations");
        
        txn.executed = true;
        
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction execution failed");
        
        emit TransactionExecuted(transactionId);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get all owners
     * @return Array of owner addresses
     */
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    /**
     * @dev Get number of owners
     * @return Number of owners
     */
    function getOwnerCount() external view returns (uint256) {
        return owners.length;
    }
    
    /**
     * @dev Get transaction details
     * @param transactionId The ID of the transaction
     * @return to Target address
     * @return value ETH value
     * @return data Call data
     * @return executed Whether executed
     * @return confirmationCount Number of confirmations
     */
    function getTransaction(uint256 transactionId) 
        external 
        view 
        transactionExists(transactionId)
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmationCount
        ) 
    {
        Transaction storage txn = transactions[transactionId];
        return (txn.to, txn.value, txn.data, txn.executed, txn.confirmationCount);
    }
    
    /**
     * @dev Check if transaction is confirmed by owner
     * @param transactionId The ID of the transaction
     * @param owner The owner address to check
     * @return Whether the owner has confirmed the transaction
     */
    function isConfirmed(uint256 transactionId, address owner) 
        external 
        view 
        transactionExists(transactionId)
        returns (bool) 
    {
        return confirmations[transactionId][owner];
    }
    
    /**
     * @dev Get confirmation count for a transaction
     * @param transactionId The ID of the transaction
     * @return Number of confirmations
     */
    function getConfirmationCount(uint256 transactionId) 
        external 
        view 
        transactionExists(transactionId)
        returns (uint256) 
    {
        return transactions[transactionId].confirmationCount;
    }
    
    /**
     * @dev Get list of owners who confirmed a transaction
     * @param transactionId The ID of the transaction
     * @return Array of owner addresses who confirmed
     */
    function getConfirmations(uint256 transactionId) 
        external 
        view 
        transactionExists(transactionId)
        returns (address[] memory) 
    {
        address[] memory confirmingOwners = new address[](owners.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                confirmingOwners[count] = owners[i];
                count++;
            }
        }
        
        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = confirmingOwners[i];
        }
        
        return result;
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Receive ETH deposits
     */
    receive() external payable {
        // Allow contract to receive ETH
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        // Allow contract to receive ETH via fallback
    }
    
    /**
     * @dev Get contract balance
     * @return ETH balance of the contract
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 