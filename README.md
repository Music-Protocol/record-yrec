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
- **UUPS Upgradeable**: Flexible upgrade pattern via governance
- **Role-based Control**: MINTER_ROLE and BURNER_ROLE for operations
- **Custodial Safe**: All tokens minted to designated safe wallet
- **Emergency Functions**: Pause/unpause and admin controls

### 📋 Simple Operations
- **Mint Only to Safe**: Tokens can only be minted to the custodial safe wallet
- **Burn Only from Safe**: Tokens can only be burned from the custodial safe wallet
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
- Simple ERC20 with mint/burn to custodial safe only
- Role-based access control (MINTER_ROLE, BURNER_ROLE)
- UUPS upgradeable pattern
- Pausable operations
- Non-transferable (blocks all transfers except mint/burn)
- Implementation protection
```

### Security Model
1. **Role-based Access** → MINTER_ROLE and BURNER_ROLE control
2. **Custodial Safe** → Only address that can hold tokens
3. **No Transfers** → Prevents unauthorized token movement
4. **Standard Pattern** → OpenZeppelin battle-tested implementation

### Contract Functions

#### Core Functions
- `mint(uint256 amount)` - Mints tokens to custodial safe (MINTER_ROLE)
- `burn(uint256 amount)` - Burns tokens from custodial safe (BURNER_ROLE)
- `pause()` / `unpause()` - Emergency controls (PAUSER_ROLE)

#### View Functions
- `custodialSafe()` - Returns the custodial safe address
- `totalSupply()` - Returns total token supply
- `balanceOf(address)` - Returns balance (only custodial safe will have balance)

#### Admin Functions
- `updateCustodialSafe(address)` - Updates custodial safe address (DEFAULT_ADMIN_ROLE)

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

This simplified contract is **production-ready** with:

- **Standard Implementation**: Pure OpenZeppelin patterns with minimal modifications
- **Battle-tested Security**: No custom logic that could introduce vulnerabilities
- **Simple Operations**: Just mint/burn to your custodial safe wallet
- **Clean Architecture**: Minimal attack surface and easy to audit
- **Operational Efficiency**: Designed for your custodial model
- **Upgrade Flexibility**: UUPS pattern allows future improvements

**Next Step**: Deploy to Plume mainnet using `deploy-yrec-simple.ts`