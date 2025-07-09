import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Starting YREC Token Deployment...\n");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // ============ DEPLOYMENT CONFIGURATION ============
  
  // TODO: Replace with actual addresses before mainnet deployment
  const INITIAL_OWNER = deployer.address; // Should be multisig in production
  const CUSTODIAN_WALLET = deployer.address; // Should be actual custodian wallet
  
  // Timelock configuration
  const MIN_DELAY = 24 * 60 * 60; // 24 hours in seconds
  const PROPOSERS = [deployer.address]; // Should be multisig addresses
  const EXECUTORS = [deployer.address]; // Should be multisig addresses
  const TIMELOCK_ADMIN = deployer.address; // Should be multisig

  console.log("⚙️  Deployment Configuration:");
  console.log("   Initial Owner:", INITIAL_OWNER);
  console.log("   Custodian Wallet:", CUSTODIAN_WALLET);
  console.log("   Timelock Min Delay:", MIN_DELAY / 3600, "hours");
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("");

  // ============ DEPLOY TIMELOCK CONTROLLER ============
  
  console.log("⏰ Deploying YREC Timelock Controller...");
  
  const YRECTimelockFactory = await ethers.getContractFactory("YRECTimelock");
  const timelock = await YRECTimelockFactory.deploy(
    MIN_DELAY,
    PROPOSERS,
    EXECUTORS,
    TIMELOCK_ADMIN
  );
  
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  
  console.log("✅ YREC Timelock deployed to:", timelockAddress);
  console.log("   Min Delay:", await timelock.getMinDelay(), "seconds");
  console.log("");

  // ============ DEPLOY YREC TOKEN (UPGRADEABLE) ============
  
  console.log("🪙 Deploying YREC Token (Upgradeable Proxy)...");
  
  const YRECTokenFactory = await ethers.getContractFactory("YRECToken");
  
  // Deploy with upgradeable proxy
  const yrecToken = await upgrades.deployProxy(
    YRECTokenFactory,
    [INITIAL_OWNER, CUSTODIAN_WALLET],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );
  
  await yrecToken.waitForDeployment();
  const tokenAddress = await yrecToken.getAddress();
  
  console.log("✅ YREC Token deployed to:", tokenAddress);
  console.log("   Token Name:", await yrecToken.name());
  console.log("   Token Symbol:", await yrecToken.symbol());
  console.log("   Decimals:", await yrecToken.decimals());
  console.log("   Version:", await yrecToken.VERSION());
  console.log("");

  // ============ CONFIGURE ROLES AND PERMISSIONS ============
  
  console.log("🔐 Configuring roles and permissions...");
  
  // Grant timelock controller the necessary roles
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const PAUSER_ROLE = await yrecToken.PAUSER_ROLE();
  const UPGRADER_ROLE = await yrecToken.UPGRADER_ROLE();
  const WHITELIST_MANAGER_ROLE = await yrecToken.WHITELIST_MANAGER_ROLE();
  const COMPLIANCE_OFFICER_ROLE = await yrecToken.COMPLIANCE_OFFICER_ROLE();
  
  // Grant roles to timelock (for governance)
  await yrecToken.grantRole(UPGRADER_ROLE, timelockAddress);
  await yrecToken.grantRole(COMPLIANCE_OFFICER_ROLE, timelockAddress);
  
  console.log("✅ Roles configured:");
  console.log("   UPGRADER_ROLE granted to Timelock");
  console.log("   COMPLIANCE_OFFICER_ROLE granted to Timelock");
  console.log("");

  // ============ VERIFY INITIAL STATE ============
  
  console.log("🔍 Verifying initial state...");
  
  const isOwnerWhitelisted = await yrecToken.isWhitelisted(INITIAL_OWNER);
  const isCustodianWhitelisted = await yrecToken.isWhitelisted(CUSTODIAN_WALLET);
  const transfersEnabled = await yrecToken.transfersEnabled();
  const totalSupply = await yrecToken.totalSupply();
  const totalIPValue = await yrecToken.getTotalIPValue();
  const upgradeMoratoriumEnd = await yrecToken.upgradeMoratoriumEnd();
  
  console.log("✅ Initial State Verification:");
  console.log("   Owner Whitelisted:", isOwnerWhitelisted);
  console.log("   Custodian Whitelisted:", isCustodianWhitelisted);
  console.log("   Transfers Enabled:", transfersEnabled);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "YREC");
  console.log("   Total IP Value:", ethers.formatEther(totalIPValue), "USD");
  console.log("   Upgrade Moratorium End:", new Date(Number(upgradeMoratoriumEnd) * 1000).toISOString());
  console.log("");

  // ============ DEPLOYMENT SUMMARY ============
  
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=" .repeat(60));
  console.log("📋 Contract Addresses:");
  console.log("   YREC Token (Proxy):", tokenAddress);
  console.log("   YREC Timelock:", timelockAddress);
  console.log("");
  console.log("🔑 Important Information:");
  console.log("   - Transfers are DISABLED by default");
  console.log("   - Only whitelisted addresses can receive tokens");
  console.log("   - Upgrade moratorium: 6 months from deployment");
  console.log("   - Timelock delay: 24 hours for critical operations");
  console.log("");
  console.log("⚠️  NEXT STEPS:");
  console.log("   1. Verify contracts on block explorer");
  console.log("   2. Set up multisig wallet");
  console.log("   3. Transfer ownership to multisig");
  console.log("   4. Configure additional whitelisted addresses");
  console.log("   5. Test minting functionality");
  console.log("   6. Enable transfers when ready");
  console.log("");
  console.log("📝 Save these addresses for verification:");
  console.log(`   export YREC_TOKEN_ADDRESS="${tokenAddress}"`);
  console.log(`   export YREC_TIMELOCK_ADDRESS="${timelockAddress}"`);
  console.log("=" .repeat(60));

  // ============ RETURN DEPLOYMENT INFO ============
  
  return {
    yrecToken: tokenAddress,
    yrecTimelock: timelockAddress,
    deployer: deployer.address,
    network: await ethers.provider.getNetwork(),
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("\n✅ Deployment completed successfully!");
    console.log("📄 Deployment result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }); 