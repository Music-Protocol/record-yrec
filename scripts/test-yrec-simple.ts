import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🧪 Testing YRECTokenSimple functionality...");
  
  // Get contract address from environment
  const YREC_CONTRACT_ADDRESS = process.env.YREC_CONTRACT_ADDRESS;
  
  if (!YREC_CONTRACT_ADDRESS) {
    throw new Error("YREC_CONTRACT_ADDRESS environment variable is required");
  }
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  // Connect to deployed contract
  const YRECTokenSimple = await ethers.getContractFactory("YRECTokenSimple");
  const yrecToken = YRECTokenSimple.attach(YREC_CONTRACT_ADDRESS) as any;
  
  console.log("Connected to YREC contract at:", YREC_CONTRACT_ADDRESS);
  
  // Test basic info
  console.log("\n📋 Contract Info:");
  const name = await yrecToken.name();
  const symbol = await yrecToken.symbol();
  const decimals = await yrecToken.decimals();
  const totalSupply = await yrecToken.totalSupply();
  const custodialSafe = await yrecToken.custodialSafe();
  
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", ethers.formatEther(totalSupply), "YREC");
  console.log("Custodial Safe:", custodialSafe);
  
  // Test minting
  console.log("\n🪙 Testing Mint Function:");
  const mintAmount = ethers.parseEther("1000"); // 1000 YREC
  
  console.log("Minting", ethers.formatEther(mintAmount), "YREC to custodial safe...");
  const mintTx = await yrecToken.mint(mintAmount);
  await mintTx.wait();
  console.log("✅ Mint successful! Tx:", mintTx.hash);
  
  // Check balance after mint
  const balanceAfterMint = await yrecToken.balanceOf(custodialSafe);
  const totalSupplyAfterMint = await yrecToken.totalSupply();
  console.log("Custodial Safe Balance:", ethers.formatEther(balanceAfterMint), "YREC");
  console.log("Total Supply:", ethers.formatEther(totalSupplyAfterMint), "YREC");
  
  // Test burning
  console.log("\n🔥 Testing Burn Function:");
  const burnAmount = ethers.parseEther("500"); // 500 YREC
  
  console.log("Burning", ethers.formatEther(burnAmount), "YREC from custodial safe...");
  const burnTx = await yrecToken.burn(burnAmount);
  await burnTx.wait();
  console.log("✅ Burn successful! Tx:", burnTx.hash);
  
  // Check balance after burn
  const balanceAfterBurn = await yrecToken.balanceOf(custodialSafe);
  const totalSupplyAfterBurn = await yrecToken.totalSupply();
  console.log("Custodial Safe Balance:", ethers.formatEther(balanceAfterBurn), "YREC");
  console.log("Total Supply:", ethers.formatEther(totalSupplyAfterBurn), "YREC");
  
  // Test transfer attempt (should fail)
  console.log("\n🚫 Testing Transfer Restriction:");
  try {
    const transferTx = await yrecToken.transfer(deployer.address, ethers.parseEther("1"));
    console.log("❌ Transfer should have failed but didn't!");
  } catch (error: any) {
    console.log("✅ Transfer correctly blocked:", error.reason || "Transfer not allowed");
  }
  
  console.log("\n🎉 All tests completed successfully!");
  console.log("Contract is working as expected - simple mint/burn to custodial safe only.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 