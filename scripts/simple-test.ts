import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Simple Contract Test...");

  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const [deployer] = await ethers.getSigners();
  
  console.log("🔑 Account:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  // Test basic reads first
  console.log("\n📊 Basic Info:");
  console.log("   Name:", await yrecToken.name());
  console.log("   Symbol:", await yrecToken.symbol());
  console.log("   Total Supply:", ethers.formatEther(await yrecToken.totalSupply()));

  // Check roles
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const hasMinterRole = await yrecToken.hasRole(MINTER_ROLE, deployer.address);
  console.log("   Has Minter Role:", hasMinterRole);

  // Check whitelist
  const isWhitelisted = await yrecToken.isWhitelisted(deployer.address);
  console.log("   Is Whitelisted:", isWhitelisted);

  // Try a very small mint
  if (hasMinterRole && isWhitelisted) {
    console.log("\n🪙 Attempting small mint...");
    try {
      const smallAmount = ethers.parseEther("1"); // 1 YREC
      const smallIPValue = ethers.parseEther("100"); // $100 IP value
      
      console.log("   Estimating gas...");
      const gasEstimate = await yrecToken.mint.estimateGas(deployer.address, smallAmount, smallIPValue);
      console.log("   Gas estimate:", gasEstimate.toString());
      
      console.log("   Executing mint...");
      const tx = await yrecToken.mint(deployer.address, smallAmount, smallIPValue, {
        gasLimit: gasEstimate * 2n // Double the gas estimate
      });
      
      console.log("   Transaction hash:", tx.hash);
      console.log("   Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("   ✅ Mint successful! Block:", receipt?.blockNumber);
      
      // Check new balance
      const balance = await yrecToken.balanceOf(deployer.address);
      console.log("   New balance:", ethers.formatEther(balance), "YREC");
      
    } catch (error: any) {
      console.log("   ❌ Mint failed:");
      console.log("   Error:", error.message);
      
      // Try to get more details
      if (error.data) {
        console.log("   Error data:", error.data);
      }
    }
  } else {
    console.log("\n⚠️ Cannot mint: Missing role or not whitelisted");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 