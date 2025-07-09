# YREC Token Project

YREC token with timelock, multisig, and flexible token functionality.

## Overview

This project contains:
- **YRECToken.sol**: Main ERC20 token contract
- **YRECTokenFlexible.sol**: Flexible token implementation
- **YRECTimelock.sol**: Timelock contract for governance
- **SimpleMultisig.sol**: Multisig wallet implementation
- **PMOCKToken.sol**: Mock token for testing
- **Lock.sol**: Sample contract

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/Music-Protocol/record-yrec.git
cd record-yrec

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
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
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

# Test PMOCK token
npx hardhat test test/test-pmock.ts
```

### Test Coverage
```bash
npx hardhat coverage
```

## Deployment

### Deploy to Testnet
```bash
# Deploy YREC token
npx hardhat run scripts/deploy-yrec-mainnet.ts --network sepolia

# Deploy PMOCK token
npx hardhat run scripts/deploy-pmock.ts --network sepolia

# Deploy flexible token
npx hardhat run scripts/deploy-yrec-flexible.ts --network sepolia
```

### Deploy to Mainnet
```bash
npx hardhat run scripts/deploy-yrec-mainnet.ts --network mainnet
```

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

## Audit

### Audit Checklist
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Gas optimization review
- [ ] Security vulnerability scan
- [ ] External audit (recommended for mainnet deployment)

### Pre-Audit Steps
```bash
# Run all tests
npm test

# Check for vulnerabilities
npm audit

# Run linter
npx hardhat lint

# Generate coverage report
npx hardhat coverage
```

## Contract Verification

### Verify on Etherscan
```bash
# Verify YREC token
npx hardhat run scripts/verify.ts --network mainnet

# Verify PMOCK token
npx hardhat run scripts/verify-pmock.ts --network mainnet
```