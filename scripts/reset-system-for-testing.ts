import { ethers } from "hardhat";

async function main() {
  console.log("🔄 RESETTING YREC SYSTEM FOR TESTING\n");
  console.log("This will:");
  console.log("1. Clear all YREC tokens from deployer");
  console.log("2. Reset total supply and IP value to 0");
  console.log("3. Prepare system for clean testing");
  console.log("");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);

  // Contract configuration
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  console.log("🔗 YREC Token:", YREC_TOKEN_ADDRESS);
  console.log("");

  // ============ STEP 1: CURRENT STATE ============
  
  console.log("📊 Current System State:");
  
  try {
    const totalSupply = await yrecToken.totalSupply();
    const totalIPValue = await yrecToken.getTotalIPValue();
    const deployerBalance = await yrecToken.balanceOf(deployer.address);
    
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
    console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);
    console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} YREC`);
    console.log("");
    
  } catch (error) {
    console.error("   ❌ Failed to get current state:", error);
    throw error;
  }

  // ============ STEP 2: BURN ALL DEPLOYER TOKENS ============
  
  console.log("🔥 Step 2: Burning Deployer's YREC Tokens");
  
  try {
    const deployerBalance = await yrecToken.balanceOf(deployer.address);
    
    if (deployerBalance > 0n) {
      console.log(`   Burning ${ethers.formatEther(deployerBalance)} YREC...`);
      
      const burnTx = await yrecToken.burn(deployer.address, deployerBalance);
      await burnTx.wait();
      
      console.log(`   ✅ Burned ${ethers.formatEther(deployerBalance)} YREC`);
      console.log(`   Transaction: ${burnTx.hash}`);
    } else {
      console.log("   ℹ️  Deployer has no YREC to burn");
    }
    
  } catch (error) {
    console.error("   ❌ Burn failed:", error);
    throw error;
  }

  // ============ STEP 3: RESET IP VALUE ============
  
  console.log("\n🔧 Step 3: Resetting IP Value");
  
  try {
    const currentIPValue = await yrecToken.getTotalIPValue();
    
    if (currentIPValue > 0n) {
      console.log(`   Resetting IP value from $${ethers.formatEther(currentIPValue)} to $0...`);
      
      const resetTx = await yrecToken.updateTotalIPValue(0);
      await resetTx.wait();
      
      console.log("   ✅ IP value reset to $0");
      console.log(`   Transaction: ${resetTx.hash}`);
    } else {
      console.log("   ℹ️  IP value already at $0");
    }
    
  } catch (error) {
    console.error("   ❌ IP value reset failed:", error);
    throw error;
  }

  // ============ STEP 4: VERIFICATION ============
  
  console.log("\n🔍 Step 4: Final State Verification");
  
  try {
    const finalSupply = await yrecToken.totalSupply();
    const finalIPValue = await yrecToken.getTotalIPValue();
    const finalDeployerBalance = await yrecToken.balanceOf(deployer.address);
    
    console.log(`   Final Supply: ${ethers.formatEther(finalSupply)} YREC`);
    console.log(`   Final IP Value: $${ethers.formatEther(finalIPValue)}`);
    console.log(`   Final Deployer Balance: ${ethers.formatEther(finalDeployerBalance)} YREC`);
    
    const isClean = finalSupply === 0n && finalIPValue === 0n && finalDeployerBalance === 0n;
    console.log(`   System is clean: ${isClean ? '✅ YES' : '❌ NO'}`);
    
    if (!isClean) {
      console.log("   ⚠️  Warning: Some tokens may still exist with other holders");
      
      // Check other known test addresses
      const testAddresses = [
        "0x1Ba8C602dD539349DC837b7235CC32F75F2829F8",
        "0x1234567890123456789012345678901234567890",
        "0xf75a44ae77Bf976948644e860202F38Fc707CDea",
        "0x3D516651fBDcbE93fBb2eD7049720e5AF0432fA9"
      ];
      
      for (const address of testAddresses) {
        try {
          const balance = await yrecToken.balanceOf(address);
          if (balance > 0n) {
            console.log(`   ℹ️  ${address}: ${ethers.formatEther(balance)} YREC`);
          }
        } catch (error) {
          // Ignore errors for test addresses
        }
      }
    }
    
  } catch (error) {
    console.error("   ❌ Verification failed:", error);
  }

  // ============ STEP 5: PREPARE FOR TESTING ============
  
  console.log("\n🧪 Step 5: System Ready for Testing");
  
  console.log("   Sample test process:");
  console.log("   1. Create test users in database with wallet addresses");
  console.log("   2. Upload positions CSV via admin interface");
  console.log("   3. Run reconciliation to calculate YREC needs");
  console.log("   4. Run blockchain reconciliation to prepare mint transactions");
  console.log("   5. Execute transactions via Gnosis Safe");
  
  // Sample CSV format for testing
  console.log("\n📄 Sample CSV format:");
  console.log("   global_id,shares");
  console.log("   testuser1_AAPL,10");
  console.log("   testuser2_MSFT,15");
  console.log("   (Note: global_id = first_8_chars_of_user_id + '_' + symbol)");

  // ============ FINAL SUMMARY ============
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 YREC SYSTEM RESET COMPLETE!");
  console.log("=".repeat(60));
  
  console.log("\n✅ What was reset:");
  console.log("   • Deployer YREC balance: 0");
  console.log("   • Total IP value: $0");
  console.log("   • System ready for clean testing");
  
  console.log("\n📋 Next Steps for Testing:");
  console.log("1. Go to http://localhost:3000/admin/upload");
  console.log("2. Upload CSV with user positions");
  console.log("3. Trigger reconciliation processes");
  console.log("4. Use Gnosis Safe to execute minting");
  
  console.log("\n🔗 Resources:");
  console.log(`   YREC Contract: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log("   Gnosis Safe: https://safe.onchainden.com/home?safe=plume:0x028e4F1953B9c8eF572F439b319A536e94683022");
  
  console.log("\n🚀 READY TO TEST END-TO-END WORKFLOW!");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 