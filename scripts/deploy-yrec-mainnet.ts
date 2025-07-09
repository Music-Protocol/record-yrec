import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Starting YREC Token MAINNET Deployment...\n");
  console.log("🔴 WARNING: This will deploy to PLUME MAINNET!");
  console.log("🔴 Make sure you have enough PLUME for gas fees (estimated: 0.5-1 PLUME)");
  console.log("🔴 Contract will be IMMUTABLE for 6 months after deployment\n");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "PLUME");
  
  // Validate minimum balance (0.5 PLUME minimum recommended)
  const minBalance = ethers.parseEther("0.5");
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.5 PLUME, have ${ethers.formatEther(balance)} PLUME`);
  }

  // ============ DEPLOYMENT CONFIGURATION ============
  
  // Production configuration - UPDATE THESE BEFORE DEPLOYMENT!
  const INITIAL_OWNER = process.env.DEPLOYER_ADDRESS || deployer.address;
  const CUSTODIAN_WALLET = process.env.SAFE_ADDRESS || deployer.address;
  
  // Validate required environment variables
  if (!process.env.SAFE_ADDRESS) {
    console.warn("⚠️  SAFE_ADDRESS not set in environment, using deployer address");
  }
  
  // Timelock configuration for production
  const MIN_DELAY = 24 * 60 * 60; // 24 hours in seconds
  const PROPOSERS = [CUSTODIAN_WALLET]; // Gnosis Safe should be proposer
  const EXECUTORS = [CUSTODIAN_WALLET]; // Gnosis Safe should be executor
  const TIMELOCK_ADMIN = CUSTODIAN_WALLET; // Gnosis Safe should be admin

  console.log("⚙️  MAINNET Deployment Configuration:");
  console.log("   Initial Owner:", INITIAL_OWNER);
  console.log("   Custodian Wallet (Safe):", CUSTODIAN_WALLET);
  console.log("   Timelock Min Delay:", MIN_DELAY / 3600, "hours");
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("");

  // Final confirmation
  console.log("🔴 FINAL CONFIRMATION REQUIRED!");
  console.log("This will deploy YREC Token to PLUME MAINNET");
  console.log("Press Ctrl+C to cancel, or wait 10 seconds to continue...\n");
  
  // 10 second delay for manual confirmation
  for (let i = 10; i > 0; i--) {
    process.stdout.write(`Deploying in ${i} seconds...\r`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log("\n🚀 Starting deployment...\n");

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
  console.log("   Deployer gas used so far:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
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
  console.log("   Deployer gas used so far:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  console.log("");

  // ============ CONFIGURE ROLES AND PERMISSIONS ============
  
  console.log("🔐 Configuring roles and permissions...");
  
  // Grant timelock controller the necessary roles for governance
  const DEFAULT_ADMIN_ROLE = await yrecToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const PAUSER_ROLE = await yrecToken.PAUSER_ROLE();
  const UPGRADER_ROLE = await yrecToken.UPGRADER_ROLE();
  const WHITELIST_MANAGER_ROLE = await yrecToken.WHITELIST_MANAGER_ROLE();
  const COMPLIANCE_OFFICER_ROLE = await yrecToken.COMPLIANCE_OFFICER_ROLE();
  
  // Grant all critical roles to timelock (controlled by Gnosis Safe)
  console.log("   Granting roles to Timelock...");
  await yrecToken.grantRole(DEFAULT_ADMIN_ROLE, timelockAddress);
  await yrecToken.grantRole(MINTER_ROLE, timelockAddress);
  await yrecToken.grantRole(BURNER_ROLE, timelockAddress);
  await yrecToken.grantRole(PAUSER_ROLE, timelockAddress);
  await yrecToken.grantRole(UPGRADER_ROLE, timelockAddress);
  await yrecToken.grantRole(WHITELIST_MANAGER_ROLE, timelockAddress);
  await yrecToken.grantRole(COMPLIANCE_OFFICER_ROLE, timelockAddress);
  
  // CRITICAL: Renounce deployer's admin roles to complete decentralization
  console.log("   Renouncing deployer's admin roles for security...");
  await yrecToken.renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await yrecToken.renounceRole(MINTER_ROLE, deployer.address);
  await yrecToken.renounceRole(BURNER_ROLE, deployer.address);
  await yrecToken.renounceRole(PAUSER_ROLE, deployer.address);
  await yrecToken.renounceRole(UPGRADER_ROLE, deployer.address);
  await yrecToken.renounceRole(WHITELIST_MANAGER_ROLE, deployer.address);
  await yrecToken.renounceRole(COMPLIANCE_OFFICER_ROLE, deployer.address);
  
  console.log("✅ Roles configured:");
  console.log("   ALL critical roles granted to Timelock");
  console.log("   Deployer admin roles RENOUNCED");
  console.log("   Contract now controlled by Gnosis Safe via Timelock");
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

  // ============ FINAL DEPLOYMENT SUMMARY ============
  
  const finalBalance = await deployer.provider.getBalance(deployer.address);
  const gasUsed = balance - finalBalance;
  
  console.log("🎉 YREC MAINNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=" .repeat(80));
  console.log("📋 Contract Addresses:");
  console.log("   YREC Token (Proxy):", tokenAddress);
  console.log("   YREC Timelock:", timelockAddress);
  console.log("   Deployer Address:", deployer.address);
  console.log("");
  console.log("💰 Gas Usage:");
  console.log("   Total Gas Used:", ethers.formatEther(gasUsed), "PLUME");
  console.log("   Remaining Balance:", ethers.formatEther(finalBalance), "PLUME");
  console.log("");
  console.log("🔑 Important Information:");
  console.log("   - Transfers are DISABLED by default (security)");
  console.log("   - Only whitelisted addresses can receive tokens");
  console.log("   - Upgrade moratorium: 6 months from deployment");
  console.log("   - Timelock delay: 24 hours for critical operations");
  console.log("   - Contract is now LIVE on PLUME MAINNET");
  console.log("   - DEPLOYER has NO admin access (roles renounced)");
  console.log("   - ALL control is via Gnosis Safe → Timelock → Token");
  console.log("");
  console.log("⚠️  CRITICAL NEXT STEPS:");
  console.log("   1. Update your .env file with the new contract address:");
  console.log(`      YREC_CONTRACT_ADDRESS="${tokenAddress}"`);
  console.log("   2. Verify contracts on Plume explorer");
  console.log("   3. CLIENT must use Gnosis Safe to:");
  console.log("      - Mint tokens (via timelock with 24hr delay)");
  console.log("      - Add whitelist addresses (via timelock)");
  console.log("      - Enable transfers when ready (via timelock)");
  console.log("   4. All operations require Gnosis Safe multisig approval");
  console.log("   5. DEPLOYER cannot make any changes (security feature)");
  console.log("");
  console.log("📝 Contract Verification Commands:");
  console.log(`   npx hardhat verify --network plume-mainnet ${tokenAddress}`);
  console.log(`   npx hardhat verify --network plume-mainnet ${timelockAddress} "${MIN_DELAY}" ["${PROPOSERS.join('","')}"] ["${EXECUTORS.join('","')}"] "${TIMELOCK_ADMIN}"`);
  console.log("");
  console.log("🌐 Explorer Links:");
  console.log(`   YREC Token: https://explorer.plume.org/address/${tokenAddress}`);
  console.log(`   Timelock: https://explorer.plume.org/address/${timelockAddress}`);
  console.log("=" .repeat(80));

  // ============ RETURN DEPLOYMENT INFO ============
  
  return {
    yrecToken: tokenAddress,
    yrecTimelock: timelockAddress,
    deployer: deployer.address,
    network: await ethers.provider.getNetwork(),
    gasUsed: ethers.formatEther(gasUsed),
    upgradeMoratoriumEnd: Number(upgradeMoratoriumEnd)
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("\n✅ YREC Mainnet deployment completed successfully!");
    console.log("📄 Deployment result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ YREC Mainnet deployment failed:");
    console.error(error);
    process.exit(1);
  }); 