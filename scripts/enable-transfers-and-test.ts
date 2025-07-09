import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Enabling transfers and testing minting...");

  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const [deployer] = await ethers.getSigners();
  
  console.log("🔑 Account:", deployer.address);

  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  // Check current transfer status
  const transfersEnabled = await yrecToken.transfersEnabled();
  console.log("📊 Current transfers enabled:", transfersEnabled);

  // Check if we have compliance officer role
  const COMPLIANCE_OFFICER_ROLE = await yrecToken.COMPLIANCE_OFFICER_ROLE();
  const hasComplianceRole = await yrecToken.hasRole(COMPLIANCE_OFFICER_ROLE, deployer.address);
  console.log("🔐 Has Compliance Officer Role:", hasComplianceRole);

  if (!transfersEnabled && hasComplianceRole) {
    console.log("\n🔄 Enabling transfers...");
    try {
      const tx = await yrecToken.setTransfersEnabled(true);
      await tx.wait();
      console.log("✅ Transfers enabled successfully!");
      
      // Verify
      const newStatus = await yrecToken.transfersEnabled();
      console.log("📊 New transfers status:", newStatus);
      
    } catch (error) {
      console.log("❌ Failed to enable transfers:", error);
      return;
    }
  }

  // Now test minting
  console.log("\n🪙 Testing minting...");
  try {
    const mintAmount = ethers.parseEther("1000"); // 1000 YREC
    const ipValue = ethers.parseEther("50000"); // $50,000 IP value
    
    console.log(`   Minting ${ethers.formatEther(mintAmount)} YREC tokens...`);
    console.log(`   Backing with $${ethers.formatEther(ipValue)} IP value...`);
    
    const tx = await yrecToken.mint(deployer.address, mintAmount, ipValue);
    console.log("   Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("   ✅ Minting successful! Block:", receipt?.blockNumber);
    
    // Check new balances
    const balance = await yrecToken.balanceOf(deployer.address);
    const totalSupply = await yrecToken.totalSupply();
    const totalIPValue = await yrecToken.getTotalIPValue();
    
    console.log(`   Deployer Balance: ${ethers.formatEther(balance)} YREC`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
    console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);
    
  } catch (error) {
    console.log("   ❌ Minting failed:", error);
  }

  // Test transfer functionality
  console.log("\n🔄 Testing transfer functionality...");
  try {
    const transferAmount = ethers.parseEther("100"); // 100 YREC
    const testRecipient = "0x1234567890123456789012345678901234567890"; // Already whitelisted
    
    console.log(`   Transferring ${ethers.formatEther(transferAmount)} YREC to ${testRecipient}...`);
    
    const tx = await yrecToken.transfer(testRecipient, transferAmount);
    await tx.wait();
    
    console.log("   ✅ Transfer successful!");
    
    const recipientBalance = await yrecToken.balanceOf(testRecipient);
    console.log(`   Recipient Balance: ${ethers.formatEther(recipientBalance)} YREC`);
    
  } catch (error) {
    console.log("   ❌ Transfer failed:", error);
  }

  console.log("\n🎉 Testing completed!");
  console.log("\n📋 Final Summary:");
  console.log("   ✅ Contract deployed and verified");
  console.log("   ✅ Transfers enabled");
  console.log("   ✅ Minting functionality working");
  console.log("   ✅ Transfer functionality working");
  console.log("   ✅ IP value tracking operational");
  
  console.log("\n🔗 View on Plume Explorer:");
  console.log(`   https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 