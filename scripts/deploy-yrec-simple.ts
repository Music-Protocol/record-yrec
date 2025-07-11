import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying YRECTokenSimple with Governance...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get environment variables
  const INITIAL_OWNER = process.env.INITIAL_OWNER || deployer.address;
  const CUSTODIAL_SAFE = process.env.CUSTODIAL_SAFE;
  const EXISTING_TIMELOCK = process.env.TIMELOCK_ADDRESS;
  
  if (!CUSTODIAL_SAFE) {
    throw new Error("CUSTODIAL_SAFE environment variable is required");
  }
  
  console.log("Initial Owner:", INITIAL_OWNER);
  console.log("Custodial Safe:", CUSTODIAL_SAFE);
  
  let timelockAddress: string;
  
  // Deploy timelock if not provided
  if (EXISTING_TIMELOCK) {
    timelockAddress = EXISTING_TIMELOCK;
    console.log("Using existing Timelock:", timelockAddress);
  } else {
    console.log("\n⏰ Deploying YRECTimelock...");
    
    // Timelock configuration
    const MIN_DELAY = 6 * 60 * 60; // 6 hours in seconds
    const PROPOSERS = [INITIAL_OWNER]; // Can propose transactions
    const EXECUTORS = [INITIAL_OWNER]; // Can execute transactions
    const TIMELOCK_ADMIN = INITIAL_OWNER; // Can manage timelock
    
    const YRECTimelockFactory = await ethers.getContractFactory("YRECTimelock");
    const timelock = await YRECTimelockFactory.deploy(
      MIN_DELAY,
      PROPOSERS,
      EXECUTORS,
      TIMELOCK_ADMIN
    );
    
    await timelock.waitForDeployment();
    timelockAddress = await timelock.getAddress();
    
    console.log("✅ YRECTimelock deployed to:", timelockAddress);
    console.log("   Min Delay:", MIN_DELAY / 3600, "hours");
  }
  
  // Deploy YRECTokenSimple as upgradeable proxy
  const YRECTokenSimple = await ethers.getContractFactory("YRECTokenSimple");
  
  console.log("\n🪙 Deploying YRECTokenSimple proxy...");
  const yrecTokenProxy = await upgrades.deployProxy(
    YRECTokenSimple,
    [INITIAL_OWNER, CUSTODIAL_SAFE, timelockAddress],
    {
      initializer: "initialize",
      kind: "uups"
    }
  );
  
  await yrecTokenProxy.waitForDeployment();
  const proxyAddress = await yrecTokenProxy.getAddress();
  
  // Get properly typed contract instance
  const yrecToken = YRECTokenSimple.attach(proxyAddress) as any;
  
  console.log("✅ YRECTokenSimple deployed successfully!");
  console.log("Proxy Address:", proxyAddress);
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Implementation Address:", implementationAddress);
  
  // Verify basic functionality
  console.log("\n🔍 Verifying deployment...");
  const name = await yrecToken.name();
  const symbol = await yrecToken.symbol();
  const decimals = await yrecToken.decimals();
  const totalSupply = await yrecToken.totalSupply();
  const custodialSafe = await yrecToken.custodialSafe();
  const timelockAddr = await yrecToken.timelock();
  
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", totalSupply);
  console.log("Custodial Safe:", custodialSafe);
  console.log("Timelock Address:", timelockAddr);
  
  // Check roles
  const DEFAULT_ADMIN_ROLE = await yrecToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const WHITELIST_MANAGER_ROLE = await yrecToken.WHITELIST_MANAGER_ROLE();
  
  const hasAdminRole = await yrecToken.hasRole(DEFAULT_ADMIN_ROLE, INITIAL_OWNER);
  const hasMinterRole = await yrecToken.hasRole(MINTER_ROLE, INITIAL_OWNER);
  const hasBurnerRole = await yrecToken.hasRole(BURNER_ROLE, INITIAL_OWNER);
  const hasWhitelistRole = await yrecToken.hasRole(WHITELIST_MANAGER_ROLE, INITIAL_OWNER);
  
  console.log("Has Admin Role:", hasAdminRole);
  console.log("Has Minter Role:", hasMinterRole);
  console.log("Has Burner Role:", hasBurnerRole);
  console.log("Has Whitelist Manager Role:", hasWhitelistRole);
  
  // Check whitelist status
  const isCustodialWhitelisted = await yrecToken.isWhitelisted(custodialSafe);
  const isOwnerWhitelisted = await yrecToken.isWhitelisted(INITIAL_OWNER);
  
  console.log("Custodial Safe Whitelisted:", isCustodialWhitelisted);
  console.log("Owner Whitelisted:", isOwnerWhitelisted);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nContract Addresses to save:");
  console.log(`YREC_CONTRACT_ADDRESS=${proxyAddress}`);
  console.log(`YREC_IMPLEMENTATION_ADDRESS=${implementationAddress}`);
  console.log(`TIMELOCK_ADDRESS=${timelockAddress}`);
  
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Grant UPGRADER_ROLE to timelock contract");
  console.log("3. Update main application .env with new addresses");
  console.log("4. Test minting/burning functionality");
  console.log("5. Set up additional whitelist addresses as needed");
  
  console.log("\n🔐 Security Features:");
  console.log("✅ Timelock governance with 6-hour delay");
  console.log("✅ Whitelist management for compliance");
  console.log("✅ Role-based access control");
  console.log("✅ Non-transferable (mint/burn only)");
  console.log("✅ Implementation protection");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 