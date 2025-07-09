import { run } from "hardhat";

async function main() {
  console.log("🔍 Starting contract verification...");

  // Contract addresses from deployment
  const YREC_TOKEN_ADDRESS = "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE";
  const YREC_TIMELOCK_ADDRESS = "0x4a11689D0D722353449c3ed1bC3Fcb62B4efA229";
  const DEPLOYER_ADDRESS = "0xf002BDD262b067Fd79E0BF1D101D35418811aE35";

  try {
    // Verify YREC Timelock
    console.log("📝 Verifying YREC Timelock...");
    await run("verify:verify", {
      address: YREC_TIMELOCK_ADDRESS,
      constructorArguments: [
        86400, // minDelay (24 hours)
        [DEPLOYER_ADDRESS], // proposers array
        [DEPLOYER_ADDRESS], // executors array
        DEPLOYER_ADDRESS // admin
      ],
    });
    console.log("✅ YREC Timelock verified successfully!");

  } catch (error) {
    console.log("⚠️ Timelock verification failed:", error);
  }

  try {
    // Note: Proxy contracts are harder to verify, we'll verify the implementation
    console.log("📝 Verifying YREC Token Proxy...");
    await run("verify:verify", {
      address: YREC_TOKEN_ADDRESS,
    });
    console.log("✅ YREC Token verified successfully!");

  } catch (error) {
    console.log("⚠️ Token verification failed:", error);
    console.log("💡 Note: Proxy contracts may require manual verification on the explorer");
  }

  console.log("\n🎉 Verification process completed!");
  console.log("\n📋 Contract Addresses:");
  console.log(`   YREC Token (Proxy): ${YREC_TOKEN_ADDRESS}`);
  console.log(`   YREC Timelock: ${YREC_TIMELOCK_ADDRESS}`);
  console.log("\n🔗 View on Plume Explorer:");
  console.log(`   Token: https://testnet-explorer.plume.org/address/${YREC_TOKEN_ADDRESS}`);
  console.log(`   Timelock: https://testnet-explorer.plume.org/address/${YREC_TIMELOCK_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 