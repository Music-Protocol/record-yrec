import { ethers } from "ethers";

// ============ CONFIGURATION ============

const PLUME_TESTNET_CONFIG = {
  rpc: "https://testnet-rpc.plume.org",
  chainId: 98867,
  explorer: "https://testnet-explorer.plume.org"
};

const CONTRACT_ADDRESSES = {
  YREC_TOKEN: "0x9b88F393928c7B5C6434bDDc7f6649a1a0e02FaE",
  YREC_TIMELOCK: "0x4a11689D0D722353449c3ed1bC3Fcb62B4efA229",
  MULTISIG: "" // Will be set after deployment
};

// ============ YREC TOKEN ABI (ESSENTIAL EVENTS) ============

const YREC_TOKEN_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event IPValueUpdated(uint256 newTotalValue, uint256 timestamp)",
  "event WhitelistUpdated(address indexed account, bool whitelisted)",
  "event TransfersToggled(bool enabled)",
  "event ComplianceViolation(address indexed from, address indexed to, string reason)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  
  // View functions
  "function totalSupply() view returns (uint256)",
  "function getTotalIPValue() view returns (uint256)",
  "function getIPValuePerToken() view returns (uint256)",
  "function isWhitelisted(address account) view returns (bool)",
  "function transfersEnabled() view returns (bool)",
  "function paused() view returns (bool)"
];

// ============ SIMPLE MULTISIG ABI ============

const SIMPLE_MULTISIG_ABI = [
  "event TransactionSubmitted(uint256 indexed transactionId, address indexed to, uint256 value, bytes data)",
  "event TransactionConfirmed(uint256 indexed transactionId, address indexed owner)",
  "event TransactionExecuted(uint256 indexed transactionId)",
  "event OwnerAdded(address indexed owner)",
  "event OwnerRemoved(address indexed owner)",
  "event ThresholdChanged(uint256 threshold)",
  
  // View functions
  "function getOwners() view returns (address[])",
  "function threshold() view returns (uint256)",
  "function getOwnerCount() view returns (uint256)",
  "function transactionCount() view returns (uint256)"
];

// ============ TIMELOCK ABI ============

const TIMELOCK_ABI = [
  "event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)",
  "event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data)",
  "event Cancelled(bytes32 indexed id)",
  "event MinDelayChange(uint256 oldDuration, uint256 newDuration)",
  
  // View functions
  "function getMinDelay() view returns (uint256)",
  "function isOperation(bytes32 id) view returns (bool)",
  "function isOperationPending(bytes32 id) view returns (bool)",
  "function isOperationReady(bytes32 id) view returns (bool)",
  "function isOperationDone(bytes32 id) view returns (bool)"
];

// ============ EVENT MONITOR CLASS ============

