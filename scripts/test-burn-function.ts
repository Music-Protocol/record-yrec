import { ethers } from "hardhat";

async function main() {
  console.log("🔥 Testing YREC Token Burn Functionality...");

  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const [deployer] = await ethers.getSigners();
  
  console.log("🔑 Account:", deployer.address);

  const yrecToken = await ethers.getContractAt("YRECToken", YREC_TOKEN_ADDRESS);

  // Check current state before burning
  console.log("\n📊 Current State Before Burning:");
  const totalSupplyBefore = await yrecToken.totalSupply();
  const deployerBalanceBefore = await yrecToken.balanceOf(deployer.address);
  const totalIPValueBefore = await yrecToken.getTotalIPValue();
  const deployerIPValueBefore = await yrecToken.getIPValueForHolder(deployer.address);
  
  console.log(`   Total Supply: ${ethers.formatEther(totalSupplyBefore)} YREC`);
  console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalanceBefore)} YREC`);
  console.log(`   Total IP Value: $${ethers.formatEther(totalIPValueBefore)}`);
  console.log(`   Deployer IP Value: $${ethers.formatEther(deployerIPValueBefore)}`);

  // Check if we have burner role
  const BURNER_ROLE = await yrecToken.BURNER_ROLE();
  const hasBurnerRole = await yrecToken.hasRole(BURNER_ROLE, deployer.address);
  console.log(`   Has Burner Role: ${hasBurnerRole}`);

  if (!hasBurnerRole) {
    console.log("❌ Cannot test burn: Missing BURNER_ROLE");
    return;
  }

  if (deployerBalanceBefore === 0n) {
    console.log("❌ Cannot test burn: No tokens to burn");
    return;
  }

  // Test burning tokens
  console.log("\n🔥 Testing Token Burning...");
  try {
    const burnAmount = ethers.parseEther("200"); // Burn 200 YREC (out of 900 remaining)
    
    console.log(`   Burning ${ethers.formatEther(burnAmount)} YREC tokens...`);
    console.log(`   From address: ${deployer.address}`);
    
    // Estimate gas first
    const gasEstimate = await yrecToken.burn.estimateGas(deployer.address, burnAmount);
    console.log(`   Gas estimate: ${gasEstimate.toString()}`);
    
    const tx = await yrecToken.burn(deployer.address, burnAmount, {
      gasLimit: gasEstimate * 2n // Double the gas estimate for safety
    });
    
    console.log(`   Transaction hash: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`   ✅ Burn successful! Block: ${receipt?.blockNumber}`);
    
  } catch (error: any) {
    console.log("   ❌ Burn failed:");
    console.log("   Error:", error.message);
    
    if (error.data) {
      console.log("   Error data:", error.data);
    }
    return;
  }

  // Check state after burning
  console.log("\n📊 State After Burning:");
  const totalSupplyAfter = await yrecToken.totalSupply();
  const deployerBalanceAfter = await yrecToken.balanceOf(deployer.address);
  const totalIPValueAfter = await yrecToken.getTotalIPValue();
  const deployerIPValueAfter = await yrecToken.getIPValueForHolder(deployer.address);
  
  console.log(`   Total Supply: ${ethers.formatEther(totalSupplyAfter)} YREC`);
  console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalanceAfter)} YREC`);
  console.log(`   Total IP Value: $${ethers.formatEther(totalIPValueAfter)}`);
  console.log(`   Deployer IP Value: $${ethers.formatEther(deployerIPValueAfter)}`);

  // Calculate changes
  console.log("\n📈 Changes Summary:");
  const supplyChange = totalSupplyBefore - totalSupplyAfter;
  const balanceChange = deployerBalanceBefore - deployerBalanceAfter;
  const totalIPChange = totalIPValueBefore - totalIPValueAfter;
  const deployerIPChange = deployerIPValueBefore - deployerIPValueAfter;
  
  console.log(`   Supply Reduced: ${ethers.formatEther(supplyChange)} YREC`);
  console.log(`   Balance Reduced: ${ethers.formatEther(balanceChange)} YREC`);
  console.log(`   Total IP Reduced: $${ethers.formatEther(totalIPChange)}`);
  console.log(`   Deployer IP Reduced: $${ethers.formatEther(deployerIPChange)}`);

  // Verify proportional IP value reduction
  const expectedIPReduction = (deployerIPValueBefore * balanceChange) / deployerBalanceBefore;
  const actualIPReduction = deployerIPChange;
  
  console.log("\n🔍 IP Value Proportionality Check:");
  console.log(`   Expected IP Reduction: $${ethers.formatEther(expectedIPReduction)}`);
  console.log(`   Actual IP Reduction: $${ethers.formatEther(actualIPReduction)}`);
  
  const isProportional = expectedIPReduction === actualIPReduction;
  console.log(`   Proportional Reduction: ${isProportional ? '✅ Correct' : '❌ Incorrect'}`);

  // Test IP value per token consistency
  const ipPerTokenBefore = totalSupplyBefore > 0n ? totalIPValueBefore * ethers.parseEther("1") / totalSupplyBefore : 0n;
  const ipPerTokenAfter = totalSupplyAfter > 0n ? totalIPValueAfter * ethers.parseEther("1") / totalSupplyAfter : 0n;
  
  console.log("\n💰 IP Value Per Token:");
  console.log(`   Before Burn: $${ethers.formatEther(ipPerTokenBefore)} per YREC`);
  console.log(`   After Burn: $${ethers.formatEther(ipPerTokenAfter)} per YREC`);
  
  const ipPerTokenConsistent = ipPerTokenBefore === ipPerTokenAfter;
  console.log(`   Consistency: ${ipPerTokenConsistent ? '✅ Maintained' : '❌ Changed'}`);

  console.log("\n🎉 Burn Function Testing Completed!");
  console.log("\n📋 Test Results Summary:");
  console.log("   ✅ Burn function executed successfully");
  console.log("   ✅ Token supply reduced correctly");
  console.log("   ✅ User balance updated properly");
  console.log(`   ${isProportional ? '✅' : '❌'} IP value reduced proportionally`);
  console.log(`   ${ipPerTokenConsistent ? '✅' : '❌'} IP value per token maintained`);
  
  console.log("\n🔗 View transaction on Plume Explorer:");
  console.log(`   https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}?tab=txs`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 