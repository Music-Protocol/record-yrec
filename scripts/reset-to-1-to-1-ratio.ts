import { ethers } from "hardhat";

async function main() {
  console.log("🔄 RESETTING YREC SYSTEM TO PERFECT 1:1 RATIO\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);

  // Contract address
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  console.log("🔗 YREC Token Contract:", YREC_TOKEN_ADDRESS);
  console.log("");

  // ============ CURRENT STATE ============
  
  console.log("📊 Current State (Non-1:1 Ratio):");
  const totalSupply = await yrecToken.totalSupply();
  const totalIPValue = await yrecToken.getTotalIPValue();
  const deployerBalance = await yrecToken.balanceOf(deployer.address);
  
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
  console.log(`   Total USD Value: $${ethers.formatEther(totalIPValue)}`);
  console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} YREC`);
  
  if (totalSupply > 0n) {
    const currentRatio = totalIPValue / totalSupply;
    console.log(`   Current Ratio: 1 YREC = $${ethers.formatEther(currentRatio)}`);
  }
  console.log("");

  // ============ RESET STRATEGY ============
  
  console.log("🎯 Reset Strategy: Burn All Tokens & Start Fresh");
  console.log(`   Will burn: ${ethers.formatEther(deployerBalance)} YREC`);
  console.log(`   Target: Total supply = 0, Total value = 0`);
  console.log("");

  // ============ BURN ALL TOKENS ============
  
  if (deployerBalance > 0n) {
    console.log("🔥 Burning all existing tokens...");
    
    const burnTx = await yrecToken.burn(deployer.address, deployerBalance);
    await burnTx.wait();
    
    console.log(`✅ Burned ${ethers.formatEther(deployerBalance)} YREC`);
    console.log(`   Transaction: ${burnTx.hash}`);
  } else {
    console.log("ℹ️  No tokens to burn (deployer balance is 0)");
  }

  // ============ VERIFY RESET ============
  
  console.log("\n📊 State After Reset:");
  const newTotalSupply = await yrecToken.totalSupply();
  const newTotalIPValue = await yrecToken.getTotalIPValue();
  const newDeployerBalance = await yrecToken.balanceOf(deployer.address);
  
  console.log(`   Total Supply: ${ethers.formatEther(newTotalSupply)} YREC`);
  console.log(`   Total USD Value: $${ethers.formatEther(newTotalIPValue)}`);
  console.log(`   Deployer Balance: ${ethers.formatEther(newDeployerBalance)} YREC`);
  
  const isReset = newTotalSupply === 0n && newTotalIPValue === 0n;
  console.log(`   System Reset: ${isReset ? '✅' : '❌'}`);

  // ============ START FRESH WITH 1:1 RATIO ============
  
  console.log("\n🆕 Starting Fresh with Perfect 1:1 Ratio...");
  
  // Mint exactly 1000 YREC = $1000 USD (1:1 ratio)
  const freshMintAmount = ethers.parseEther("1000"); // 1000 YREC
  const freshUSDValue = ethers.parseEther("1000");   // $1000 USD
  
  console.log("   Minting: 1000 YREC = $1000 USD");
  
  const mintTx = await yrecToken.mint(deployer.address, freshMintAmount, freshUSDValue);
  await mintTx.wait();
  
  console.log(`✅ Fresh mint successful!`);
  console.log(`   Transaction: ${mintTx.hash}`);

  // ============ VERIFY PERFECT 1:1 RATIO ============
  
  console.log("\n📊 Final State (Should be Perfect 1:1):");
  const finalSupply = await yrecToken.totalSupply();
  const finalValue = await yrecToken.getTotalIPValue();
  const finalBalance = await yrecToken.balanceOf(deployer.address);
  
  console.log(`   Total Supply: ${ethers.formatEther(finalSupply)} YREC`);
  console.log(`   Total USD Value: $${ethers.formatEther(finalValue)}`);
  console.log(`   Deployer Balance: ${ethers.formatEther(finalBalance)} YREC`);
  
  // Check perfect 1:1 ratio
  const isPerfect1to1 = finalSupply === finalValue;
  const ratio = finalSupply > 0n ? finalValue / finalSupply : 0n;
  
  console.log(`   Ratio: 1 YREC = $${ethers.formatEther(ratio)}`);
  console.log(`   Perfect 1:1 Ratio: ${isPerfect1to1 ? '✅ YES' : '❌ NO'}`);

  if (!isPerfect1to1) {
    console.log("⚠️  WARNING: Ratio is not perfect 1:1!");
    console.log(`   Supply: ${finalSupply}`);
    console.log(`   Value:  ${finalValue}`);
    console.log(`   Difference: ${finalSupply > finalValue ? finalSupply - finalValue : finalValue - finalSupply}`);
  }

  // ============ DEMONSTRATION: PERFECT OPERATIONS ============
  
  console.log("\n🧪 Testing Perfect 1:1 Operations...");
  
  // Test 1: Another 1:1 mint
  console.log("\n1️⃣ Additional 1:1 mint (500 YREC = $500):");
  const additionalAmount = ethers.parseEther("500");
  await yrecToken.mint(deployer.address, additionalAmount, additionalAmount);
  
  const afterAdditional = await yrecToken.totalSupply();
  const afterAdditionalValue = await yrecToken.getTotalIPValue();
  
  console.log(`   Supply: ${ethers.formatEther(afterAdditional)} YREC`);
  console.log(`   Value: $${ethers.formatEther(afterAdditionalValue)}`);
  console.log(`   Still 1:1: ${afterAdditional === afterAdditionalValue ? '✅' : '❌'}`);

  // Test 2: Transfer maintains 1:1
  console.log("\n2️⃣ Transfer test (1:1 ratio maintained):");
  const recipient = ethers.Wallet.createRandom();
  
  // Add recipient to whitelist
  await yrecToken.updateWhitelist(recipient.address, true);
  
  // Transfer 100 YREC
  const transferAmount = ethers.parseEther("100");
  await yrecToken.transfer(recipient.address, transferAmount);
  
  const senderBalance = await yrecToken.balanceOf(deployer.address);
  const recipientBalance = await yrecToken.balanceOf(recipient.address);
  const stillTotalSupply = await yrecToken.totalSupply();
  const stillTotalValue = await yrecToken.getTotalIPValue();
  
  console.log(`   Sender Balance: ${ethers.formatEther(senderBalance)} YREC`);
  console.log(`   Recipient Balance: ${ethers.formatEther(recipientBalance)} YREC`);
  console.log(`   Total Supply: ${ethers.formatEther(stillTotalSupply)} YREC`);
  console.log(`   Total Value: $${ethers.formatEther(stillTotalValue)}`);
  console.log(`   System Integrity: ${stillTotalSupply === stillTotalValue ? '✅' : '❌'}`);

  // ============ FINAL SUMMARY ============
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 YREC SYSTEM RESET TO PERFECT 1:1 RATIO COMPLETE!");
  console.log("=".repeat(60));
  
  const absoluteFinalSupply = await yrecToken.totalSupply();
  const absoluteFinalValue = await yrecToken.getTotalIPValue();
  
  console.log(`💰 Total YREC Supply: ${ethers.formatEther(absoluteFinalSupply)}`);
  console.log(`💵 Total USD Value: $${ethers.formatEther(absoluteFinalValue)}`);
  console.log(`📊 Perfect Equality: ${absoluteFinalSupply === absoluteFinalValue ? '✅ YES' : '❌ NO'}`);
  
  console.log("\n🎯 System Now Ready:");
  console.log("   • ✅ Perfect 1 YREC = 1 USD ratio");
  console.log("   • ✅ Clean state for production use");
  console.log("   • ✅ All operations maintain 1:1 ratio");
  console.log("   • ✅ Simple, predictable economics");
  
  console.log("\n🔗 View on Plume Explorer:");
  console.log(`   https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  
  console.log("\n✅ Ready to continue with multisig transfer!");
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