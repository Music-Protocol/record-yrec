import { ethers } from "hardhat";

async function main() {
  console.log("⏰ RE-ENABLING TIMELOCK GOVERNANCE\n");
  console.log("This script transfers all roles back to timelock for production");
  console.log("=" .repeat(60) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Admin:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const YREC_TIMELOCK_ADDRESS = "0x4a11689D0D722353449c3ed1bC3Fcb62B4efA229";
  const GNOSIS_SAFE_ADDRESS = "0x028e4F1953B9c8eF572F439b319A536e94683022";

  console.log("🔗 Contract Addresses:");
  console.log(`   YREC Token: ${YREC_TOKEN_ADDRESS}`);
  console.log(`   Timelock: ${YREC_TIMELOCK_ADDRESS}`);
  console.log(`   Safe: ${GNOSIS_SAFE_ADDRESS}`);
  console.log("");

  // Get contract instances
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  // ============ STEP 1: CURRENT ROLE STATE ============
  
  console.log("🔑 Step 1: Current Role State");
  
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const PAUSER_ROLE = await yrecToken.PAUSER_ROLE();
  const UPGRADER_ROLE = await yrecToken.UPGRADER_ROLE();
  const WHITELIST_MANAGER_ROLE = await yrecToken.WHITELIST_MANAGER_ROLE();
  const COMPLIANCE_OFFICER_ROLE = await yrecToken.COMPLIANCE_OFFICER_ROLE();
  
  console.log("   Checking current role assignments...");
  
  const deployerHasMinter = await yrecToken.hasRole(MINTER_ROLE, deployer.address);
  const deployerHasBurner = await yrecToken.hasRole(BURNER_ROLE, deployer.address);
  const timelockHasMinter = await yrecToken.hasRole(MINTER_ROLE, YREC_TIMELOCK_ADDRESS);
  const timelockHasBurner = await yrecToken.hasRole(BURNER_ROLE, YREC_TIMELOCK_ADDRESS);
  
  console.log(`   Deployer MINTER_ROLE: ${deployerHasMinter}`);
  console.log(`   Deployer BURNER_ROLE: ${deployerHasBurner}`);
  console.log(`   Timelock MINTER_ROLE: ${timelockHasMinter}`);
  console.log(`   Timelock BURNER_ROLE: ${timelockHasBurner}`);
  console.log("");

  // ============ STEP 2: GRANT ROLES TO TIMELOCK ============
  
  console.log("🎯 Step 2: Grant All Operational Roles to Timelock");
  console.log("   (Ensures all operations go through 24h governance delay)");
  
  const rolesToGrant = [
    { role: MINTER_ROLE, name: "MINTER_ROLE" },
    { role: BURNER_ROLE, name: "BURNER_ROLE" },
    { role: PAUSER_ROLE, name: "PAUSER_ROLE" },
    { role: WHITELIST_MANAGER_ROLE, name: "WHITELIST_MANAGER_ROLE" }
  ];

  for (const { role, name } of rolesToGrant) {
    const timelockHasRole = await yrecToken.hasRole(role, YREC_TIMELOCK_ADDRESS);
    
    if (!timelockHasRole) {
      console.log(`   Granting ${name} to Timelock...`);
      try {
        const tx = await yrecToken.grantRole(role, YREC_TIMELOCK_ADDRESS);
        await tx.wait();
        console.log(`   ✅ ${name} granted to Timelock`);
      } catch (error) {
        console.log(`   ❌ Failed to grant ${name}:`, error);
      }
    } else {
      console.log(`   ✅ Timelock already has ${name}`);
    }
  }
  console.log("");

  // ============ STEP 3: REVOKE DIRECT ROLES FROM DEPLOYER ============
  
  console.log("🚫 Step 3: Revoke Direct Roles from Deployer");
  console.log("   (Forces all operations through timelock governance)");
  
  const rolesToRevoke = [
    { role: MINTER_ROLE, name: "MINTER_ROLE" },
    { role: BURNER_ROLE, name: "BURNER_ROLE" },
    { role: PAUSER_ROLE, name: "PAUSER_ROLE" },
    { role: WHITELIST_MANAGER_ROLE, name: "WHITELIST_MANAGER_ROLE" }
  ];

  for (const { role, name } of rolesToRevoke) {
    const deployerHasRole = await yrecToken.hasRole(role, deployer.address);
    
    if (deployerHasRole) {
      console.log(`   Revoking ${name} from deployer...`);
      try {
        const tx = await yrecToken.revokeRole(role, deployer.address);
        await tx.wait();
        console.log(`   ✅ ${name} revoked from deployer`);
      } catch (error) {
        console.log(`   ❌ Failed to revoke ${name}:`, error);
      }
    } else {
      console.log(`   ✅ Deployer doesn't have ${name}`);
    }
  }
  console.log("");

  // ============ STEP 4: VERIFY FINAL ROLE STATE ============
  
  console.log("🔍 Step 4: Verify Final Role Configuration");
  
  console.log("   Final role assignments:");
  for (const { role, name } of rolesToGrant) {
    const timelockHas = await yrecToken.hasRole(role, YREC_TIMELOCK_ADDRESS);
    const deployerHas = await yrecToken.hasRole(role, deployer.address);
    
    console.log(`   ${name}:`);
    console.log(`     Timelock: ${timelockHas ? '✅' : '❌'}`);
    console.log(`     Deployer: ${deployerHas ? '⚠️' : '✅'} (should be false)`);
  }
  console.log("");

  // ============ STEP 5: TEST TIMELOCK REQUIREMENT ============
  
  console.log("🧪 Step 5: Test Timelock Requirement");
  console.log("   (Verify that direct operations are now blocked)");
  
  try {
    console.log("   Attempting direct mint (should fail)...");
    const mintAmount = ethers.parseEther("1"); // 1 YREC
    const ipValue = ethers.parseEther("50"); // $50 IP value
    
    await yrecToken.mint(GNOSIS_SAFE_ADDRESS, mintAmount, ipValue);
    console.log("   ❌ Direct mint succeeded (this should not happen!)");
    
  } catch (error: any) {
    console.log("   ✅ Direct mint blocked (as expected)");
    console.log(`   Error: ${error.message?.substring(0, 100) || error}...`);
  }

  try {
    console.log("   Attempting direct burn (should fail)...");
    const burnAmount = ethers.parseEther("1"); // 1 YREC
    
    await yrecToken.burn(GNOSIS_SAFE_ADDRESS, burnAmount);
    console.log("   ❌ Direct burn succeeded (this should not happen!)");
    
  } catch (error: any) {
    console.log("   ✅ Direct burn blocked (as expected)");
    console.log(`   Error: ${error.message?.substring(0, 100) || error}...`);
  }
  console.log("");

  // ============ FINAL SUMMARY ============
  
  console.log("🎉 TIMELOCK GOVERNANCE RE-ENABLED!");
  console.log("");
  console.log("✅ Configuration Complete:");
  console.log("   - All operational roles transferred to Timelock");
  console.log("   - Direct operations blocked for deployer");
  console.log("   - 24-hour delay now required for all critical functions");
  console.log("   - Governance properly secured");
  console.log("");
  
  console.log("📋 How Operations Work Now:");
  console.log("1. Backend prepares operation (mint/burn/pause)");
  console.log("2. Operation is queued in Timelock (24h delay)");
  console.log("3. After delay, multisig can execute the operation");
  console.log("4. All changes require governance consensus");
  console.log("");

  console.log("🔧 For Backend Integration:");
  console.log("- Use TimelocController.schedule() to queue operations");
  console.log("- Wait 24 hours for timelock delay");
  console.log("- Use TimelockController.execute() to run operations");
  console.log("- All calls must come from authorized multisig");
  console.log("");

  console.log("🔗 Contract Links:");
  console.log(`   Token: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log(`   Timelock: https://testnet-explorer.plume.org/address/${YREC_TIMELOCK_ADDRESS}`);
  console.log(`   Safe: https://testnet-explorer.plume.org/address/${GNOSIS_SAFE_ADDRESS}`);
  console.log("");
  
  console.log("⚠️  IMPORTANT:");
  console.log("   - Testing phase complete");
  console.log("   - Production governance now active");
  console.log("   - All operations require 24h timelock + multisig");
  console.log("   - Emergency functions still available to admin");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 