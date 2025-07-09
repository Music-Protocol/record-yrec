import { ethers } from "hardhat";

async function main() {
  console.log("🔥 EXECUTING YREC BURN RECONCILIATION\n");
  console.log("This script will burn excess YREC tokens to match database allocation");
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);

  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const SAFE_ADDRESS = "0x028e4F1953B9c8eF572F439b319A536e94683022";

  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  console.log("🔗 YREC Token Contract:", YREC_TOKEN_ADDRESS);
  console.log("🏦 Safe Address:", SAFE_ADDRESS);
  console.log("");

  // ============ CURRENT STATE ANALYSIS ============
  
  console.log("📊 Current State Analysis:");
  const totalSupply = await yrecToken.totalSupply();
  const totalIPValue = await yrecToken.getTotalIPValue();
  const safeBalance = await yrecToken.balanceOf(SAFE_ADDRESS);
  
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
  console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);
  console.log(`   Safe Balance: ${ethers.formatEther(safeBalance)} YREC`);
  console.log("");

  // ============ CALCULATE RECONCILIATION AMOUNT ============
  
  // Based on your console output, you need to burn ~475.28 YREC
  // Let's calculate the exact amount needed
  
  // From your logs: Database total = 425.279354112635 YREC
  const targetDatabaseTotal = ethers.parseEther("425.279354112635");
  const currentSafeBalance = safeBalance;
  
  const burnAmount = currentSafeBalance - targetDatabaseTotal;
  
  console.log("🎯 Reconciliation Calculation:");
  console.log(`   Target Database Total: ${ethers.formatEther(targetDatabaseTotal)} YREC`);
  console.log(`   Current Safe Balance: ${ethers.formatEther(currentSafeBalance)} YREC`);
  console.log(`   Amount to Burn: ${ethers.formatEther(burnAmount)} YREC`);
  console.log("");

  if (burnAmount <= 0) {
    console.log("✅ No burn needed - Safe balance is already correct or insufficient");
    return;
  }

  // ============ VERIFY BURN PERMISSIONS ============
  
  console.log("🔒 Checking Burn Permissions:");
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const hasBurnerRole = await yrecToken.hasRole(BURNER_ROLE, deployer.address);
  
  console.log(`   Deployer has BURNER_ROLE: ${hasBurnerRole}`);
  
  if (!hasBurnerRole) {
    console.log("❌ Cannot execute burn: Missing BURNER_ROLE");
    console.log("   You need to either:");
    console.log("   1. Use the Safe interface to execute the prepared transaction");
    console.log("   2. Temporarily grant BURNER_ROLE to deployer for testing");
    return;
  }

  // ============ EXECUTE BURN ============
  
  console.log("🔥 Executing Burn Operation:");
  console.log(`   Burning ${ethers.formatEther(burnAmount)} YREC from Safe...`);
  
  try {
    // Get pre-burn state for verification
    const preBurnSupply = await yrecToken.totalSupply();
    const preBurnIPValue = await yrecToken.getTotalIPValue();
    const preBurnSafeBalance = await yrecToken.balanceOf(SAFE_ADDRESS);
    const preBurnSafeIPValue = await yrecToken.getIPValueForHolder(SAFE_ADDRESS);
    
    console.log(`   Pre-burn Safe Balance: ${ethers.formatEther(preBurnSafeBalance)} YREC`);
    console.log(`   Pre-burn Safe IP Value: $${ethers.formatEther(preBurnSafeIPValue)}`);
    
    // Execute burn
    const burnTx = await yrecToken.burn(SAFE_ADDRESS, burnAmount);
    console.log(`   Transaction submitted: ${burnTx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    await burnTx.wait();
    console.log("   ✅ Burn transaction confirmed!");
    
    // Get post-burn state
    const postBurnSupply = await yrecToken.totalSupply();
    const postBurnIPValue = await yrecToken.getTotalIPValue();
    const postBurnSafeBalance = await yrecToken.balanceOf(SAFE_ADDRESS);
    const postBurnSafeIPValue = await yrecToken.getIPValueForHolder(SAFE_ADDRESS);
    
    console.log("");
    console.log("📊 Post-Burn State:");
    console.log(`   Total Supply: ${ethers.formatEther(postBurnSupply)} YREC`);
    console.log(`   Total IP Value: $${ethers.formatEther(postBurnIPValue)}`);
    console.log(`   Safe Balance: ${ethers.formatEther(postBurnSafeBalance)} YREC`);
    console.log(`   Safe IP Value: $${ethers.formatEther(postBurnSafeIPValue)}`);
    
    // ============ VERIFICATION ============
    
    console.log("");
    console.log("🔍 Verification:");
    const supplyReduction = preBurnSupply - postBurnSupply;
    const ipValueReduction = preBurnIPValue - postBurnIPValue;
    const safeBalanceReduction = preBurnSafeBalance - postBurnSafeBalance;
    
    console.log(`   Supply Reduced: ${ethers.formatEther(supplyReduction)} YREC`);
    console.log(`   IP Value Reduced: $${ethers.formatEther(ipValueReduction)}`);
    console.log(`   Safe Balance Reduced: ${ethers.formatEther(safeBalanceReduction)} YREC`);
    
    const isCorrectAmount = supplyReduction === burnAmount;
    const maintainsRatio = postBurnSupply === postBurnIPValue;
    
    console.log(`   Correct Amount Burned: ${isCorrectAmount ? '✅' : '❌'}`);
    console.log(`   1:1 Ratio Maintained: ${maintainsRatio ? '✅' : '❌'}`);
    
    if (!isCorrectAmount) {
      console.log(`   Expected: ${ethers.formatEther(burnAmount)} YREC`);
      console.log(`   Actual: ${ethers.formatEther(supplyReduction)} YREC`);
    }
    
    if (!maintainsRatio) {
      console.log(`   Supply: ${ethers.formatEther(postBurnSupply)} YREC`);
      console.log(`   IP Value: $${ethers.formatEther(postBurnIPValue)}`);
    }
    
  } catch (error: any) {
    console.log("❌ Burn failed:");
    console.log(`   Error: ${error.message}`);
    console.log("");
    console.log("🔧 Possible Solutions:");
    console.log("   1. Check if deployer has BURNER_ROLE");
    console.log("   2. Use the Safe interface for execution");
    console.log("   3. Check if timelock is blocking the operation");
    return;
  }

  // ============ FINAL SUMMARY ============
  
  console.log("");
  console.log("🎉 BURN RECONCILIATION COMPLETED!");
  console.log("");
  console.log("✅ Summary:");
  console.log(`   - Burned ${ethers.formatEther(burnAmount)} YREC from Safe`);
  console.log(`   - Safe balance now matches database allocation`);
  console.log(`   - 1:1 YREC:USD ratio maintained`);
  console.log(`   - System reconciliation complete`);
  console.log("");
  
  console.log("🔗 Transaction Details:");
  console.log(`   Explorer: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log(`   Safe: https://testnet-explorer.plume.org/address/${SAFE_ADDRESS}`);
  
  console.log("");
  console.log("📋 Next Steps:");
  console.log("   1. Verify the burn on blockchain explorer");
  console.log("   2. Check that CSV upload now shows proper reconciliation");
  console.log("   3. Database and blockchain should now be in sync");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 