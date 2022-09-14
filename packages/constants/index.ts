import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const CURVE_PLATFORM_ID = 'Curve'

export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')
export const BIG_INT_ONE = BigInt.fromI32(1)
export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export const DEPOSIT_FOR = 'DEPOSIT_FOR'
export const CREATE_LOCK = 'CREATE_LOCK'
export const INCREASE_LOCK_AMOUNT = 'INCREASE_LOCK_AMOUNT'
export const INCREASE_UNLOCK_TIME = 'INCREASE_UNLOCK_TIME'
export const WITHDRAW = 'WITHDRAW'

export const PARAMETER = 'PARAMETER'
export const OWNERSHIP = 'OWNERSHIP'

export const PARAMETER_VOTING_ADDRESS = Address.fromString('0xBCfF8B0b9419b9A88c44546519b1e909cF330399')
export const OWNERSHIP_VOTING_ADDRESS = Address.fromString('0xE478de485ad2fe566d49342Cbd03E49ed7DB3356')

export const VOTING_ESCROW_ADDRESS = Address.fromString('0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2')
export const CRV_TOKEN = '0xD533a949740bb3306d119CC777fa900bA034cd52'
export const CRV_ADDRESS = Address.fromString(CRV_TOKEN)

export const CURVE_REGISTRY = Address.fromString('0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5')
export const CURVE_REGISTRY_V2 = Address.fromString('0x4AacF35761d06Aa7142B9326612A42A2b9170E33')

export const V2_SWAPS = new Map<string, string>()
V2_SWAPS.set('0x3b6831c0077a1e44ed0a21841c3bc4dc11bce833', '0x9838eCcC42659FA8AA7daF2aD134b53984c9427b')
V2_SWAPS.set('0x3d229e1b4faab62f621ef2f6a610961f7bd7b23b', '0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B')

export const WETH_ADDRESS = Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
export const USDT_ADDRESS = Address.fromString('0xdac17f958d2ee523a2206206994597c13d831ec7')

export const SUSHI_FACTORY_ADDRESS = Address.fromString('0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac')
export const UNI_FACTORY_ADDRESS = Address.fromString('0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f')
export const UNI_V3_FACTORY_ADDRESS = Address.fromString('0x1F98431c8aD98523631AE4a59f267346ea31F984')
export const UNI_V3_QUOTER = Address.fromString('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6')