export class YRECEventMonitor {
  private provider: ethers.JsonRpcProvider;
  private yrecToken: ethers.Contract;
  private timelock: ethers.Contract;
  private multisig?: ethers.Contract;
  private isMonitoring: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(PLUME_TESTNET_CONFIG.rpc);
    this.yrecToken = new ethers.Contract(CONTRACT_ADDRESSES.YREC_TOKEN, YREC_TOKEN_ABI, this.provider);
    this.timelock = new ethers.Contract(CONTRACT_ADDRESSES.YREC_TIMELOCK, TIMELOCK_ABI, this.provider);
  }

  // ============ SETUP METHODS ============

  setMultisigAddress(address: string) {
    CONTRACT_ADDRESSES.MULTISIG = address;
    this.multisig = new ethers.Contract(address, SIMPLE_MULTISIG_ABI, this.provider);
    console.log(`🔗 Multisig contract connected: ${address}`);
  }

  async initialize() {
    console.log("🚀 Initializing YREC Event Monitor...\n");
    
    try {
      // Verify connections
      const network = await this.provider.getNetwork();
      console.log(`📡 Connected to: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Check contract states
      await this.displayCurrentState();
      
      console.log("✅ Monitor initialized successfully!\n");
      
    } catch (error) {
      console.error("❌ Initialization failed:", error);
      throw error;
    }
  }

  async displayCurrentState() {
    console.log("📊 Current System State:");
    
    try {
      // YREC Token State
      const totalSupply = await this.yrecToken.totalSupply();
      const totalIPValue = await this.yrecToken.getTotalIPValue();
      const ipPerToken = await this.yrecToken.getIPValuePerToken();
      const transfersEnabled = await this.yrecToken.transfersEnabled();
      const paused = await this.yrecToken.paused();
      
      console.log(`   💰 Total Supply: ${ethers.formatEther(totalSupply)} YREC`);
      console.log(`   🏢 Total IP Value: $${ethers.formatEther(totalIPValue)}`);
      console.log(`   📈 IP Value per Token: $${ethers.formatEther(ipPerToken)}`);
      console.log(`   🔄 Transfers Enabled: ${transfersEnabled}`);
      console.log(`   ⏸️  Paused: ${paused}`);
      
      // Timelock State
      const minDelay = await this.timelock.getMinDelay();
      console.log(`   ⏰ Timelock Min Delay: ${minDelay / 3600} hours`);
      
      // Multisig State (if available)
      if (this.multisig) {
        const owners = await this.multisig.getOwners();
        const threshold = await this.multisig.threshold();
        const txCount = await this.multisig.transactionCount();
        
        console.log(`   👥 Multisig Owners: ${owners.length}`);
        console.log(`   📝 Multisig Threshold: ${threshold}`);
        console.log(`   📋 Total Transactions: ${txCount}`);
      }
      
      console.log("");
      
    } catch (error) {
      console.error("⚠️ Error reading contract state:", error);
    }
  }

  // ============ MONITORING METHODS ============

  startMonitoring() {
    if (this.isMonitoring) {
      console.log("⚠️ Monitor is already running");
      return;
    }

    console.log("🎧 Starting event monitoring...\n");
    this.isMonitoring = true;

    // Monitor YREC Token events
    this.monitorYRECTokenEvents();
    
    // Monitor Timelock events
    this.monitorTimelockEvents();
    
    // Monitor Multisig events (if available)
    if (this.multisig) {
      this.monitorMultisigEvents();
    }

    console.log("✅ All event listeners active!\n");
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log("⚠️ Monitor is not running");
      return;
    }

    console.log("🛑 Stopping event monitoring...");
    this.isMonitoring = false;

    // Remove all listeners
    this.yrecToken.removeAllListeners();
    this.timelock.removeAllListeners();
    if (this.multisig) {
      this.multisig.removeAllListeners();
    }

    console.log("✅ Event monitoring stopped");
  }

  // ============ YREC TOKEN EVENT HANDLERS ============

  private monitorYRECTokenEvents() {
    console.log("🪙 Monitoring YREC Token events...");

    // Transfer events
    this.yrecToken.on("Transfer", (from, to, value, event) => {
      const amount = ethers.formatEther(value);
      if (from === ethers.ZeroAddress) {
        console.log(`🟢 MINT: ${amount} YREC → ${this.formatAddress(to)}`);
      } else if (to === ethers.ZeroAddress) {
        console.log(`🔴 BURN: ${amount} YREC from ${this.formatAddress(from)}`);
      } else {
        console.log(`🔄 TRANSFER: ${amount} YREC | ${this.formatAddress(from)} → ${this.formatAddress(to)}`);
      }
      this.logEventDetails(event);
    });

    // IP Value updates
    this.yrecToken.on("IPValueUpdated", (newTotalValue, timestamp, event) => {
      const value = ethers.formatEther(newTotalValue);
      const date = new Date(Number(timestamp) * 1000);
      console.log(`📈 IP VALUE UPDATED: $${value} at ${date.toISOString()}`);
      this.logEventDetails(event);
    });

    // Whitelist changes
    this.yrecToken.on("WhitelistUpdated", (account, whitelisted, event) => {
      const status = whitelisted ? "ADDED" : "REMOVED";
      const emoji = whitelisted ? "✅" : "❌";
      console.log(`${emoji} WHITELIST ${status}: ${this.formatAddress(account)}`);
      this.logEventDetails(event);
    });

    // Transfer toggle
    this.yrecToken.on("TransfersToggled", (enabled, event) => {
      const status = enabled ? "ENABLED" : "DISABLED";
      const emoji = enabled ? "🟢" : "🔴";
      console.log(`${emoji} TRANSFERS ${status}`);
      this.logEventDetails(event);
    });

    // Compliance violations
    this.yrecToken.on("ComplianceViolation", (from, to, reason, event) => {
      console.log(`🚨 COMPLIANCE VIOLATION: ${this.formatAddress(from)} → ${this.formatAddress(to)}`);
      console.log(`   Reason: ${reason}`);
      this.logEventDetails(event, "🚨 ALERT");
    });

    // Role changes
    this.yrecToken.on("RoleGranted", (role, account, sender, event) => {
      console.log(`🔑 ROLE GRANTED: ${this.formatRole(role)} to ${this.formatAddress(account)}`);
      console.log(`   Granted by: ${this.formatAddress(sender)}`);
      this.logEventDetails(event);
    });

    this.yrecToken.on("RoleRevoked", (role, account, sender, event) => {
      console.log(`🔓 ROLE REVOKED: ${this.formatRole(role)} from ${this.formatAddress(account)}`);
      console.log(`   Revoked by: ${this.formatAddress(sender)}`);
      this.logEventDetails(event);
    });

    // Pause events
    this.yrecToken.on("Paused", (account, event) => {
      console.log(`⏸️ CONTRACT PAUSED by ${this.formatAddress(account)}`);
      this.logEventDetails(event, "⚠️ ALERT");
    });

    this.yrecToken.on("Unpaused", (account, event) => {
      console.log(`▶️ CONTRACT UNPAUSED by ${this.formatAddress(account)}`);
      this.logEventDetails(event);
    });
  }

  // ============ TIMELOCK EVENT HANDLERS ============

  private monitorTimelockEvents() {
    console.log("⏰ Monitoring Timelock events...");

    this.timelock.on("CallScheduled", (id, index, target, value, data, predecessor, delay, event) => {
      console.log(`📅 TIMELOCK SCHEDULED: ${id}`);
      console.log(`   Target: ${this.formatAddress(target)}`);
      console.log(`   Value: ${ethers.formatEther(value)} ETH`);
      console.log(`   Delay: ${delay / 3600} hours`);
      this.logEventDetails(event);
    });

    this.timelock.on("CallExecuted", (id, index, target, value, data, event) => {
      console.log(`✅ TIMELOCK EXECUTED: ${id}`);
      console.log(`   Target: ${this.formatAddress(target)}`);
      console.log(`   Value: ${ethers.formatEther(value)} ETH`);
      this.logEventDetails(event);
    });

    this.timelock.on("Cancelled", (id, event) => {
      console.log(`❌ TIMELOCK CANCELLED: ${id}`);
      this.logEventDetails(event);
    });
  }

  // ============ MULTISIG EVENT HANDLERS ============

  private monitorMultisigEvents() {
    if (!this.multisig) return;
    
    console.log("👥 Monitoring Multisig events...");

    this.multisig.on("TransactionSubmitted", (transactionId, to, value, data, event) => {
      console.log(`📝 MULTISIG PROPOSAL: Transaction #${transactionId}`);
      console.log(`   To: ${this.formatAddress(to)}`);
      console.log(`   Value: ${ethers.formatEther(value)} ETH`);
      this.logEventDetails(event);
    });

    this.multisig.on("TransactionConfirmed", (transactionId, owner, event) => {
      console.log(`✅ MULTISIG CONFIRMATION: Transaction #${transactionId}`);
      console.log(`   Confirmed by: ${this.formatAddress(owner)}`);
      this.logEventDetails(event);
    });

    this.multisig.on("TransactionExecuted", (transactionId, event) => {
      console.log(`🚀 MULTISIG EXECUTED: Transaction #${transactionId}`);
      this.logEventDetails(event);
    });

    this.multisig.on("OwnerAdded", (owner, event) => {
      console.log(`👤 MULTISIG OWNER ADDED: ${this.formatAddress(owner)}`);
      this.logEventDetails(event);
    });

    this.multisig.on("OwnerRemoved", (owner, event) => {
      console.log(`👤 MULTISIG OWNER REMOVED: ${this.formatAddress(owner)}`);
      this.logEventDetails(event);
    });

    this.multisig.on("ThresholdChanged", (threshold, event) => {
      console.log(`📊 MULTISIG THRESHOLD CHANGED: ${threshold}`);
      this.logEventDetails(event);
    });
  }

  // ============ UTILITY METHODS ============

  private formatAddress(address: string): string {
    if (address === ethers.ZeroAddress) return "0x0 (ZERO)";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  private formatRole(roleHash: string): string {
    const roles: { [key: string]: string } = {
      "0x0000000000000000000000000000000000000000000000000000000000000000": "DEFAULT_ADMIN",
      "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6": "MINTER",
      "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848": "BURNER",
      "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a": "PAUSER",
      "0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3": "UPGRADER",
      "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357": "WHITELIST_MANAGER",
      "0x68e79a7bf1e0bc45d0a330c573bc367f9cf464fd326078812f301165fbda4ef1": "COMPLIANCE_OFFICER"
    };
    
    return roles[roleHash] || `UNKNOWN_ROLE(${roleHash.slice(0, 10)}...)`;
  }

  private logEventDetails(event: any, prefix: string = "📋 Event") {
    console.log(`   ${prefix} Details:`);
    console.log(`   └─ Block: ${event.blockNumber} | Tx: ${event.transactionHash.slice(0, 10)}...`);
    console.log(`   └─ Explorer: ${PLUME_TESTNET_CONFIG.explorer}/tx/${event.transactionHash}`);
    console.log("");
  }

  // ============ ALERT SYSTEM ============

  private async checkAlerts() {
    // This would integrate with external alerting systems
    // For now, we'll just log to console
    
    try {
      const paused = await this.yrecToken.paused();
      if (paused) {
        console.log("🚨 ALERT: Contract is paused!");
      }

      const transfersEnabled = await this.yrecToken.transfersEnabled();
      if (!transfersEnabled) {
        console.log("⚠️ NOTICE: Transfers are disabled");
      }

      // Add more alert conditions as needed
      
    } catch (error) {
      console.error("❌ Error checking alerts:", error);
    }
  }

  // ============ REPORTING METHODS ============

  async generateReport() {
    console.log("📊 Generating system report...\n");
    
    const report = {
      timestamp: new Date().toISOString(),
      network: "Plume Testnet",
      contracts: CONTRACT_ADDRESSES,
      systemState: await this.getCurrentState()
    };

    console.log("📋 System Report:");
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }

  private async getCurrentState() {
    try {
      return {
        tokenSupply: await this.yrecToken.totalSupply(),
        totalIPValue: await this.yrecToken.getTotalIPValue(),
        transfersEnabled: await this.yrecToken.transfersEnabled(),
        paused: await this.yrecToken.paused(),
        timelockMinDelay: await this.timelock.getMinDelay(),
        multisigOwners: this.multisig ? await this.multisig.getOwners() : [],
        multisigThreshold: this.multisig ? await this.multisig.threshold() : 0
      };
    } catch (error) {
      console.error("Error getting current state:", error);
      return {};
    }
  }
}

// ============ MAIN EXECUTION ============

async function main() {
  const monitor = new YRECEventMonitor();
  
  try {
    await monitor.initialize();
    
    // If multisig address is provided, connect to it
    const multisigAddress = process.env.MULTISIG_ADDRESS;
    if (multisigAddress) {
      monitor.setMultisigAddress(multisigAddress);
    }
    
    // Start monitoring
    monitor.startMonitoring();
    
    // Generate initial report
    await monitor.generateReport();
    
    // Keep the process running
    console.log("🎧 Event monitor is running... (Press Ctrl+C to stop)");
    
    process.on('SIGINT', () => {
      console.log("\n👋 Stopping monitor...");
      monitor.stopMonitoring();
      process.exit(0);
    });
    
    // Keep alive
    setInterval(async () => {
      await monitor.displayCurrentState();
    }, 300000); // Update every 5 minutes
    
  } catch (error) {
    console.error("❌ Monitor failed:", error);
    process.exit(1);
  }
}

// Export for use in other modules
export default main;

// Run directly if this is the main module
if (require.main === module) {
  main();
} 