import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { BIG_INT_ONE, BIG_DECIMAL_ONE } from 'const'

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BIG_DECIMAL_ONE
  for (let i = BigInt.zero(); i.lt(decimals as BigInt); i = i.plus(BIG_INT_ONE)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function exponentToBigInt(decimals: BigInt): BigInt {
  let bd = BIG_INT_ONE
  for (let i = BigInt.zero(); i.lt(decimals as BigInt); i = i.plus(BIG_INT_ONE)) {
    bd = bd.times(BigInt.fromString('10'))
  }
  return bd
}
