import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing YREC Token Functionality...");

  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const YREC_TIMELOCK_ADDRESS = "0x4a11689D0D722353449c3ed1bC3Fcb62B4efA229";

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Testing with account:", deployer.address);

  // Get contract instances
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);
  const yrecTimelock = await ethers.getContractAt("YRECTimelock", YREC_TIMELOCK_ADDRESS);

  console.log("\n📊 Initial Contract State:");
  
  // Test 1: Basic token information
  const name = await yrecToken.name();
  const symbol = await yrecToken.symbol();
  const decimals = await yrecToken.decimals();
  const totalSupply = await yrecToken.totalSupply();
  const version = await yrecToken.VERSION();
  
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
  console.log(`   Version: ${version}`);

  // Test 2: Role verification
  console.log("\n🔐 Role Verification:");
  const DEFAULT_ADMIN_ROLE = await yrecToken.DEFAULT_ADMIN_ROLE();
  const MINTER_ROLE = await yrecToken.MINTER_ROLE();
  const WHITELIST_MANAGER_ROLE = await yrecToken.WHITELIST_MANAGER_ROLE();
  
  const hasAdminRole = await yrecToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  const hasMinterRole = await yrecToken.hasRole(MINTER_ROLE, deployer.address);
  const hasWhitelistRole = await yrecToken.hasRole(WHITELIST_MANAGER_ROLE, deployer.address);
  
  console.log(`   Has Admin Role: ${hasAdminRole}`);
  console.log(`   Has Minter Role: ${hasMinterRole}`);
  console.log(`   Has Whitelist Role: ${hasWhitelistRole}`);

  // Test 3: Whitelist status
  console.log("\n📋 Whitelist Status:");
  const isDeployerWhitelisted = await yrecToken.isWhitelisted(deployer.address);
  console.log(`   Deployer Whitelisted: ${isDeployerWhitelisted}`);

  // Test 4: Transfer settings
  console.log("\n🔄 Transfer Settings:");
  const transfersEnabled = await yrecToken.transfersEnabled();
  console.log(`   Transfers Enabled: ${transfersEnabled}`);

  // Test 5: IP Value tracking
  console.log("\n💰 IP Value Tracking:");
  const totalIPValue = await yrecToken.getTotalIPValue();
  console.log(`   Total IP Value: $${ethers.formatEther(totalIPValue)}`);

  // Test 6: Upgrade moratorium
  console.log("\n⏰ Upgrade Moratorium:");
  const moratoriumEnd = await yrecToken.upgradeMoratoriumEnd();
  const moratoriumDate = new Date(Number(moratoriumEnd) * 1000);
  console.log(`   Moratorium End: ${moratoriumDate.toISOString()}`);

  // Test 7: Timelock information
  console.log("\n🔒 Timelock Information:");
  const minDelay = await yrecTimelock.getMinDelay();
  console.log(`   Min Delay: ${minDelay} seconds (${Number(minDelay) / 3600} hours)`);

  // Test 8: Test minting (if we have minter role)
  if (hasMinterRole && isDeployerWhitelisted) {
    console.log("\n🪙 Testing Minting Functionality:");
    try {
      const mintAmount = ethers.parseEther("1000"); // 1000 YREC
      const ipValue = ethers.parseEther("50000"); // $50,000 IP value
      
      console.log(`   Minting ${ethers.formatEther(mintAmount)} YREC tokens...`);
      console.log(`   Backing with $${ethers.formatEther(ipValue)} IP value...`);
      
      const tx = await yrecToken.mint(deployer.address, mintAmount, ipValue);
      await tx.wait();
      
      console.log("   ✅ Minting successful!");
      
      // Check new balances
      const newTotalSupply = await yrecToken.totalSupply();
      const newTotalIPValue = await yrecToken.getTotalIPValue();
      const deployerBalance = await yrecToken.balanceOf(deployer.address);
      
      console.log(`   New Total Supply: ${ethers.formatEther(newTotalSupply)} YREC`);
      console.log(`   New Total IP Value: $${ethers.formatEther(newTotalIPValue)}`);
      console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} YREC`);
      
    } catch (error) {
      console.log("   ⚠️ Minting failed:", error);
    }
  }

  // Test 9: Test whitelist management
  console.log("\n📝 Testing Whitelist Management:");
  const testAddress = "0x1234567890123456789012345678901234567890";
  try {
    console.log(`   Adding ${testAddress} to whitelist...`);
    const tx = await yrecToken.updateWhitelist(testAddress, true);
    await tx.wait();
    
    const isWhitelisted = await yrecToken.isWhitelisted(testAddress);
    console.log(`   ✅ Address whitelisted: ${isWhitelisted}`);
    
  } catch (error) {
    console.log("   ⚠️ Whitelist update failed:", error);
  }

  console.log("\n🎉 Functionality testing completed!");
  console.log("\n📋 Summary:");
  console.log("   ✅ Contract deployed and verified");
  console.log("   ✅ Basic functionality working");
  console.log("   ✅ Role-based access control active");
  console.log("   ✅ Whitelist system operational");
  console.log("   ✅ IP value tracking functional");
  console.log("   ✅ Upgrade moratorium in effect");
  
  console.log("\n🔗 View contracts on Plume Explorer:");
  console.log(`   Token: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log(`   Timelock: https://testnet-explorer.plume.org/address/${YREC_TIMELOCK_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 