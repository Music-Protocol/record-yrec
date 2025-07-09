import { ethers } from "hardhat";

async function main() {
  console.log("🔐 Setting up Gnosis Safe on Plume Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // ============ CONFIGURATION ============
  
  // Actual team addresses
  const MULTISIG_OWNERS = [
    deployer.address, // Current deployer: 0xf002BDD262b067Fd79E0BF1D101D35418811aE35
    "0x85Bf0Fe60a36BbE276E3C2f593a5Dc32b2524b70", // Project leader
    "0x1462295A95d79B0A3eE467ddA38fa1143fda48B4", // Admin
  ];

  const MULTISIG_THRESHOLD = 2; // 2 out of 3 signatures required for production (majority)
  const TESTNET_THRESHOLD = 1; // 1 signature for testing

  console.log("⚙️  Multisig Configuration:");
  console.log("   Owners:", MULTISIG_OWNERS.length);
  console.log("   Threshold (Production):", MULTISIG_THRESHOLD);
  console.log("   Threshold (Testing):", TESTNET_THRESHOLD);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("");

  // ============ OPTION 1: MANUAL SAFE DEPLOYMENT ============
  
  console.log("🏗️  Deploying Gnosis Safe manually (fallback method)...");
  
  try {
    // Deploy a simple multisig contract for testing if Gnosis Safe SDK isn't available
    const MultisigFactory = await ethers.getContractFactory("SimpleMultisig");
    
    const multisig = await MultisigFactory.deploy(
      MULTISIG_OWNERS,
      TESTNET_THRESHOLD // Use lower threshold for testing
    );
    
    await multisig.waitForDeployment();
    const multisigAddress = await multisig.getAddress();
    
    console.log("✅ Simple Multisig deployed to:", multisigAddress);
    console.log("   Owners:", await multisig.getOwners());
    console.log("   Threshold:", await multisig.threshold());
    console.log("");

    // ============ VERIFY DEPLOYMENT ============
    
    console.log("🔍 Verifying multisig deployment...");
    
    const ownerCount = await multisig.getOwnerCount();
    const threshold = await multisig.threshold();
    
    console.log("   Owner count:", ownerCount.toString());
    console.log("   Required signatures:", threshold.toString());
    console.log("   Is deployer an owner:", await multisig.isOwner(deployer.address));
    
    // ============ SAVE CONFIGURATION ============
    
    const config = {
      multisigAddress: multisigAddress,
      owners: MULTISIG_OWNERS,
      threshold: TESTNET_THRESHOLD,
      deployedAt: new Date().toISOString(),
      network: "plume-testnet",
      chainId: (await ethers.provider.getNetwork()).chainId.toString()
    };
    
    console.log("\n📋 Multisig Configuration:");
    console.log(JSON.stringify(config, null, 2));
    
    // ============ NEXT STEPS ============
    
    console.log("\n🚀 Next Steps:");
    console.log("1. Add team member addresses to MULTISIG_OWNERS array");
    console.log("2. Re-deploy with production threshold (3/5)");
    console.log("3. Transfer YREC token roles to multisig");
    console.log("4. Test multisig operations");
    console.log("5. Set up backend monitoring");
    
    console.log("\n📝 Commands to run next:");
    console.log(`npx hardhat run scripts/transfer-to-multisig.ts --network plume-testnet`);
    console.log(`npx hardhat run scripts/test-multisig-operations.ts --network plume-testnet`);
    
    return multisigAddress;
    
  } catch (error) {
    console.error("❌ Error deploying multisig:", error);
    
    // ============ FALLBACK: GNOSIS SAFE WEB INTERFACE ============
    
    console.log("\n🌐 Alternative: Use Gnosis Safe Web Interface");
    console.log("1. Visit: https://app.safe.global/");
    console.log("2. Connect to Plume Testnet (Chain ID: 98867)");
    console.log("3. Create new Safe with team addresses");
    console.log("4. Set threshold to 3/5 for production");
    console.log("5. Copy the Safe address and update scripts");
    
    console.log("\n⚠️  Manual Setup Required:");
    console.log("   - Add team wallet addresses");
    console.log("   - Configure proper threshold");
    console.log("   - Test with small transactions first");
    
    throw error;
  }
}

// ============ SIMPLE MULTISIG CONTRACT ============

const SIMPLE_MULTISIG_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleMultisig {
    address[] public owners;
    uint256 public threshold;
    mapping(address => bool) public isOwner;
    
    uint256 public transactionCount;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }
    
    event TransactionSubmitted(uint256 indexed transactionId, address indexed to, uint256 value, bytes data);
    event TransactionConfirmed(uint256 indexed transactionId, address indexed owner);
    event TransactionExecuted(uint256 indexed transactionId);
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "Owners required");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        threshold = _threshold;
    }
    
    function submitTransaction(address to, uint256 value, bytes memory data) 
        external onlyOwner returns (uint256) {
        uint256 transactionId = transactionCount++;
        
        transactions[transactionId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmationCount: 0
        });
        
        emit TransactionSubmitted(transactionId, to, value, data);
        confirmTransaction(transactionId);
        
        return transactionId;
    }
    
    function confirmTransaction(uint256 transactionId) public onlyOwner {
        require(!confirmations[transactionId][msg.sender], "Already confirmed");
        require(!transactions[transactionId].executed, "Already executed");
        
        confirmations[transactionId][msg.sender] = true;
        transactions[transactionId].confirmationCount++;
        
        emit TransactionConfirmed(transactionId, msg.sender);
        
        if (transactions[transactionId].confirmationCount >= threshold) {
            executeTransaction(transactionId);
        }
    }
    
    function executeTransaction(uint256 transactionId) internal {
        Transaction storage txn = transactions[transactionId];
        require(txn.confirmationCount >= threshold, "Insufficient confirmations");
        require(!txn.executed, "Already executed");
        
        txn.executed = true;
        
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");
        
        emit TransactionExecuted(transactionId);
    }
    
    function getOwners() external view returns (address[] memory) {
        return owners;
    }
    
    function getOwnerCount() external view returns (uint256) {
        return owners.length;
    }
    
    receive() external payable {}
}
`;

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 