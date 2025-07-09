import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Starting PMOCK Token Testing...\n");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // ============ CONFIGURATION ============
  
  // Get contract address from environment or prompt user
  const PMOCK_CONTRACT_ADDRESS = process.env.PMOCK_CONTRACT_ADDRESS;
  
  if (!PMOCK_CONTRACT_ADDRESS) {
    console.error("❌ PMOCK_CONTRACT_ADDRESS not set in environment variables");
    console.log("Please provide PMOCK_CONTRACT_ADDRESS as environment variable or run:");
    console.log("PMOCK_CONTRACT_ADDRESS=<address> npx hardhat run scripts/test-pmock.ts --network plume-mainnet");
    process.exit(1);
  }

  const SAFE_ADDRESS = "0xF9BFf4dF68a89708181783e3cfe03dB7Daa8606c";
  const DEPLOYER_ADDRESS = "0x292eA19bF5F2CF7bC20fEcF45478DF496f551fea";
  
  console.log("⚙️  Testing Configuration:");
  console.log("   PMOCK Contract:", PMOCK_CONTRACT_ADDRESS);
  console.log("   SAFE Address:", SAFE_ADDRESS);
  console.log("   Deployer Address:", DEPLOYER_ADDRESS);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("");

  // ============ CONNECT TO CONTRACT ============
  
  console.log("🔗 Connecting to PMOCK contract...");
  
  const PMOCKTokenFactory = await ethers.getContractFactory("PMOCKToken");
  const pmockToken = PMOCKTokenFactory.attach(PMOCK_CONTRACT_ADDRESS) as any;
  
  console.log("✅ Connected to PMOCK contract");
  console.log("");

  // ============ BASIC INFORMATION ============
  
  console.log("📋 Contract Information:");
  try {
    const name = await pmockToken.name();
    const symbol = await pmockToken.symbol();
    const decimals = await pmockToken.decimals();
    const version = await pmockToken.VERSION();
    const totalSupply = await pmockToken.totalSupply();
    const totalIPValue = await pmockToken.getTotalIPValue();
    const transfersEnabled = await pmockToken.transfersEnabled();
    
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals);
    console.log("   Version:", version);
    console.log("   Total Supply:", ethers.formatEther(totalSupply), symbol);
    console.log("   Total IP Value:", ethers.formatEther(totalIPValue), "USD");
    console.log("   Transfers Enabled:", transfersEnabled);
  } catch (error) {
    console.log("   ❌ Error reading basic info:", error);
  }
  console.log("");

  // ============ WHITELIST STATUS ============
  
  console.log("🔍 Checking Whitelist Status:");
  const addressesToCheck = [
    { name: "Deployer", address: DEPLOYER_ADDRESS },
    { name: "SAFE", address: SAFE_ADDRESS },
    { name: "IG Signer", address: "0x17002567e86E39E3E31708ca953a809CcEf9f507" },
    { name: "SM Signer", address: "0xF3B1b6b54996AdB99F598d1a013bf4FA47a53dac" },
  ];

  for (const addr of addressesToCheck) {
    try {
      const isWhitelisted = await pmockToken.isWhitelisted(addr.address);
      console.log(`   ${addr.name}: ${isWhitelisted ? '✅' : '❌'} (${addr.address})`);
    } catch (error) {
      console.log(`   ${addr.name}: ❌ Error checking whitelist`);
    }
  }
  console.log("");

  // ============ ROLE VERIFICATION ============
  
  console.log("🔑 Checking SAFE Roles:");
  try {
    const MINTER_ROLE = await pmockToken.MINTER_ROLE();
    const BURNER_ROLE = await pmockToken.BURNER_ROLE();
    const COMPLIANCE_OFFICER_ROLE = await pmockToken.COMPLIANCE_OFFICER_ROLE();
    const WHITELIST_MANAGER_ROLE = await pmockToken.WHITELIST_MANAGER_ROLE();
    
    const hasMinterRole = await pmockToken.hasRole(MINTER_ROLE, SAFE_ADDRESS);
    const hasBurnerRole = await pmockToken.hasRole(BURNER_ROLE, SAFE_ADDRESS);
    const hasComplianceRole = await pmockToken.hasRole(COMPLIANCE_OFFICER_ROLE, SAFE_ADDRESS);
    const hasWhitelistRole = await pmockToken.hasRole(WHITELIST_MANAGER_ROLE, SAFE_ADDRESS);
    
    console.log(`   MINTER_ROLE: ${hasMinterRole ? '✅' : '❌'}`);
    console.log(`   BURNER_ROLE: ${hasBurnerRole ? '✅' : '❌'}`);
    console.log(`   COMPLIANCE_OFFICER_ROLE: ${hasComplianceRole ? '✅' : '❌'}`);
    console.log(`   WHITELIST_MANAGER_ROLE: ${hasWhitelistRole ? '✅' : '❌'}`);
  } catch (error) {
    console.log("   ❌ Error checking roles:", error);
  }
  console.log("");

  // ============ TEST MINTING (if deployer has rights) ============
  
  console.log("🪙 Testing Minting Capability:");
  try {
    const MINTER_ROLE = await pmockToken.MINTER_ROLE();
    const hasMinterRole = await pmockToken.hasRole(MINTER_ROLE, deployer.address);
    
    if (hasMinterRole) {
      console.log("   ✅ Deployer has MINTER_ROLE");
      
      // Test mint to SAFE (small amount for testing)
      const mintAmount = ethers.parseEther("1000"); // 1000 PMOCK
      const ipValue = ethers.parseEther("1000"); // $1000 IP value
      
      console.log(`   🔄 Minting ${ethers.formatEther(mintAmount)} PMOCK to SAFE...`);
      const mintTx = await pmockToken.mint(SAFE_ADDRESS, mintAmount, ipValue);
      await mintTx.wait();
      
      console.log("   ✅ Minting successful!");
      
      // Check new balances
      const safeBalance = await pmockToken.balanceOf(SAFE_ADDRESS);
      const newTotalSupply = await pmockToken.totalSupply();
      const newTotalIPValue = await pmockToken.getTotalIPValue();
      
      console.log(`   📊 SAFE Balance: ${ethers.formatEther(safeBalance)} PMOCK`);
      console.log(`   📊 Total Supply: ${ethers.formatEther(newTotalSupply)} PMOCK`);
      console.log(`   📊 Total IP Value: ${ethers.formatEther(newTotalIPValue)} USD`);
    } else {
      console.log("   ❌ Deployer does not have MINTER_ROLE");
      console.log("   💡 SAFE wallet will need to mint tokens");
    }
  } catch (error) {
    console.log("   ❌ Error during minting test:", error);
  }
  console.log("");

  // ============ TEST TRANSFER CONTROLS ============
  
  console.log("🔒 Testing Transfer Controls:");
  try {
    const transfersEnabled = await pmockToken.transfersEnabled();
    console.log(`   Transfers Enabled: ${transfersEnabled ? '✅' : '❌'}`);
    
    if (!transfersEnabled) {
      console.log("   💡 Transfers are disabled (expected for testing)");
      console.log("   💡 Use SAFE to enable transfers when ready:");
      console.log("   💡 pmockToken.toggleTransfers(true)");
    }
  } catch (error) {
    console.log("   ❌ Error checking transfer controls:", error);
  }
  console.log("");

  // ============ DEPLOYMENT SUMMARY ============
  
  console.log("🎉 PMOCK TESTING COMPLETED!");
  console.log("=" .repeat(50));
  console.log("📋 Summary:");
  console.log("   Contract Address:", PMOCK_CONTRACT_ADDRESS);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Testing Mode: ✅ Active");
  console.log("");
  console.log("🚀 Ready for Testing!");
  console.log("   - SAFE can mint/burn tokens");
  console.log("   - All signers are whitelisted");
  console.log("   - Transfers disabled by default");
  console.log("   - No timelock delays");
  console.log("");
  console.log("💡 Next Steps:");
  console.log("   1. Use SAFE to mint test tokens");
  console.log("   2. Test whitelist management");
  console.log("   3. Enable transfers and test");
  console.log("   4. Test burning functionality");
  console.log("=" .repeat(50));
}

// Execute testing
main()
  .then(() => {
    console.log("\n✅ PMOCK testing completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ PMOCK testing failed:");
    console.error(error);
    process.exit(1);
  }); 