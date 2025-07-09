import { ethers } from "hardhat";

async function main() {
  console.log("🚨 EMERGENCY SYSTEM STATE CHECK");
  console.log("Investigating massive YREC token balance issue");
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer Address:", deployer.address);

  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const SAFE_ADDRESS = "0x028e4F1953B9c8eF572F439b319A536e94683022";

  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  console.log("🔗 YREC Token Contract:", YREC_TOKEN_ADDRESS);
  console.log("🏦 Safe Address:", SAFE_ADDRESS);
  console.log("");

  // ============ CRITICAL BALANCE CHECK ============
  
  console.log("🚨 CRITICAL BALANCE ANALYSIS:");
  
  try {
    const deployerBalance = await yrecToken.balanceOf(deployer.address);
    const safeBalance = await yrecToken.balanceOf(SAFE_ADDRESS);
    const totalSupply = await yrecToken.totalSupply();
    const totalIPValue = await yrecToken.getTotalIPValue();
    
    console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} YREC`);
    console.log(`   Safe Balance: ${ethers.formatEther(safeBalance)} YREC`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
    console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);
    
    // Check if deployer balance is the massive amount
    const oneQuintillion = ethers.parseEther("1000000000000000000"); // 1 quintillion
    const isMassiveBalance = deployerBalance >= oneQuintillion;
    
    console.log("");
    console.log("🔍 Balance Analysis:");
    console.log(`   Deployer has massive balance: ${isMassiveBalance ? '🚨 YES' : '✅ NO'}`);
    console.log(`   Balance in wei: ${deployerBalance.toString()}`);
    
    if (isMassiveBalance) {
      console.log("");
      console.log("🚨 CRITICAL ISSUE DETECTED!");
      console.log(`   Deployer has ${ethers.formatEther(deployerBalance)} YREC tokens`);
      console.log("   This is destroying the 1:1 ratio and token economics");
      
      // Calculate IP value per token
      const ipPerToken = totalSupply > 0n ? totalIPValue / totalSupply : 0n;
      console.log(`   IP per token: $${ethers.formatEther(ipPerToken)}`);
      
      // Check ratio
      const isOneToOne = totalSupply === totalIPValue;
      console.log(`   1:1 ratio maintained: ${isOneToOne ? '✅' : '🚨 NO'}`);
    }
    
    // ============ GET DEPLOYER'S IP VALUE ============
    
    const deployerIPValue = await yrecToken.getIPValueForHolder(deployer.address);
    const safeIPValue = await yrecToken.getIPValueForHolder(SAFE_ADDRESS);
    
    console.log("");
    console.log("💰 IP Value Distribution:");
    console.log(`   Deployer IP Value: $${ethers.formatEther(deployerIPValue)}`);
    console.log(`   Safe IP Value: $${ethers.formatEther(safeIPValue)}`);
    console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);
    
    // ============ CHECK ROLES ============
    
    console.log("");
    console.log("🔒 Role Analysis:");
    const MINTER_ROLE = await yrecToken.MINTER_ROLE();
    const BURNER_ROLE = await yrecToken.BURNER_ROLE();
    const DEFAULT_ADMIN_ROLE = await yrecToken.DEFAULT_ADMIN_ROLE();
    
    const hasMinterRole = await yrecToken.hasRole(MINTER_ROLE, deployer.address);
    const hasBurnerRole = await yrecToken.hasRole(BURNER_ROLE, deployer.address);
    const hasAdminRole = await yrecToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    
    console.log(`   Deployer has MINTER_ROLE: ${hasMinterRole}`);
    console.log(`   Deployer has BURNER_ROLE: ${hasBurnerRole}`);
    console.log(`   Deployer has ADMIN_ROLE: ${hasAdminRole}`);
    
  } catch (error: any) {
    console.error("❌ Error checking balances:", error.message);
    return;
  }

  // ============ SUGGESTED ACTIONS ============
  
  console.log("");
  console.log("🚨 EMERGENCY ACTION REQUIRED:");
  console.log("");
  
  const deployerBalance = await yrecToken.balanceOf(deployer.address);
  if (deployerBalance >= ethers.parseEther("1000000000000000000")) {
    console.log("1. 🔥 IMMEDIATE: Burn the massive deployer balance");
    console.log("2. 🔧 INVESTIGATE: How this massive mint happened");
    console.log("3. ⚠️ VERIFY: System integrity after burn");
    console.log("4. 🔒 SECURE: Prevent future unauthorized mints");
    console.log("");
    
    console.log("💡 Quick Fix Commands:");
    console.log("   npx hardhat run scripts/emergency-burn-deployer.ts --network plume-testnet");
    console.log("");
    
    console.log("🚨 THIS IS A CRITICAL TOKEN ECONOMICS BREACH!");
    console.log("   The massive supply is breaking the 1:1 YREC:USD ratio");
    console.log("   Immediate action required to restore system integrity");
  } else {
    console.log("✅ No immediate crisis detected");
    console.log("   System appears to be in normal state");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 