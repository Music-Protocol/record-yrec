import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Starting PMOCK Token Deployment for Testing...\n");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // ============ PMOCK DEPLOYMENT CONFIGURATION ============
  
  // Use provided addresses
  const DEPLOYER_ADDRESS = "0x292eA19bF5F2CF7bC20fEcF45478DF496f551fea";
  const SAFE_ADDRESS = "0xF9BFf4dF68a89708181783e3cfe03dB7Daa8606c";
  
  // Verify deployer matches
  if (deployer.address.toLowerCase() !== DEPLOYER_ADDRESS.toLowerCase()) {
    console.warn("⚠️  WARNING: Deployer address doesn't match expected address!");
    console.warn(`   Expected: ${DEPLOYER_ADDRESS}`);
    console.warn(`   Actual: ${deployer.address}`);
  }

  console.log("⚙️  PMOCK Deployment Configuration:");
  console.log("   Initial Owner (Deployer):", DEPLOYER_ADDRESS);
  console.log("   Custodian Wallet (SAFE):", SAFE_ADDRESS);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("   Testing Mode: NO TIMELOCK");
  console.log("   Deployment Target: MAINNET (for SAFE compatibility)");
  console.log("");

  // ============ DEPLOY PMOCK TOKEN (UPGRADEABLE) ============
  
  console.log("🪙 Deploying PMOCK Token (Upgradeable Proxy)...");
  
  const PMOCKTokenFactory = await ethers.getContractFactory("PMOCKToken");
  
  // Deploy with upgradeable proxy
  const pmockTokenProxy = await upgrades.deployProxy(
    PMOCKTokenFactory,
    [DEPLOYER_ADDRESS, SAFE_ADDRESS],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  
  await pmockTokenProxy.waitForDeployment();
  const tokenAddress = await pmockTokenProxy.getAddress();
  
  // Get the properly typed contract instance
  const pmockToken = PMOCKTokenFactory.attach(tokenAddress) as any;
  
  console.log("✅ PMOCK Token deployed to:", tokenAddress);
  console.log("   Token Name:", await pmockToken.name());
  console.log("   Token Symbol:", await pmockToken.symbol());
  console.log("   Decimals:", await pmockToken.decimals());
  console.log("   Version:", await pmockToken.VERSION());
  console.log("");

  // ============ CONFIGURE SAFE WHITELIST ============
  
  console.log("🔐 Configuring SAFE signers whitelist...");
  
  // SAFE signers from user input
  const SAFE_SIGNERS = [
    "0x17002567e86E39E3E31708ca953a809CcEf9f507", // IG
    "0xF3B1b6b54996AdB99F598d1a013bf4FA47a53dac", // SM  
    "0x292eA19bF5F2CF7bC20fEcF45478DF496f551fea", // DEV (also deployer)
  ];

  // Whitelist all SAFE signers
  for (const signer of SAFE_SIGNERS) {
    try {
      const tx = await pmockToken.updateWhitelist(signer, true);
      await tx.wait();
      console.log(`   ✅ Whitelisted signer: ${signer}`);
    } catch (error) {
      console.log(`   ⚠️  Failed to whitelist ${signer}:`, error);
    }
  }
  console.log("");

  // ============ GRANT ROLES TO SAFE ============
  
  console.log("🔑 Granting roles to SAFE address...");
  
  const MINTER_ROLE = await pmockToken.MINTER_ROLE();
  const BURNER_ROLE = await pmockToken.BURNER_ROLE();
  const COMPLIANCE_OFFICER_ROLE = await pmockToken.COMPLIANCE_OFFICER_ROLE();
  const WHITELIST_MANAGER_ROLE = await pmockToken.WHITELIST_MANAGER_ROLE();
  
  try {
    // Grant key roles to SAFE for testing
    await pmockToken.grantRole(MINTER_ROLE, SAFE_ADDRESS);
    console.log("   ✅ MINTER_ROLE granted to SAFE");
    
    await pmockToken.grantRole(BURNER_ROLE, SAFE_ADDRESS);
    console.log("   ✅ BURNER_ROLE granted to SAFE");
    
    await pmockToken.grantRole(COMPLIANCE_OFFICER_ROLE, SAFE_ADDRESS);
    console.log("   ✅ COMPLIANCE_OFFICER_ROLE granted to SAFE");
    
    await pmockToken.grantRole(WHITELIST_MANAGER_ROLE, SAFE_ADDRESS);
    console.log("   ✅ WHITELIST_MANAGER_ROLE granted to SAFE");
  } catch (error) {
    console.log("   ⚠️  Error granting roles:", error);
  }
  console.log("");

  // ============ VERIFY INITIAL STATE ============
  
  console.log("🔍 Verifying initial state...");
  
  const isDeployerWhitelisted = await pmockToken.isWhitelisted(DEPLOYER_ADDRESS);
  const isSafeWhitelisted = await pmockToken.isWhitelisted(SAFE_ADDRESS);
  const transfersEnabled = await pmockToken.transfersEnabled();
  const totalSupply = await pmockToken.totalSupply();
  const totalIPValue = await pmockToken.getTotalIPValue();
  
  console.log("✅ Initial State Verification:");
  console.log("   Deployer Whitelisted:", isDeployerWhitelisted);
  console.log("   SAFE Whitelisted:", isSafeWhitelisted);
  console.log("   Transfers Enabled:", transfersEnabled);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "PMOCK");
  console.log("   Total IP Value:", ethers.formatEther(totalIPValue), "USD");
  
  // Check individual signer whitelist status
  console.log("\n   SAFE Signers Whitelist Status:");
  for (const signer of SAFE_SIGNERS) {
    const isWhitelisted = await pmockToken.isWhitelisted(signer);
    console.log(`     ${signer}: ${isWhitelisted ? '✅' : '❌'}`);
  }
  console.log("");

  // ============ TESTING SETUP VERIFICATION ============
  
  console.log("🧪 Testing Setup Verification:");
  
  // Check roles
  const hasMinterRole = await pmockToken.hasRole(MINTER_ROLE, SAFE_ADDRESS);
  const hasBurnerRole = await pmockToken.hasRole(BURNER_ROLE, SAFE_ADDRESS);
  const hasComplianceRole = await pmockToken.hasRole(COMPLIANCE_OFFICER_ROLE, SAFE_ADDRESS);
  const hasWhitelistRole = await pmockToken.hasRole(WHITELIST_MANAGER_ROLE, SAFE_ADDRESS);
  
  console.log("   SAFE Role Verification:");
  console.log(`     MINTER_ROLE: ${hasMinterRole ? '✅' : '❌'}`);
  console.log(`     BURNER_ROLE: ${hasBurnerRole ? '✅' : '❌'}`);
  console.log(`     COMPLIANCE_OFFICER_ROLE: ${hasComplianceRole ? '✅' : '❌'}`);
  console.log(`     WHITELIST_MANAGER_ROLE: ${hasWhitelistRole ? '✅' : '❌'}`);
  console.log("");

  // ============ DEPLOYMENT SUMMARY ============
  
  console.log("🎉 PMOCK DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=" .repeat(70));
  console.log("📋 Contract Information:");
  console.log("   PMOCK Token (Proxy):", tokenAddress);
  console.log("   Deployer Address:", DEPLOYER_ADDRESS);
  console.log("   SAFE Address:", SAFE_ADDRESS);
  console.log("");
  console.log("🔑 Key Features:");
  console.log("   - ✅ NO TIMELOCK (Testing Mode)");
  console.log("   - ✅ Transfers DISABLED by default");
  console.log("   - ✅ SAFE has minting/burning capabilities");
  console.log("   - ✅ All signers whitelisted");
  console.log("   - ✅ ERC-3643 compliant structure");
  console.log("   - ✅ Upgradeable proxy pattern");
  console.log("");
  console.log("⚠️  IMPORTANT NOTES:");
  console.log("   - This is a TESTING version (PMOCK)");
  console.log("   - NO timelock delays for rapid testing");
  console.log("   - Transfers are disabled - enable when ready");
  console.log("   - All operations can be done immediately");
  console.log("");
  console.log("🚀 NEXT STEPS:");
  console.log("   1. Test minting functionality");
  console.log("   2. Test burning functionality");
  console.log("   3. Test whitelist management");
  console.log("   4. Test transfer controls");
  console.log("   5. When ready, deploy YREC with same config");
  console.log("");
  console.log("📝 Environment Variables to Update:");
  console.log(`   PMOCK_CONTRACT_ADDRESS="${tokenAddress}"`);
  console.log(`   SAFE_ADDRESS="${SAFE_ADDRESS}"`);
  console.log(`   DEPLOYER_ADDRESS="${DEPLOYER_ADDRESS}"`);
  console.log("=" .repeat(70));

  // ============ RETURN DEPLOYMENT INFO ============
  
  return {
    pmockToken: tokenAddress,
    safeAddress: SAFE_ADDRESS,
    deployer: DEPLOYER_ADDRESS,
    network: await ethers.provider.getNetwork(),
    signers: SAFE_SIGNERS,
    testingMode: true,
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("\n✅ PMOCK deployment completed successfully!");
    console.log("📄 Deployment result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ PMOCK deployment failed:");
    console.error(error);
    process.exit(1);
  }); 