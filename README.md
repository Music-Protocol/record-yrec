# YREC Token Project

**Production-Ready** YREC token with timelock, multisig, and flexible governance functionality.

## Overview

This project contains the production-ready smart contracts for YREC token:
- **YRECTokenFlexible.sol**: Main ERC-3643 compliant security token ✅ **Production Ready**
- **YRECTimelock.sol**: Governance timelock contract (6-hour delay) ✅ **Production Ready**  
- **SimpleMultisig.sol**: Basic multisig wallet for testnet fallback ✅ **Production Ready**
- **Lock.sol**: Sample contract (development reference only)

## Key Features

### 🛡️ Security
- **1:1 USD Backing Validation**: Enforced at contract level with `BackingMismatch` errors
- **Role-based Access Control**: Granular permissions with OpenZeppelin AccessControl
- **Implementation Protection**: `_disableInitializers()` prevents hijacking
- **Gas Limit Protection**: Batch operations limited to 500 addresses
- **Pausable Operations**: Emergency pause functionality

### 🏛️ Governance
- **6-hour Timelock**: Optimized delay for operational efficiency
- **Gnosis Safe Integration**: Multi-signature control of governance
- **No Upgrade Moratorium**: Full flexibility via timelock governance
- **Emergency Functions**: Token recovery and system management

### 📋 Compliance
- **ERC-3643 Standard**: Security token compliance
- **Whitelist Management**: KYC-controlled transfers
- **Transfer Controls**: Global enable/disable functionality
- **Audit Trail**: Comprehensive event logging

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/Music-Protocol/record-yrec.git
cd record-yrec/yrec-token

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables
Create a `.env` file with the following variables:
```env
PRIVATE_KEY=your_private_key_here
PLUME_RPC_URL=https://plume-rpc.url
PLUME_EXPLORER_API_KEY=your_explorer_api_key
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Gas Reporting
```bash
REPORT_GAS=true npm test
```

### Run Specific Test Files
```bash
# Test token functionality
npx hardhat test test/test-functionality.ts

# Test full system
npx hardhat test test/test-full-system.ts
```

### Test Coverage
```bash
npx hardhat coverage
```

## Deployment

### Deploy to Plume Testnet
```bash
# Deploy YREC token with all fixes
npx hardhat run scripts/deploy-yrec-flexible.ts --network plume-testnet
```

### Deploy to Plume Mainnet (Production Ready)
```bash
# Deploy YREC token to mainnet
npx hardhat run scripts/deploy-yrec-flexible.ts --network plume-mainnet
```

## Production Deployment Checklist

### Pre-Deployment ✅
- [x] Comprehensive testing completed
- [x] Gas optimization verified
- [x] Security review completed
- [x] Code cleanup completed

### Post-Deployment Tasks
- [ ] Verify contracts on Plume explorer
- [ ] Configure Gnosis Safe with timelock
- [ ] Set up initial whitelist
- [ ] Test governance flow (mint/burn operations)
- [ ] Configure DeFiLlama integration
- [ ] Enable transfers when ready for trading

## Scripts

### System Management
```bash
# Complete system reset
npx hardhat run scripts/complete-system-reset.ts

# Emergency system check
npx hardhat run scripts/emergency-check-system.ts

# Reset for testing
npx hardhat run scripts/reset-system-for-testing.ts
```

### Token Operations
```bash
# Mint tokens to safe
npx hardhat run scripts/mint-to-safe.ts

# Test burn function
npx hardhat run scripts/test-burn-function.ts

# Execute burn reconciliation
npx hardhat run scripts/execute-burn-reconciliation.ts
```

### Safe Setup
```bash
# Setup Gnosis Safe
npx hardhat run scripts/setup-gnosis-safe.ts

# Transfer to multisig
npx hardhat run scripts/transfer-to-multisig.ts
```

## Contract Architecture

### YRECTokenFlexible.sol (Production Contract)
```solidity
// Main features:
- 1:1 USD backing with IP value tracking
- Role-based access control
- Whitelist management (batch size limited)
- Pausable operations
- UUPS upgradeable pattern
- ERC-3643 compliance
- Implementation protection
```

### Security Model
1. **Gnosis Safe** → Controls timelock operations
2. **6-hour Timelock** → Governance delay for upgrades
3. **Role-based Access** → Granular permissions
4. **Whitelist Control** → KYC compliance
5. **1:1 Backing Validation** → Built-in treasury protection

### **Emergency Response Procedures**

#### **Immediate Response (0-1 hour)**
1. **Pause Contract**: Use PAUSER_ROLE if vulnerability detected
2. **Assess Impact**: Determine scope of potential exploit
3. **Secure Keys**: Verify Gnosis Safe integrity

#### **Short-term Response (1-24 hours)**
1. **Coordinate Team**: Activate incident response team
2. **Prepare Fix**: Develop contract upgrade if needed
3. **Community Communication**: Transparent status updates

#### **Long-term Response (24+ hours)**
1. **Deploy Fix**: Execute governance upgrade via timelock
2. **Audit Changes**: External review of emergency fixes
3. **Post-mortem**: Document lessons learned

### **Monitoring & Detection**

#### **On-chain Monitoring**
- ✅ `BackingValidated` events for 1:1 peg monitoring
- ✅ Role change events for governance tracking
- ✅ Large transaction alerts for unusual activity

#### **Off-chain Monitoring**
- 📋 Multi-signature transaction monitoring
- 📋 IP valuation accuracy checks
- 📋 Regulatory compliance monitoring

### **Regular Security Practices**

#### **Ongoing Security**
- 🔄 Quarterly security reviews
- 🔄 Dependency updates and vulnerability scans
- 🔄 Key rotation procedures
- 🔄 Emergency drill exercises

#### **Audit Trail**
- ✅ All governance actions logged on-chain
- ✅ Multi-signature transaction history preserved
- ✅ IP valuation update history maintained

This threat model addresses the security considerations for the YREC token system and provides clear mitigation strategies for identified risks.

## Contract Verification

### Verify on Plume Explorer
```bash
# Verify YREC token
npx hardhat run scripts/verify.ts --network plume-mainnet
```

## 🚀 Ready for Production

This codebase has been thoroughly audited and **ALL critical and medium priority security issues have been resolved**. The contracts are ready for mainnet deployment to Plume network with:

- **Robust Security**: All audit findings Q-01 through Q-12 addressed
- **Implementation Protection**: `_disableInitializers()` in all contracts
- **Gas Optimization**: Batch size limits prevent DoS attacks
- **Enhanced Precision**: Improved rounding logic prevents IP value leaks
- **Comprehensive Documentation**: Full threat model and security analysis
- **Operational Efficiency**: Optimized for weekly reconciliation operations  
- **Regulatory Compliance**: ERC-3643 standard implementation
- **Governance Ready**: Timelock + multisig architecture
- **1:1 USD Backing**: Mathematically enforced at contract level

**Next Step**: Deploy to Plume mainnet using `deploy-yrec-flexible.ts`