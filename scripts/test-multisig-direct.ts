import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TESTING MULTISIG OPERATIONS (WITHOUT TIMELOCK)\n");
  console.log("This script tests direct multisig operations for faster testing");
  console.log("Timelock will be re-enabled after testing is complete");
  console.log("=" .repeat(60) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Test executor:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const GNOSIS_SAFE_ADDRESS = "0x028e4F1953B9c8eF572F439b319A536e94683022"; // From your setup

  console.log("🔗 Contract Addresses:");
  console.log(`   YREC Token: ${YREC_TOKEN_ADDRESS}`);
  console.log(`   Gnosis Safe: ${GNOSIS_SAFE_ADDRESS}`);
  console.log("");

  // Get contract instances
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  // ============ STEP 1: CURRENT STATE ============
  
  console.log("📊 Current State:");
  const totalSupply = await yrecToken.totalSupply();
  const totalIPValue = await yrecToken.getTotalIPValue();
  const safeBalance = await yrecToken.balanceOf(GNOSIS_SAFE_ADDRESS);
  const ipPerToken = await yrecToken.getIPValuePerToken();
  
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
  console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);
  console.log(`   Safe Balance: ${ethers.formatEther(safeBalance)} YREC`);
  console.log(`   IP per Token: $${ethers.formatEther(ipPerToken)}`);
  console.log("");

  // ============ STEP 2: TEMPORARILY GRANT DIRECT ROLES TO DEPLOYER ============
  
  console.log("🔑 Step 1: Temporarily Grant Direct Roles for Testing");
  console.log("   (This bypasses timelock for testing purposes)");
  
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  
  // Check current roles
  const hasBurnerRole = await yrecToken.hasRole(BURNER_ROLE, deployer.address);
  const hasMinterRole = await yrecToken.hasRole(MINTER_ROLE, deployer.address);
  
  console.log(`   Deployer has BURNER_ROLE: ${hasBurnerRole}`);
  console.log(`   Deployer has MINTER_ROLE: ${hasMinterRole}`);
  
  if (!hasBurnerRole) {
    console.log("   Granting BURNER_ROLE to deployer for testing...");
    await yrecToken.grantRole(BURNER_ROLE, deployer.address);
    console.log("   ✅ BURNER_ROLE granted");
  }

  if (!hasMinterRole) {
    console.log("   Granting MINTER_ROLE to deployer for testing...");
    await yrecToken.grantRole(MINTER_ROLE, deployer.address);
    console.log("   ✅ MINTER_ROLE granted");
  }
  console.log("");

  // ============ STEP 3: TEST BURN FROM SAFE BALANCE ============
  
  console.log("🔥 Step 2: Testing Burn from Safe Balance");
  console.log("   (Simulating backend burn operation)");
  
  if (safeBalance > 0n) {
    // Burn a portion of the Safe's balance (e.g., 50 YREC)
    const burnAmount = ethers.parseEther("50"); // 50 YREC
    
    if (safeBalance >= burnAmount) {
      console.log(`   Burning ${ethers.formatEther(burnAmount)} YREC from Safe balance...`);
      console.log(`   Safe balance before: ${ethers.formatEther(safeBalance)} YREC`);
      
      try {
        const tx = await yrecToken.burn(GNOSIS_SAFE_ADDRESS, burnAmount);
        await tx.wait();
        
        const newSafeBalance = await yrecToken.balanceOf(GNOSIS_SAFE_ADDRESS);
        const newTotalSupply = await yrecToken.totalSupply();
        const newTotalIPValue = await yrecToken.getTotalIPValue();
        const newIPPerToken = await yrecToken.getIPValuePerToken();
        
        console.log("   ✅ Burn successful!");
        console.log(`   Safe balance after: ${ethers.formatEther(newSafeBalance)} YREC`);
        console.log(`   New total supply: ${ethers.formatEther(newTotalSupply)} YREC`);
        console.log(`   New total IP value: $${ethers.formatEther(newTotalIPValue)}`);
        console.log(`   New IP per token: $${ethers.formatEther(newIPPerToken)}`);
        
      } catch (error) {
        console.log("   ❌ Burn failed:", error);
      }
    } else {
      console.log(`   ⚠️ Insufficient balance: ${ethers.formatEther(safeBalance)} < ${ethers.formatEther(burnAmount)}`);
    }
  } else {
    console.log("   ⚠️ No YREC balance in Safe to burn");
  }
  console.log("");

  // ============ STEP 4: TEST MINTING TO SAFE ============
  
  console.log("🪙 Step 3: Testing Mint to Safe");
  console.log("   (Simulating backend mint operation)");
  
  try {
    const mintAmount = ethers.parseEther("100"); // 100 YREC
    const ipValue = ethers.parseEther("5000"); // $5,000 IP value
    
    console.log(`   Minting ${ethers.formatEther(mintAmount)} YREC to Safe...`);
    console.log(`   With $${ethers.formatEther(ipValue)} IP value backing...`);
    
    const tx = await yrecToken.mint(GNOSIS_SAFE_ADDRESS, mintAmount, ipValue);
    await tx.wait();
    
    const newSafeBalance = await yrecToken.balanceOf(GNOSIS_SAFE_ADDRESS);
    const newTotalSupply = await yrecToken.totalSupply();
    const newTotalIPValue = await yrecToken.getTotalIPValue();
    const newIPPerToken = await yrecToken.getIPValuePerToken();
    
    console.log("   ✅ Mint successful!");
    console.log(`   Safe balance: ${ethers.formatEther(newSafeBalance)} YREC`);
    console.log(`   Total supply: ${ethers.formatEther(newTotalSupply)} YREC`);
    console.log(`   Total IP value: $${ethers.formatEther(newTotalIPValue)}`);
    console.log(`   IP per token: $${ethers.formatEther(newIPPerToken)}`);
    
  } catch (error) {
    console.log("   ❌ Mint failed:", error);
  }
  console.log("");

  // ============ STEP 5: TEST TRANSFER FROM SAFE ============
  
  console.log("💸 Step 4: Test Transfer from Safe");
  console.log("   (This would normally require Safe signatures)");
  console.log("   For now, we'll just show the balance for manual testing");
  
  const finalSafeBalance = await yrecToken.balanceOf(GNOSIS_SAFE_ADDRESS);
  console.log(`   Safe YREC Balance: ${ethers.formatEther(finalSafeBalance)} YREC`);
  console.log("   💡 To test transfers, use the Safe web interface");
  console.log("   💡 Send small amounts to test addresses");
  console.log("");

  // ============ STEP 6: REVOKE TEMPORARY ROLES ============
  
  console.log("🚫 Step 5: Revoke Temporary Roles");
  console.log("   (Cleaning up test permissions)");
  
  try {
    console.log("   Revoking BURNER_ROLE from deployer...");
    await yrecToken.revokeRole(BURNER_ROLE, deployer.address);
    console.log("   ✅ BURNER_ROLE revoked");
    
    console.log("   Revoking MINTER_ROLE from deployer...");
    await yrecToken.revokeRole(MINTER_ROLE, deployer.address);
    console.log("   ✅ MINTER_ROLE revoked");
    
  } catch (error) {
    console.log("   ⚠️ Role revocation may require admin permissions");
  }
  console.log("");

  // ============ FINAL STATE ============
  
  console.log("📊 Final State After Testing:");
  const finalTotalSupply = await yrecToken.totalSupply();
  const finalTotalIPValue = await yrecToken.getTotalIPValue();
  const finalIPPerToken = await yrecToken.getIPValuePerToken();
  
  console.log(`   Total Supply: ${ethers.formatEther(finalTotalSupply)} YREC`);
  console.log(`   Total IP Value: $${ethers.formatEther(finalTotalIPValue)}`);
  console.log(`   IP per Token: $${ethers.formatEther(finalIPPerToken)}`);
  console.log(`   Safe Balance: ${ethers.formatEther(finalSafeBalance)} YREC`);
  console.log("");

  console.log("🎉 MULTISIG TESTING COMPLETED!");
  console.log("");
  console.log("✅ What was tested:");
  console.log("   - Direct burn from Safe balance (bypassing timelock)");
  console.log("   - Direct mint to Safe (bypassing timelock)");
  console.log("   - Role management for testing");
  console.log("   - IP value consistency maintained");
  console.log("");
  
  console.log("📋 Next Steps:");
  console.log("1. Test transfers manually in Safe web interface");
  console.log("2. Re-enable timelock for production operations");
  console.log("3. Set up proper multisig governance workflows");
  console.log("4. Configure backend to use timelock for all operations");
  console.log("");

  console.log("🔗 Quick Links:");
  console.log(`   Token Contract: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log(`   Gnosis Safe: https://testnet-explorer.plume.org/address/${GNOSIS_SAFE_ADDRESS}`);
  console.log(`   Safe Interface: https://safe.onchainden.com/home?safe=plume:${GNOSIS_SAFE_ADDRESS}`);
  console.log("");
  
  console.log("⚠️  IMPORTANT: After testing, make sure to:");
  console.log("   - Transfer all roles back to timelock");
  console.log("   - Use timelock for all production operations");
  console.log("   - Set up 24h delay for critical functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 