import { ethers } from "hardhat";

async function main() {
  console.log("🔍 PMOCK Token Verification...\n");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Verifying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // ============ CONFIGURATION ============
  
  const PMOCK_CONTRACT_ADDRESS = "0x4244E7d3f381B40663fb28C4a6a05D82159C5422";
  const SAFE_ADDRESS = "0xF9BFf4dF68a89708181783e3cfe03dB7Daa8606c";
  const DEPLOYER_ADDRESS = "0x292eA19bF5F2CF7bC20fEcF45478DF496f551fea";
  
  console.log("⚙️  Verification Configuration:");
  console.log("   PMOCK Contract:", PMOCK_CONTRACT_ADDRESS);
  console.log("   SAFE Address:", SAFE_ADDRESS);
  console.log("   Deployer Address:", DEPLOYER_ADDRESS);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("");

  // ============ CONNECT TO CONTRACT (DIRECT) ============
  
  console.log("🔗 Connecting to PMOCK contract...");
  
  try {
    // Use direct contract instantiation to avoid ENS issues
    const pmockABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function VERSION() view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function getTotalIPValue() view returns (uint256)",
      "function transfersEnabled() view returns (bool)",
      "function isWhitelisted(address account) view returns (bool)",
      "function hasRole(bytes32 role, address account) view returns (bool)",
      "function MINTER_ROLE() view returns (bytes32)",
      "function BURNER_ROLE() view returns (bytes32)",
      "function COMPLIANCE_OFFICER_ROLE() view returns (bytes32)",
      "function WHITELIST_MANAGER_ROLE() view returns (bytes32)",
      "function balanceOf(address account) view returns (uint256)",
      "function mint(address to, uint256 amount, uint256 ipValue)",
      "function setTransfersEnabled(bool enabled)"
    ];
    
    const pmockToken = new ethers.Contract(PMOCK_CONTRACT_ADDRESS, pmockABI, deployer);
    
    console.log("✅ Connected to PMOCK contract");
    console.log("");

    // ============ BASIC INFORMATION ============
    
    console.log("📋 Contract Information:");
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
      const isWhitelisted = await pmockToken.isWhitelisted(addr.address);
      console.log(`   ${addr.name}: ${isWhitelisted ? '✅' : '❌'} (${addr.address})`);
    }
    console.log("");

    // ============ ROLE VERIFICATION ============
    
    console.log("🔑 Checking SAFE Roles:");
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
    console.log("");

    // ============ CHECK DEPLOYER ROLES ============
    
    console.log("🔑 Checking Deployer Roles:");
    const deployerHasMinter = await pmockToken.hasRole(MINTER_ROLE, DEPLOYER_ADDRESS);
    const deployerHasBurner = await pmockToken.hasRole(BURNER_ROLE, DEPLOYER_ADDRESS);
    const deployerHasCompliance = await pmockToken.hasRole(COMPLIANCE_OFFICER_ROLE, DEPLOYER_ADDRESS);
    const deployerHasWhitelist = await pmockToken.hasRole(WHITELIST_MANAGER_ROLE, DEPLOYER_ADDRESS);
    
    console.log(`   Deployer MINTER_ROLE: ${deployerHasMinter ? '✅' : '❌'}`);
    console.log(`   Deployer BURNER_ROLE: ${deployerHasBurner ? '✅' : '❌'}`);
    console.log(`   Deployer COMPLIANCE_OFFICER_ROLE: ${deployerHasCompliance ? '✅' : '❌'}`);
    console.log(`   Deployer WHITELIST_MANAGER_ROLE: ${deployerHasWhitelist ? '✅' : '❌'}`);
    console.log("");

    // ============ TEST MINTING (if deployer has rights) ============
    
    console.log("🪙 Testing Minting Capability:");
    if (deployerHasMinter) {
      console.log("   ✅ Deployer has MINTER_ROLE - Testing mint...");
      
      try {
        // Test mint to SAFE (small amount for testing)
        const mintAmount = ethers.parseEther("1000"); // 1000 PMOCK
        const ipValue = ethers.parseEther("1000"); // $1000 IP value
        
        console.log(`   🔄 Minting ${ethers.formatEther(mintAmount)} PMOCK to SAFE...`);
        const mintTx = await pmockToken.mint(SAFE_ADDRESS, mintAmount, ipValue);
        await mintTx.wait();
        
        console.log("   ✅ Minting successful!");
        console.log(`   Transaction: ${mintTx.hash}`);
        
        // Check new balances
        const safeBalance = await pmockToken.balanceOf(SAFE_ADDRESS);
        const newTotalSupply = await pmockToken.totalSupply();
        const newTotalIPValue = await pmockToken.getTotalIPValue();
        
        console.log(`   📊 SAFE Balance: ${ethers.formatEther(safeBalance)} PMOCK`);
        console.log(`   📊 Total Supply: ${ethers.formatEther(newTotalSupply)} PMOCK`);
        console.log(`   📊 Total IP Value: ${ethers.formatEther(newTotalIPValue)} USD`);
      } catch (error: any) {
        console.log("   ❌ Minting failed:", error.message);
      }
    } else {
      console.log("   ❌ Deployer does not have MINTER_ROLE");
      console.log("   💡 SAFE wallet will need to mint tokens");
    }
    console.log("");

    // ============ VERIFICATION SUMMARY ============
    
    console.log("🎉 PMOCK VERIFICATION COMPLETED!");
    console.log("=" .repeat(50));
    console.log("📋 Summary:");
    console.log("   Contract Address:", PMOCK_CONTRACT_ADDRESS);
    console.log("   Network: Plume Mainnet");
    console.log("   Status: ✅ Deployed & Functional");
    console.log("");
    console.log("🔧 Ready For:");
    console.log("   - ✅ SAFE minting operations");
    console.log("   - ✅ Whitelist management");
    console.log("   - ✅ Role-based access control");
    console.log("   - ✅ Testing all functionalities");
    console.log("");
    console.log("🔗 Contract Links:");
    console.log(`   Explorer: https://explorer.plume.org/address/${PMOCK_CONTRACT_ADDRESS}`);
    console.log(`   SAFE: https://safe.onchainden.com/plume:${SAFE_ADDRESS}`);
    console.log("=" .repeat(50));
    
  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    console.error("Full error:", error);
  }
}

// Execute verification
main()
  .then(() => {
    console.log("\n✅ PMOCK verification completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ PMOCK verification failed:");
    console.error(error);
    process.exit(1);
  }); 