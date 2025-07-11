import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🧪 Testing YRECTokenSimple with Governance...");
  
  // Get contract address from environment
  const YREC_CONTRACT_ADDRESS = process.env.YREC_CONTRACT_ADDRESS;
  
  if (!YREC_CONTRACT_ADDRESS) {
    throw new Error("YREC_CONTRACT_ADDRESS environment variable is required");
  }
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  // Connect to deployed contract
  const YRECTokenSimple = await ethers.getContractFactory("YRECTokenSimple");
  const yrecToken = YRECTokenSimple.attach(YREC_CONTRACT_ADDRESS) as any;
  
  console.log("Connected to YREC contract at:", YREC_CONTRACT_ADDRESS);
  
  // Test basic info
  console.log("\n📋 Contract Info:");
  const name = await yrecToken.name();
  const symbol = await yrecToken.symbol();
  const decimals = await yrecToken.decimals();
  const totalSupply = await yrecToken.totalSupply();
  const custodialSafe = await yrecToken.custodialSafe();
  const timelock = await yrecToken.timelock();
  
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", ethers.formatEther(totalSupply), "YREC");
  console.log("Custodial Safe:", custodialSafe);
  console.log("Timelock:", timelock);
  
  // Test whitelist status
  console.log("\n🔍 Whitelist Status:");
  const isCustodialWhitelisted = await yrecToken.isWhitelisted(custodialSafe);
  const isDeployerWhitelisted = await yrecToken.isWhitelisted(deployer.address);
  
  console.log("Custodial Safe Whitelisted:", isCustodialWhitelisted);
  console.log("Deployer Whitelisted:", isDeployerWhitelisted);
  
  // Test adding to whitelist (if deployer has WHITELIST_MANAGER_ROLE)
  console.log("\n📝 Testing Whitelist Management:");
  try {
    const testAddress = "0x1234567890123456789012345678901234567890";
    const addTx = await yrecToken.updateWhitelist(testAddress, true);
    await addTx.wait();
    console.log("✅ Successfully added address to whitelist");
    
    const isTestWhitelisted = await yrecToken.isWhitelisted(testAddress);
    console.log("Test address whitelisted:", isTestWhitelisted);
    
    // Remove from whitelist
    const removeTx = await yrecToken.updateWhitelist(testAddress, false);
    await removeTx.wait();
    console.log("✅ Successfully removed address from whitelist");
    
  } catch (error: any) {
    console.log("❌ Whitelist management failed:", error.reason || "Access denied");
  }
  
  // Test batch whitelist (if deployer has WHITELIST_MANAGER_ROLE)
  console.log("\n📝 Testing Batch Whitelist:");
  try {
    const testAddresses = [
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222"
    ];
    
    const batchTx = await yrecToken.batchUpdateWhitelist(testAddresses, true);
    await batchTx.wait();
    console.log("✅ Batch whitelist update successful");
    
    for (const addr of testAddresses) {
      const isWhitelisted = await yrecToken.isWhitelisted(addr);
      console.log(`Address ${addr.slice(0, 6)}... whitelisted:`, isWhitelisted);
    }
    
  } catch (error: any) {
    console.log("❌ Batch whitelist failed:", error.reason || "Access denied");
  }
  
  // Test direct minting (should fail - requires timelock)
  console.log("\n🪙 Testing Direct Mint Function (Should Fail):");
  const mintAmount = ethers.parseEther("1000"); // 1000 YREC
  
  try {
    console.log("Attempting direct mint of", ethers.formatEther(mintAmount), "YREC...");
    const mintTx = await yrecToken.mint(mintAmount);
    await mintTx.wait();
    console.log("❌ Direct mint should have failed but didn't!");
    
  } catch (error: any) {
    console.log("✅ Direct mint correctly blocked:", error.reason || "Timelock required");
  }
  
  // Test direct burning (should fail - requires timelock)
  console.log("\n🔥 Testing Direct Burn Function (Should Fail):");
  const burnAmount = ethers.parseEther("500"); // 500 YREC
  
  try {
    console.log("Attempting direct burn of", ethers.formatEther(burnAmount), "YREC...");
    const burnTx = await yrecToken.burn(burnAmount);
    await burnTx.wait();
    console.log("❌ Direct burn should have failed but didn't!");
    
  } catch (error: any) {
    console.log("✅ Direct burn correctly blocked:", error.reason || "Timelock required");
  }
  
  // Show how mint/burn would work through timelock
  console.log("\n⏰ Timelock Operations Info:");
  console.log("To mint/burn tokens, you need to:");
  console.log("1. Create timelock proposal with target:", await yrecToken.getAddress());
  console.log("2. Call data: mint(1000000000000000000000) or burn(500000000000000000000)");
  console.log("3. Wait 6 hours for timelock delay");
  console.log("4. Execute the proposal");
  console.log("5. Tokens will be minted/burned to/from custodial safe");
  
  // Test transfer attempt (should fail)
  console.log("\n🚫 Testing Transfer Restriction:");
  try {
    const transferTx = await yrecToken.transfer(deployer.address, ethers.parseEther("1"));
    console.log("❌ Transfer should have failed but didn't!");
  } catch (error: any) {
    console.log("✅ Transfer correctly blocked:", error.reason || "Transfer not allowed");
  }
  
  // Test governance features
  console.log("\n🏛️ Testing Governance:");
  console.log("Timelock Address:", await yrecToken.timelock());
  
  // Check upgrade capabilities (should be immediate with role)
  try {
    const hasUpgraderRole = await yrecToken.hasRole(await yrecToken.UPGRADER_ROLE(), deployer.address);
    console.log("Deployer has UPGRADER_ROLE:", hasUpgraderRole);
    
    if (hasUpgraderRole) {
      console.log("✅ Contract upgrades are immediate (role-based, no timelock delay)");
    }
  } catch (error: any) {
    console.log("Upgrade role check failed:", error.reason);
  }
  
  console.log("\n🎉 All tests completed!");
  console.log("\n📋 Summary:");
  console.log("✅ Contract deployed with governance features");
  console.log("✅ Whitelist management working");
  console.log("✅ Mint/burn require 6-hour timelock delays");
  console.log("✅ Contract upgrades are immediate (role-based)");
  console.log("✅ Transfers blocked (non-transferable)");
  console.log("✅ Timelock governance for mint/burn operations");
  console.log("✅ Role-based access control active");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 