import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying YRECTokenSimple (Simplified Version)...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get environment variables
  const INITIAL_OWNER = process.env.INITIAL_OWNER || deployer.address;
  const CUSTODIAL_SAFE = process.env.CUSTODIAL_SAFE;
  
  if (!CUSTODIAL_SAFE) {
    throw new Error("CUSTODIAL_SAFE environment variable is required");
  }
  
  console.log("Initial Owner:", INITIAL_OWNER);
  console.log("Custodial Safe:", CUSTODIAL_SAFE);
  
  // Deploy YRECTokenSimple as upgradeable proxy
  const YRECTokenSimple = await ethers.getContractFactory("YRECTokenSimple");
  
  console.log("Deploying YRECTokenSimple proxy...");
  const yrecTokenProxy = await upgrades.deployProxy(
    YRECTokenSimple,
    [INITIAL_OWNER, CUSTODIAL_SAFE],
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
  
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", totalSupply);
  console.log("Custodial Safe:", custodialSafe);
  
  // Check roles
  const DEFAULT_ADMIN_ROLE = await yrecToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  
  const hasAdminRole = await yrecToken.hasRole(DEFAULT_ADMIN_ROLE, INITIAL_OWNER);
  const hasMinterRole = await yrecToken.hasRole(MINTER_ROLE, INITIAL_OWNER);
  const hasBurnerRole = await yrecToken.hasRole(BURNER_ROLE, INITIAL_OWNER);
  
  console.log("Has Admin Role:", hasAdminRole);
  console.log("Has Minter Role:", hasMinterRole);
  console.log("Has Burner Role:", hasBurnerRole);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nContract Addresses to save:");
  console.log(`YREC_PROXY_ADDRESS=${proxyAddress}`);
  console.log(`YREC_IMPLEMENTATION_ADDRESS=${implementationAddress}`);
  
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Update main application .env with new YREC_CONTRACT_ADDRESS");
  console.log("3. Test minting/burning functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 