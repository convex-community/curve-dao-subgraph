import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { getIntervalFromTimestamp, WEEK } from 'utils/time'
import { BIG_DECIMAL_1E18, BIG_DECIMAL_ONE, CRV_ADDRESS, CURVE_PLATFORM_ID } from 'const'
import { CRVToken } from '../../generated/GaugeController/CRVToken'
import { getUsdRate } from 'utils/pricing'
import { getPlatform } from './platform'
import { Emission, Gauge, GaugeType, GaugeWeight, GaugeTotalWeight, SnapshotTime } from '../../generated/schema'
import { getPool } from './pool'
import { log } from '@graphprotocol/graph-ts'
import { LiquidityGauge } from '../../generated/GaugeController/LiquidityGauge'

export function createAllSnapshots(timestamp: BigInt, block: BigInt): void {
  const thisWeek = getIntervalFromTimestamp(timestamp, WEEK)
  const platform = getPlatform()
  let snapshotTime = SnapshotTime.load(thisWeek.toString())
  if (snapshotTime) {
    return
  }
  snapshotTime = new SnapshotTime(thisWeek.toString())
  snapshotTime.platform = CURVE_PLATFORM_ID
  snapshotTime.save()
  log.warning('createAllSnapshot ids {}, length {}', [
    platform.gaugeIds.toString(),
    platform.gaugeIds.length.toString(),
  ])
  if (platform.gaugeIds.length == 0) {
    return
  }
  const previousWeek = getIntervalFromTimestamp(timestamp.minus(WEEK), WEEK)
  const crvTokenContract = CRVToken.bind(CRV_ADDRESS)
  const crvTokenMintedResult = crvTokenContract.try_mintable_in_timeframe(previousWeek, thisWeek)
  if (crvTokenMintedResult.reverted) {
    log.warning('Call to mintable_in_timeframe reverted for timestamps {}, {}', [
      previousWeek.toString(),
      thisWeek.toString(),
    ])
    return
  }
  const crvTokenMinted = crvTokenMintedResult.value
  // Can only get the price after creation of ETH-CRV SLP
  const crvPrice = block.toI32() > 10928474 ? getUsdRate(CRV_ADDRESS) : BigDecimal.zero()
  const totalWeight = GaugeTotalWeight.load(thisWeek.toString())
  for (let i = 0; i < platform.gaugeIds.length; i++) {
    const gaugeId = platform.gaugeIds[i]
    const gauge = Gauge.load(gaugeId)
    if (!gauge) {
      log.warning('Unable to load gauge {}:', [gaugeId.toString()])
      continue
    }
    const gaugeContract = LiquidityGauge.bind(Address.fromString(gaugeId))
    const gaugeKilledResult = gaugeContract.try_is_killed()
    if (!gaugeKilledResult.reverted && gaugeKilledResult.value) {
      log.info('Killed gauge: {}', [gauge.id])
      continue
    }
    let gaugeWeight = GaugeWeight.load(gauge.id + '-' + thisWeek.toString())
    // If a gauge has not received any votes during the previous week, it
    // will not have a weight entry for that week as no event was triggered
    // the weight will still be equal to that of the week before
    if (!gaugeWeight) {
      log.debug('Missing gauge weight for {} at time {}', [gauge.id, thisWeek.toString()])
      gaugeWeight = GaugeWeight.load(gauge.id + '-' + previousWeek.toString())
      // We also create an entry for that missing gauge weight
      if (gaugeWeight) {
        const missingUnvotedGaugeWeight = new GaugeWeight(gauge.id + '-' + thisWeek.toString())
        missingUnvotedGaugeWeight.weight = gaugeWeight.weight
        missingUnvotedGaugeWeight.timestamp = thisWeek
        missingUnvotedGaugeWeight.block = block
        missingUnvotedGaugeWeight.gauge = gauge.id
        missingUnvotedGaugeWeight.save()
      }
    }
    let emission = Emission.load(gauge.id + '-' + thisWeek.toString())
    if (!emission) {
      emission = new Emission(gauge.id + '-' + thisWeek.toString())
      emission.pool = Address.zero().toString()
      emission.crvAmount = BigDecimal.zero()
      emission.value = BigDecimal.zero()
    }
    emission.timestamp = thisWeek
    emission.block = block
    emission.gauge = gauge.id
    if (gaugeWeight) {
      const gaugeType = GaugeType.load(gauge.type)
      const gaugeTypeWeight = gaugeType ? gaugeType.weight.div(BIG_DECIMAL_1E18) : BIG_DECIMAL_ONE
      const total = totalWeight ? totalWeight.weight : BIG_DECIMAL_ONE
      const gaugeRelativeWeight = gaugeWeight.weight.times(gaugeTypeWeight).div(total)
      const weeklyEmissions = crvTokenMinted.toBigDecimal().times(gaugeRelativeWeight)
      emission.crvAmount = weeklyEmissions.div(BIG_DECIMAL_1E18)
      emission.value = emission.crvAmount.times(crvPrice)

      emission.pool = gauge.pool
      emission.save()
      if (
        Address.fromString(gauge.pool) == Address.zero() || // non-mainnet emissions
        block.toI32() < 12667823 // no registry before this block
      ) {
        continue
      }
      const pool = getPool(Address.fromString(gauge.pool))
      pool.save()
      gauge.pool = pool.id
      emission.pool = pool.id
      emission.save()
      gauge.save()
    }
  }
}
