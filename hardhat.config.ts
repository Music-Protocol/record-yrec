import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun", // Required for Plume network
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    "plume-testnet": {
      url: process.env.PLUME_TESTNET_RPC || "https://testnet-rpc.plume.org",
      chainId: 98867, // Official Plume testnet chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    "plume-mainnet": {
      url: process.env.PLUME_MAINNET_RPC || "https://rpc.plume.org",
      chainId: 98866, // Updated Plume mainnet chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      "plume-testnet": process.env.ETHERSCAN_API_KEY || "test",
      "plume-mainnet": process.env.ETHERSCAN_API_KEY || "test",
    },
    customChains: [
      {
        network: "plume-testnet",
        chainId: 98867, // Updated to official chain ID
        urls: {
          apiURL: "https://testnet-explorer.plume.org/api?",
          browserURL: "https://testnet-explorer.plume.org",
        },
      },
      {
        network: "plume-mainnet",
        chainId: 98866,
        urls: {
          apiURL: "https://explorer.plume.org/api?",
          browserURL: "https://explorer.plume.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
