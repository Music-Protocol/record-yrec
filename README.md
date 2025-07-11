# YREC Token Project

**Production-Ready** Yield-indexed IP Rights Exposure Certificate (YREC) token with simple mint/burn functionality for custodial operations.

## Overview

This project contains the production-ready smart contract for Yield-indexed IP Rights Exposure Certificate (YREC) token:
- **YRECTokenSimple.sol**: Main ERC20 token with simple mint/burn functionality ✅ **Production Ready**
- **YRECTimelock.sol**: Governance timelock contract (6-hour delay) ✅ **Production Ready**  
- **SimpleMultisig.sol**: Basic multisig wallet for testnet fallback ✅ **Production Ready**

## Key Features

### 🛡️ Security
- **Standard OpenZeppelin Implementation**: Battle-tested ERC20 with minimal modifications
- **Role-based Access Control**: Granular permissions with OpenZeppelin AccessControl
- **Implementation Protection**: `_disableInitializers()` prevents hijacking
- **Pausable Operations**: Emergency pause functionality
- **Non-transferable**: Only mint/burn operations allowed

### 🏛️ Governance
- **6-hour Timelock**: Optimized delay for secure upgrades
- **UUPS Upgradeable**: Flexible upgrade pattern via timelock governance
- **Role-based Control**: MINTER_ROLE, BURNER_ROLE, WHITELIST_MANAGER_ROLE
- **Custodial Safe**: All tokens minted to designated safe wallet
- **Emergency Functions**: Pause/unpause and admin controls

### 📋 Compliance & Operations
- **Whitelist Management**: KYC-controlled addresses with batch operations
- **Mint Only to Safe**: Tokens can only be minted to whitelisted custodial safe wallet
- **Burn Only from Safe**: Tokens can only be burned from whitelisted custodial safe wallet
- **No Transfers**: Regular transfers between addresses are blocked
- **Clean Interface**: Simple mint(amount) and burn(amount) functions

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
CUSTODIAL_SAFE=0x_your_safe_wallet_address
INITIAL_OWNER=0x_your_owner_address
TIMELOCK_ADDRESS=0x_existing_timelock_address_optional
```

## Testing

### Run Basic Tests
```bash
# Test simple functionality
npx hardhat run scripts/test-yrec-simple.ts --network plume-testnet
```

### Compile Contracts
```bash
npx hardhat compile
```

## Deployment

### Deploy to Plume Testnet
```bash
# Deploy simple YREC token
npx hardhat run scripts/deploy-yrec-simple.ts --network plume-testnet
```

### Deploy to Plume Mainnet (Production Ready)
```bash
# Deploy YREC token to mainnet
npx hardhat run scripts/deploy-yrec-simple.ts --network plume-mainnet
```

## Production Deployment Checklist

### Pre-Deployment ✅
- [x] Standard OpenZeppelin implementation
- [x] Simple mint/burn functionality verified
- [x] Custodial safe configuration confirmed
- [x] Non-transferable functionality tested

### Post-Deployment Tasks
- [ ] Verify contracts on Plume explorer
- [ ] Test mint function with custodial safe
- [ ] Test burn function with custodial safe
- [ ] Confirm transfer restrictions work
- [ ] Update main application with contract address

## Scripts

### Token Operations
```bash
# Deploy simple contract
npx hardhat run scripts/deploy-yrec-simple.ts

# Test functionality
npx hardhat run scripts/test-yrec-simple.ts
```

## Contract Architecture

### YRECTokenSimple.sol (Production Contract)
```solidity
// Main features:
- Simple ERC20 with mint/burn to whitelisted custodial safe only
- Role-based access control (MINTER_ROLE, BURNER_ROLE, WHITELIST_MANAGER_ROLE)
- Whitelist management with batch operations (max 500 addresses)
- Timelock integration for secure upgrades (6-hour delay)
- UUPS upgradeable pattern
- Pausable operations
- Non-transferable (blocks all transfers except mint/burn)
- Implementation protection
```

### Security Model
1. **Timelock Governance** → 6-hour delay for upgrades with defense-in-depth
2. **Role-based Access** → MINTER_ROLE, BURNER_ROLE, WHITELIST_MANAGER_ROLE control
3. **Whitelist Control** → KYC compliance with batch operations
4. **Custodial Safe** → Only whitelisted address that can hold tokens
5. **No Transfers** → Prevents unauthorized token movement
6. **Standard Pattern** → OpenZeppelin battle-tested implementation

### Contract Functions

#### Core Functions
- `mint(uint256 amount)` - Mints tokens to whitelisted custodial safe (MINTER_ROLE)
- `burn(uint256 amount)` - Burns tokens from whitelisted custodial safe (BURNER_ROLE)
- `pause()` / `unpause()` - Emergency controls (PAUSER_ROLE)

#### Whitelist Functions
- `updateWhitelist(address, bool)` - Add/remove address from whitelist (WHITELIST_MANAGER_ROLE)
- `batchUpdateWhitelist(address[], bool)` - Batch whitelist update (max 500 addresses)
- `isWhitelisted(address)` - Check if address is whitelisted

#### View Functions
- `custodialSafe()` - Returns the custodial safe address
- `timelock()` - Returns the timelock contract address
- `totalSupply()` - Returns total token supply
- `balanceOf(address)` - Returns balance (only custodial safe will have balance)

#### Admin Functions
- `updateCustodialSafe(address)` - Updates custodial safe address (DEFAULT_ADMIN_ROLE)
- `updateTimelock(address)` - Updates timelock address (DEFAULT_ADMIN_ROLE)

## Contract Verification

### Verify on Plume Explorer
After deployment, verify the contract:
```bash
npx hardhat verify --network plume-mainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Usage Flow

1. **Deploy Contract**: Deploy YRECTokenSimple with initial owner and custodial safe
2. **Platform Calculations**: Your platform calculates required YREC supply based on IP portfolio
3. **Generate Transaction**: Platform generates mint/burn transaction JSON
4. **Execute via Safe**: Upload transaction JSON to Gnosis Safe and execute
5. **Supply Updated**: On-chain supply now matches platform calculations

## 🚀 Ready for Production

This governance-enhanced contract is **production-ready** with:

- **Standard Implementation**: Pure OpenZeppelin patterns with minimal modifications
- **Battle-tested Security**: No custom logic that could introduce vulnerabilities
- **Timelock Governance**: 6-hour upgrade delays with defense-in-depth security
- **Whitelist Compliance**: KYC-controlled addresses with batch operations
- **Simple Operations**: Just mint/burn to whitelisted custodial safe wallet
- **Clean Architecture**: Minimal attack surface and easy to audit
- **Operational Efficiency**: Designed for your custodial model with governance
- **Upgrade Flexibility**: UUPS pattern with timelock protection

**Next Step**: Deploy to Plume mainnet using `deploy-yrec-simple.ts`