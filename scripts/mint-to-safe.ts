import { ethers } from "hardhat";

async function main() {
  console.log("🪙 Minting YREC tokens to Safe for custodial balance...");
  
  // Contract addresses
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const SAFE_ADDRESS = "0x028e4F1953B9c8eF572F439b319A536e94683022";
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer:", deployer.address);
  console.log("🏦 Safe Address:", SAFE_ADDRESS);
  
  // Connect to YREC token
  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);
  
  // Check current balances
  const currentSafeBalance = await yrecToken.balanceOf(SAFE_ADDRESS);
  const totalSupply = await yrecToken.totalSupply();
  
  console.log(`📊 Current Safe Balance: ${ethers.formatEther(currentSafeBalance)} YREC`);
  console.log(`📊 Current Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
  
  // Target amount from reconciliation
  const targetAmount = "850.55870822527"; // From the logs
  const targetAmountWei = ethers.parseEther(targetAmount);
  const currentBalanceWei = currentSafeBalance;
  
  const mintAmount = targetAmountWei - currentBalanceWei;
  
  if (mintAmount <= 0) {
    console.log("✅ Safe already has sufficient balance");
    return;
  }
  
  console.log(`🪙 Minting ${ethers.formatEther(mintAmount)} YREC to Safe...`);
  
  // Check if Safe is whitelisted
  const isWhitelisted = await yrecToken.isWhitelisted(SAFE_ADDRESS);
  console.log(`🔒 Safe whitelisted: ${isWhitelisted}`);
  
  if (!isWhitelisted) {
    console.log("🔒 Whitelisting Safe address...");
    const whitelistTx = await yrecToken.updateWhitelist(SAFE_ADDRESS, true);
    await whitelistTx.wait();
    console.log("✅ Safe whitelisted");
  }
  
  // Mint tokens to Safe
  const mintTx = await yrecToken.mint(
    SAFE_ADDRESS,
    mintAmount,
    mintAmount // IP value 1:1
  );
  
  console.log(`📋 Transaction hash: ${mintTx.hash}`);
  await mintTx.wait();
  
  // Verify final balances
  const finalSafeBalance = await yrecToken.balanceOf(SAFE_ADDRESS);
  const finalTotalSupply = await yrecToken.totalSupply();
  
  console.log(`✅ Final Safe Balance: ${ethers.formatEther(finalSafeBalance)} YREC`);
  console.log(`✅ Final Total Supply: ${ethers.formatEther(finalTotalSupply)} YREC`);
  
  console.log("🎉 Custodial balance reconciliation complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 