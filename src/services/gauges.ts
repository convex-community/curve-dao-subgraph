import { GaugeType } from '../../generated/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export function registerGaugeType(id: string, name: string): GaugeType {
  const gaugeType = new GaugeType(id)
  gaugeType.name = name
  gaugeType.gaugeCount = BigInt.zero()
  gaugeType.weight = BigDecimal.zero()
  return gaugeType
}
