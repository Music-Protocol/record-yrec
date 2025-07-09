import { ethers } from "hardhat";

async function main() {
  console.log("💰 YREC Token Simple Minting (1 YREC = 1 USD)\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Contract address
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";

  // Get contract instance
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  console.log("🔗 YREC Token Contract:", YREC_TOKEN_ADDRESS);
  console.log("");

  // ============ CURRENT STATE ============
  
  console.log("📊 Current State:");
  const totalSupply = await yrecToken.totalSupply();
  const totalIPValue = await yrecToken.getTotalIPValue();
  
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
  console.log(`   Total USD Value: $${ethers.formatEther(totalIPValue)}`);
  console.log(`   Ratio: 1 YREC = $${ethers.formatEther(totalIPValue / totalSupply)} USD`);
  console.log("");

  // ============ SIMPLE MINTING (1:1 USD) ============
  
  console.log("🪙 Minting YREC Tokens (1:1 USD Ratio)...");
  
  // Example: Mint 1000 YREC = $1000 USD value
  const usdAmount = 1000; // USD amount
  const yrecAmount = ethers.parseEther(usdAmount.toString()); // 1:1 ratio
  const ipValue = ethers.parseEther(usdAmount.toString()); // Same as YREC amount
  
  console.log(`   Minting: ${usdAmount} YREC`);
  console.log(`   USD Value: $${usdAmount}`);
  console.log(`   Ratio: 1:1 (as designed)`);
  
  // Check if deployer is whitelisted
  const isWhitelisted = await yrecToken.isWhitelisted(deployer.address);
  if (!isWhitelisted) {
    console.log("❌ Deployer not whitelisted. Adding to whitelist...");
    await yrecToken.updateWhitelist(deployer.address, true);
    console.log("✅ Deployer added to whitelist");
  }

  // Mint tokens
  console.log("\n⏳ Executing mint transaction...");
  const tx = await yrecToken.mint(deployer.address, yrecAmount, ipValue);
  await tx.wait();
  
  console.log(`✅ Minted successfully!`);
  console.log(`   Transaction: ${tx.hash}`);

  // ============ NEW STATE ============
  
  console.log("\n📊 New State:");
  const newTotalSupply = await yrecToken.totalSupply();
  const newTotalIPValue = await yrecToken.getTotalIPValue();
  
  console.log(`   Total Supply: ${ethers.formatEther(newTotalSupply)} YREC`);
  console.log(`   Total USD Value: $${ethers.formatEther(newTotalIPValue)}`);
  
  // Verify 1:1 ratio
  const ratio = newTotalSupply > 0n ? newTotalIPValue / newTotalSupply : 0n;
  const isOneToOne = ratio === ethers.parseEther("1");
  
  console.log(`   Ratio: 1 YREC = $${ethers.formatEther(ratio)} USD`);
  console.log(`   1:1 Ratio Maintained: ${isOneToOne ? '✅' : '❌'}`);

  if (!isOneToOne) {
    console.log("⚠️  WARNING: 1:1 ratio not maintained!");
    console.log("   This should always be 1 YREC = 1 USD");
  }

  // ============ DEMONSTRATION: SIMPLE OPERATIONS ============
  
  console.log("\n🧪 Testing Simple 1:1 Operations...");
  
  // Test 1: Small mint (100 YREC = $100)
  console.log("\n1️⃣ Small mint test (100 YREC = $100):");
  const smallAmount = ethers.parseEther("100");
  await yrecToken.mint(deployer.address, smallAmount, smallAmount);
  
  const afterSmallMint = await yrecToken.totalSupply();
  const afterSmallValue = await yrecToken.getTotalIPValue();
  console.log(`   Supply: ${ethers.formatEther(afterSmallMint)} YREC`);
  console.log(`   Value: $${ethers.formatEther(afterSmallValue)}`);
  console.log(`   Ratio: ${ethers.formatEther(afterSmallValue / afterSmallMint)}`);

  // Test 2: Transfer (maintains 1:1)
  console.log("\n2️⃣ Transfer test (maintains 1:1 ratio):");
  const recipient = ethers.Wallet.createRandom();
  
  // Add recipient to whitelist
  await yrecToken.updateWhitelist(recipient.address, true);
  
  // Transfer 50 YREC
  const transferAmount = ethers.parseEther("50");
  await yrecToken.transfer(recipient.address, transferAmount);
  
  const senderBalance = await yrecToken.balanceOf(deployer.address);
  const recipientBalance = await yrecToken.balanceOf(recipient.address);
  
  console.log(`   Sender Balance: ${ethers.formatEther(senderBalance)} YREC`);
  console.log(`   Recipient Balance: ${ethers.formatEther(recipientBalance)} YREC`);
  console.log(`   Total Still: ${ethers.formatEther(senderBalance + recipientBalance)} YREC`);

  // ============ FINAL SUMMARY ============
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 FINAL SUMMARY - SIMPLE YREC SYSTEM");
  console.log("=".repeat(50));
  
  const finalSupply = await yrecToken.totalSupply();
  const finalValue = await yrecToken.getTotalIPValue();
  
  console.log(`💰 Total YREC Supply: ${ethers.formatEther(finalSupply)}`);
  console.log(`💵 Total USD Value: $${ethers.formatEther(finalValue)}`);
  console.log(`📊 Ratio: 1 YREC = $${ethers.formatEther(finalValue / finalSupply)}`);
  
  const perfectRatio = finalValue === finalSupply;
  console.log(`✅ Perfect 1:1 Ratio: ${perfectRatio ? 'YES' : 'NO'}`);
  
  console.log("\n🎯 Key Points:");
  console.log("   • 1 YREC always equals 1 USD");
  console.log("   • No complex IP value calculations needed");
  console.log("   • Simple minting: amount YREC = amount USD");
  console.log("   • Transfers maintain the 1:1 relationship");
  console.log("   • Total supply = Total USD value (always)");
  
  console.log("\n🔗 View on Plume Explorer:");
  console.log(`   https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  
  console.log("\n✅ Simple YREC system working perfectly!");
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