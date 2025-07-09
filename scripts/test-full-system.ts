import { ethers } from "hardhat";

async function main() {
  console.log("🧪 COMPREHENSIVE YREC SYSTEM TEST\n");
  console.log("=".repeat(60));
  console.log("Testing all functions on Plume Testnet before mainnet deployment");
  console.log("=".repeat(60) + "\n");

  // ============ SETUP ============
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Test executor:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const YREC_TIMELOCK_ADDRESS = "0x4a11689D0D722353449c3ed1bC3Fcb62B4efA229";

  console.log("🔗 Contract Addresses:");
  console.log(`   YREC Token: ${YREC_TOKEN_ADDRESS}`);
  console.log(`   Timelock: ${YREC_TIMELOCK_ADDRESS}`);
  console.log("");

  // Get contract instances
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);
  const timelock = await ethers.getContractAt("YRECTimelock", YREC_TIMELOCK_ADDRESS);

  // Test results tracking
  const testResults: { [key: string]: boolean } = {};
  let totalTests = 0;
  let passedTests = 0;

  // Helper functions
  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${testName}`);
      await testFunction();
      console.log(`   ✅ PASSED\n`);
      testResults[testName] = true;
      passedTests++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error}\n`);
      testResults[testName] = false;
    }
  };

  const formatAmount = (amount: bigint) => ethers.formatEther(amount);
  const parseAmount = (amount: string) => ethers.parseEther(amount);

  // ============ TEST 1: BASIC TOKEN INFORMATION ============
  
  await runTest("Basic Token Information", async () => {
    const name = await yrecToken.name();
    const symbol = await yrecToken.symbol();
    const decimals = await yrecToken.decimals();
    const version = await yrecToken.VERSION();
    
    console.log(`     Name: ${name}`);
    console.log(`     Symbol: ${symbol}`);
    console.log(`     Decimals: ${decimals}`);
    console.log(`     Version: ${version}`);
    
    if (name !== "YREC Token" || symbol !== "YREC" || decimals !== 18n || version !== 1n) {
      throw new Error("Token information mismatch");
    }
  });

  // ============ TEST 2: CURRENT STATE VERIFICATION ============
  
  await runTest("Current System State", async () => {
    const totalSupply = await yrecToken.totalSupply();
    const totalIPValue = await yrecToken.getTotalIPValue();
    const ipPerToken = await yrecToken.getIPValuePerToken();
    const transfersEnabled = await yrecToken.transfersEnabled();
    const paused = await yrecToken.paused();
    const upgradeMoratoriumEnd = await yrecToken.upgradeMoratoriumEnd();
    
    console.log(`     Total Supply: ${formatAmount(totalSupply)} YREC`);
    console.log(`     Total IP Value: $${formatAmount(totalIPValue)}`);
    console.log(`     IP per Token: $${formatAmount(ipPerToken)}`);
    console.log(`     Transfers Enabled: ${transfersEnabled}`);
    console.log(`     Paused: ${paused}`);
    console.log(`     Upgrade Moratorium Until: ${new Date(Number(upgradeMoratoriumEnd) * 1000).toISOString()}`);
    
    if (totalSupply === 0n) {
      throw new Error("No tokens in circulation");
    }
  });

  // ============ TEST 3: ROLE VERIFICATION ============
  
  await runTest("Role-Based Access Control", async () => {
    const DEFAULT_ADMIN_ROLE = await yrecToken.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await yrecToken.MINTER_ROLE();
    const BURNER_ROLE = await yrecToken.BURNER_ROLE();
    const PAUSER_ROLE = await yrecToken.PAUSER_ROLE();
    const UPGRADER_ROLE = await yrecToken.UPGRADER_ROLE();
    const WHITELIST_MANAGER_ROLE = await yrecToken.WHITELIST_MANAGER_ROLE();
    const COMPLIANCE_OFFICER_ROLE = await yrecToken.COMPLIANCE_OFFICER_ROLE();
    
    const roles = [
      { name: "DEFAULT_ADMIN", hash: DEFAULT_ADMIN_ROLE },
      { name: "MINTER", hash: MINTER_ROLE },
      { name: "BURNER", hash: BURNER_ROLE },
      { name: "PAUSER", hash: PAUSER_ROLE },
      { name: "UPGRADER", hash: UPGRADER_ROLE },
      { name: "WHITELIST_MANAGER", hash: WHITELIST_MANAGER_ROLE },
      { name: "COMPLIANCE_OFFICER", hash: COMPLIANCE_OFFICER_ROLE }
    ];
    
    for (const role of roles) {
      const hasRole = await yrecToken.hasRole(role.hash, deployer.address);
      console.log(`     ${role.name}: ${hasRole ? '✅' : '❌'}`);
      if (!hasRole && role.name !== "UPGRADER") { // UPGRADER might be transferred to timelock
        throw new Error(`Missing ${role.name} role`);
      }
    }
  });

  // ============ TEST 4: WHITELIST FUNCTIONALITY ============
  
  await runTest("Whitelist Management", async () => {
    // Check current whitelist status
    const isDeployerWhitelisted = await yrecToken.isWhitelisted(deployer.address);
    console.log(`     Deployer whitelisted: ${isDeployerWhitelisted}`);
    
    // Create test address for whitelist testing
    const testWallet = ethers.Wallet.createRandom();
    const testAddress = testWallet.address;
    
    // Test adding to whitelist
    const isInitiallyWhitelisted = await yrecToken.isWhitelisted(testAddress);
    console.log(`     Test address initially whitelisted: ${isInitiallyWhitelisted}`);
    
    if (!isInitiallyWhitelisted) {
      // Add to whitelist
      await yrecToken.updateWhitelist(testAddress, true);
      const isNowWhitelisted = await yrecToken.isWhitelisted(testAddress);
      console.log(`     Test address after adding: ${isNowWhitelisted}`);
      
      if (!isNowWhitelisted) {
        throw new Error("Failed to add address to whitelist");
      }
      
      // Remove from whitelist
      await yrecToken.updateWhitelist(testAddress, false);
      const isRemovedFromWhitelist = await yrecToken.isWhitelisted(testAddress);
      console.log(`     Test address after removing: ${isRemovedFromWhitelist}`);
      
      if (isRemovedFromWhitelist) {
        throw new Error("Failed to remove address from whitelist");
      }
    }
  });

  // ============ TEST 5: TOKEN MINTING ============
  
  await runTest("Token Minting with IP Value", async () => {
    const initialSupply = await yrecToken.totalSupply();
    const initialIPValue = await yrecToken.getTotalIPValue();
    
    console.log(`     Initial Supply: ${formatAmount(initialSupply)} YREC`);
    console.log(`     Initial IP Value: $${formatAmount(initialIPValue)}`);
    
    // Mint 100 YREC with $5000 IP value
    const mintAmount = parseAmount("100");
    const ipValue = parseAmount("5000");
    
    await yrecToken.mint(deployer.address, mintAmount, ipValue);
    
    const newSupply = await yrecToken.totalSupply();
    const newIPValue = await yrecToken.getTotalIPValue();
    const newIPPerToken = await yrecToken.getIPValuePerToken();
    
    console.log(`     New Supply: ${formatAmount(newSupply)} YREC`);
    console.log(`     New IP Value: $${formatAmount(newIPValue)}`);
    console.log(`     New IP per Token: $${formatAmount(newIPPerToken)}`);
    
    const expectedSupply = initialSupply + mintAmount;
    const expectedIPValue = initialIPValue + ipValue;
    
    if (newSupply !== expectedSupply || newIPValue !== expectedIPValue) {
      throw new Error("Minting amounts don't match expected values");
    }
  });

  // ============ TEST 6: TOKEN BURNING ============
  
  await runTest("Token Burning with IP Reduction", async () => {
    const initialSupply = await yrecToken.totalSupply();
    const initialIPValue = await yrecToken.getTotalIPValue();
    const initialDeployerBalance = await yrecToken.balanceOf(deployer.address);
    const initialDeployerIPValue = await yrecToken.getIPValueForHolder(deployer.address);
    
    console.log(`     Before Burn - Supply: ${formatAmount(initialSupply)} YREC`);
    console.log(`     Before Burn - IP Value: $${formatAmount(initialIPValue)}`);
    console.log(`     Before Burn - Deployer Balance: ${formatAmount(initialDeployerBalance)} YREC`);
    console.log(`     Before Burn - Deployer IP Value: $${formatAmount(initialDeployerIPValue)}`);
    
    // Burn 50 YREC
    const burnAmount = parseAmount("50");
    
    await yrecToken.burn(deployer.address, burnAmount);
    
    const newSupply = await yrecToken.totalSupply();
    const newIPValue = await yrecToken.getTotalIPValue();
    const newDeployerBalance = await yrecToken.balanceOf(deployer.address);
    const newDeployerIPValue = await yrecToken.getIPValueForHolder(deployer.address);
    const newIPPerToken = await yrecToken.getIPValuePerToken();
    
    console.log(`     After Burn - Supply: ${formatAmount(newSupply)} YREC`);
    console.log(`     After Burn - IP Value: $${formatAmount(newIPValue)}`);
    console.log(`     After Burn - Deployer Balance: ${formatAmount(newDeployerBalance)} YREC`);
    console.log(`     After Burn - Deployer IP Value: $${formatAmount(newDeployerIPValue)}`);
    console.log(`     After Burn - IP per Token: $${formatAmount(newIPPerToken)}`);
    
    const expectedSupply = initialSupply - burnAmount;
    const expectedDeployerBalance = initialDeployerBalance - burnAmount;
    
    if (newSupply !== expectedSupply || newDeployerBalance !== expectedDeployerBalance) {
      throw new Error("Burning amounts don't match expected values");
    }
  });

  // ============ TEST 7: TRANSFER FUNCTIONALITY ============
  
  await runTest("Token Transfers (Whitelist Only)", async () => {
    // Create a test recipient wallet
    const recipient = ethers.Wallet.createRandom();
    
    // Add recipient to whitelist
    await yrecToken.updateWhitelist(recipient.address, true);
    
    const initialSenderBalance = await yrecToken.balanceOf(deployer.address);
    const initialRecipientBalance = await yrecToken.balanceOf(recipient.address);
    
    console.log(`     Initial Sender Balance: ${formatAmount(initialSenderBalance)} YREC`);
    console.log(`     Initial Recipient Balance: ${formatAmount(initialRecipientBalance)} YREC`);
    
    // Transfer 25 YREC
    const transferAmount = parseAmount("25");
    
    await yrecToken.transfer(recipient.address, transferAmount);
    
    const newSenderBalance = await yrecToken.balanceOf(deployer.address);
    const newRecipientBalance = await yrecToken.balanceOf(recipient.address);
    
    console.log(`     New Sender Balance: ${formatAmount(newSenderBalance)} YREC`);
    console.log(`     New Recipient Balance: ${formatAmount(newRecipientBalance)} YREC`);
    
    const expectedSenderBalance = initialSenderBalance - transferAmount;
    const expectedRecipientBalance = initialRecipientBalance + transferAmount;
    
    if (newSenderBalance !== expectedSenderBalance || newRecipientBalance !== expectedRecipientBalance) {
      throw new Error("Transfer amounts don't match expected values");
    }
    
    // Test IP value transfer
    const senderIPValue = await yrecToken.getIPValueForHolder(deployer.address);
    const recipientIPValue = await yrecToken.getIPValueForHolder(recipient.address);
    
    console.log(`     Sender IP Value: $${formatAmount(senderIPValue)}`);
    console.log(`     Recipient IP Value: $${formatAmount(recipientIPValue)}`);
    
    if (recipientIPValue === 0n) {
      throw new Error("IP value not transferred properly");
    }
  });

  // ============ TEST 8: COMPLIANCE FEATURES ============
  
  await runTest("Compliance and Transfer Controls", async () => {
    // Test transfer to non-whitelisted address (should fail)
    const nonWhitelistedWallet = ethers.Wallet.createRandom();
    
    console.log(`     Testing transfer to non-whitelisted address: ${nonWhitelistedWallet.address.slice(0, 10)}...`);
    
    try {
      await yrecToken.transfer(nonWhitelistedWallet.address, parseAmount("1"));
      throw new Error("Transfer to non-whitelisted address should have failed");
    } catch (error: any) {
      if (error.message.includes("TransferNotAllowed") || error.message.includes("Address not whitelisted")) {
        console.log(`     ✅ Transfer correctly blocked: ${error.message.split('(')[0]}`);
      } else {
        throw error;
      }
    }
    
    // Test disable/enable transfers
    const transfersEnabledBefore = await yrecToken.transfersEnabled();
    console.log(`     Transfers enabled before: ${transfersEnabledBefore}`);
    
    if (transfersEnabledBefore) {
      // Disable transfers
      await yrecToken.setTransfersEnabled(false);
      const transfersDisabled = await yrecToken.transfersEnabled();
      console.log(`     Transfers after disabling: ${transfersDisabled}`);
      
      if (transfersDisabled) {
        throw new Error("Failed to disable transfers");
      }
      
      // Re-enable transfers
      await yrecToken.setTransfersEnabled(true);
      const transfersReEnabled = await yrecToken.transfersEnabled();
      console.log(`     Transfers after re-enabling: ${transfersReEnabled}`);
      
      if (!transfersReEnabled) {
        throw new Error("Failed to re-enable transfers");
      }
    }
  });

  // ============ TEST 9: TIMELOCK FUNCTIONALITY ============
  
  await runTest("Timelock Controller", async () => {
    const minDelay = await timelock.getMinDelay();
    console.log(`     Minimum delay: ${minDelay / 3600} hours`);
    
    // Test timelock roles
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    
    const isProposer = await timelock.hasRole(PROPOSER_ROLE, deployer.address);
    const isExecutor = await timelock.hasRole(EXECUTOR_ROLE, deployer.address);
    const isAdmin = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, deployer.address);
    
    console.log(`     Is Proposer: ${isProposer}`);
    console.log(`     Is Executor: ${isExecutor}`);
    console.log(`     Is Admin: ${isAdmin}`);
    
    if (!isProposer || !isExecutor) {
      throw new Error("Missing required timelock roles");
    }
  });

  // ============ TEST 10: IP VALUE CALCULATIONS ============
  
  await runTest("IP Value Calculations", async () => {
    const totalSupply = await yrecToken.totalSupply();
    const totalIPValue = await yrecToken.getTotalIPValue();
    const calculatedIPPerToken = totalSupply > 0n ? totalIPValue / totalSupply : 0n;
    const contractIPPerToken = await yrecToken.getIPValuePerToken();
    
    console.log(`     Total Supply: ${formatAmount(totalSupply)} YREC`);
    console.log(`     Total IP Value: $${formatAmount(totalIPValue)}`);
    console.log(`     Calculated IP per Token: $${formatAmount(calculatedIPPerToken)}`);
    console.log(`     Contract IP per Token: $${formatAmount(contractIPPerToken)}`);
    
    // Allow for small rounding differences
    const difference = calculatedIPPerToken > contractIPPerToken 
      ? calculatedIPPerToken - contractIPPerToken 
      : contractIPPerToken - calculatedIPPerToken;
    
    if (difference > parseAmount("0.01")) { // Allow 1 cent difference
      throw new Error("IP value calculation mismatch");
    }
  });

  // ============ TEST 11: UPGRADE MORATORIUM ============
  
  await runTest("Upgrade Moratorium Protection", async () => {
    const upgradeMoratoriumEnd = await yrecToken.upgradeMoratoriumEnd();
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log(`     Current Time: ${new Date(currentTime * 1000).toISOString()}`);
    console.log(`     Moratorium End: ${new Date(Number(upgradeMoratoriumEnd) * 1000).toISOString()}`);
    console.log(`     Moratorium Active: ${currentTime < Number(upgradeMoratoriumEnd)}`);
    
    if (currentTime >= Number(upgradeMoratoriumEnd)) {
      throw new Error("Upgrade moratorium has expired - this should be active for 6 months");
    }
    
    // Calculate remaining time
    const remainingSeconds = Number(upgradeMoratoriumEnd) - currentTime;
    const remainingDays = Math.floor(remainingSeconds / 86400);
    
    console.log(`     Days remaining: ${remainingDays}`);
    
    if (remainingDays < 150) { // Should have ~180 days initially
      console.log(`     ⚠️  Warning: Less than 150 days remaining in moratorium`);
    }
  });

  // ============ TEST 12: BATCH OPERATIONS ============
  
  await runTest("Batch Whitelist Operations", async () => {
    // Create multiple test addresses
    const testAddresses = [
      ethers.Wallet.createRandom().address,
      ethers.Wallet.createRandom().address,
      ethers.Wallet.createRandom().address
    ];
    
    console.log(`     Testing batch whitelist for ${testAddresses.length} addresses`);
    
    // Batch add to whitelist
    await yrecToken.batchUpdateWhitelist(testAddresses, true);
    
    // Verify all are whitelisted
    for (let i = 0; i < testAddresses.length; i++) {
      const isWhitelisted = await yrecToken.isWhitelisted(testAddresses[i]);
      console.log(`     Address ${i + 1} whitelisted: ${isWhitelisted}`);
      
      if (!isWhitelisted) {
        throw new Error(`Address ${i + 1} not properly whitelisted`);
      }
    }
    
    // Batch remove from whitelist
    await yrecToken.batchUpdateWhitelist(testAddresses, false);
    
    // Verify all are removed
    for (let i = 0; i < testAddresses.length; i++) {
      const isWhitelisted = await yrecToken.isWhitelisted(testAddresses[i]);
      console.log(`     Address ${i + 1} after removal: ${isWhitelisted}`);
      
      if (isWhitelisted) {
        throw new Error(`Address ${i + 1} not properly removed from whitelist`);
      }
    }
  });

  // ============ FINAL REPORT ============
  
  console.log("=".repeat(60));
  console.log("🏁 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
  
  // Show detailed results
  console.log("📋 Detailed Results:");
  for (const [testName, passed] of Object.entries(testResults)) {
    const status = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`   ${status} - ${testName}`);
  }
  
  console.log("");
  
  // Final state summary
  console.log("📊 Final System State:");
  const finalSupply = await yrecToken.totalSupply();
  const finalIPValue = await yrecToken.getTotalIPValue();
  const finalIPPerToken = await yrecToken.getIPValuePerToken();
  
  console.log(`   Total Supply: ${formatAmount(finalSupply)} YREC`);
  console.log(`   Total IP Value: $${formatAmount(finalIPValue)}`);
  console.log(`   IP Value per Token: $${formatAmount(finalIPPerToken)}`);
  
  // Recommendation
  if (passedTests === totalTests) {
    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("✅ System is ready for production deployment");
    console.log("🚀 You can proceed with mainnet deployment when ready");
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} TEST(S) FAILED`);
    console.log("❌ Please fix issues before mainnet deployment");
    console.log("🔧 Review failed tests and address any problems");
  }
  
  console.log("\n🔗 Testnet Explorer:");
  console.log(`   Token: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log(`   Timelock: https://testnet-explorer.plume.org/address/${YREC_TIMELOCK_ADDRESS}`);
  
  console.log("\n📝 Next Steps:");
  console.log("1. Set up Gnosis Safe multisig");
  console.log("2. Transfer ownership to multisig");
  console.log("3. Set up backend monitoring");
  console.log("4. Prepare for mainnet deployment");
  
  console.log("\n" + "=".repeat(60));
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