// Taken and adapted from the Curve subgraph
// https://github.com/curvefi/curve-subgraph/blob/main/src/mappings/dao/gauge-controller.ts

import { getIntervalFromTimestamp, WEEK } from 'utils/time'
import {
  Gauge,
  GaugeDeposit,
  GaugeLiquidity,
  GaugeTotalWeight,
  GaugeType,
  GaugeWeight,
  GaugeWeightVote,
  GaugeWithdraw,
} from '../generated/schema'
import {
  AddType,
  GaugeController,
  NewGauge,
  NewGaugeWeight,
  NewTypeWeight,
  VoteForGauge,
} from '../generated/GaugeController/GaugeController'
import { BIG_DECIMAL_1E18, BIG_INT_ONE } from 'const'
import { LiquidityGauge } from '../generated/GaugeController/LiquidityGauge'
import { getPlatform } from './services/platform'
import { createAllSnapshots } from './services/snapshot'
import { LiquidityGaugeTemplate } from '../generated/templates'
import { Deposit, UpdateLiquidityLimit, Withdraw } from '../generated/templates/LiquidityGaugeTemplate/LiquidityGauge'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import { registerGaugeType } from './services/gauges'

export function handleAddType(event: AddType): void {
  const gaugeController = GaugeController.bind(event.address)

  const nextWeek = getIntervalFromTimestamp(event.block.timestamp.plus(WEEK), WEEK)

  // Add gauge type
  const gaugeType = registerGaugeType(event.params.type_id.toString(), event.params.name)
  gaugeType.weight = gaugeController.points_type_weight(event.params.type_id, nextWeek).toBigDecimal()
  gaugeType.save()

  // Save total weight
  const totalWeight = new GaugeTotalWeight(nextWeek.toString())
  totalWeight.timestamp = nextWeek
  totalWeight.block = event.block.number
  totalWeight.weight = gaugeController.points_total(nextWeek).toBigDecimal().div(BIG_DECIMAL_1E18)
  totalWeight.save()
}

export function handleNewGauge(event: NewGauge): void {
  const gaugeController = GaugeController.bind(event.address)
  const platform = getPlatform()

  const nextWeek = getIntervalFromTimestamp(event.block.timestamp.plus(WEEK), WEEK)
  // Get or register gauge type
  let gaugeType = GaugeType.load(event.params.gauge_type.toString())

  if (!gaugeType) {
    gaugeType = registerGaugeType(
      event.params.gauge_type.toString(),
      gaugeController.gauge_type_names(event.params.gauge_type)
    )
  }

  gaugeType.gaugeCount = gaugeType.gaugeCount.plus(BIG_INT_ONE)
  gaugeType.save()

  // Add gauge instance
  const gauge = new Gauge(event.params.addr.toHexString())
  gauge.address = event.params.addr
  gauge.type = gaugeType.id
  gauge.isKilled = false
  gauge.platform = platform.id
  const gaugeIds = platform.gaugeIds
  gaugeIds.push(event.params.addr.toHexString())
  platform.gaugeIds = gaugeIds

  gauge.created = event.block.timestamp
  gauge.block = event.block.number
  gauge.tx = event.transaction.hash

  // Associate gauge to an LP token
  const gaugeContract = LiquidityGauge.bind(event.params.addr)
  const lpToken = gaugeContract.try_lp_token()

  if (!lpToken.reverted) {
    gauge.pool = lpToken.value.toHexString()
  } else {
    gauge.pool = Address.zero().toHexString()
  }

  const nameResult = gaugeContract.try_name()
  gauge.name = nameResult.reverted ? '' : nameResult.value

  platform.save()
  gauge.save()

  // Save gauge weight
  const gaugeWeight = new GaugeWeight(gauge.id + '-' + nextWeek.toString())
  gaugeWeight.gauge = gauge.id
  gaugeWeight.timestamp = nextWeek
  gaugeWeight.block = event.block.number
  gaugeWeight.weight = event.params.weight.toBigDecimal()
  gaugeWeight.save()

  // Save total weight
  const totalWeight = new GaugeTotalWeight(nextWeek.toString())
  totalWeight.timestamp = nextWeek
  totalWeight.block = event.block.number
  totalWeight.weight = gaugeController.points_total(nextWeek).toBigDecimal().div(BIG_DECIMAL_1E18)
  totalWeight.save()

  LiquidityGaugeTemplate.create(event.params.addr)
}

function _updateGaugeWeights(
  gaugeAddress: Address,
  controllerAddress: Address,
  isNew: boolean,
  weight: BigInt,
  block: BigInt,
  timestamp: BigInt
): void {
  const gauge = Gauge.load(gaugeAddress.toHexString())

  if (gauge != null) {
    const gaugeController = GaugeController.bind(controllerAddress)

    const nextWeek = getIntervalFromTimestamp(timestamp.plus(WEEK), WEEK)

    // Save gauge weight
    const gaugeWeight = new GaugeWeight(gauge.id + '-' + nextWeek.toString())
    gaugeWeight.gauge = gauge.id
    gaugeWeight.timestamp = nextWeek
    gaugeWeight.block = block
    gaugeWeight.weight = isNew
      ? weight.toBigDecimal()
      : gaugeController.points_weight(gaugeAddress, nextWeek).value0.toBigDecimal()
    gaugeWeight.save()

    // Save total weight
    const totalWeight = new GaugeTotalWeight(nextWeek.toString())
    totalWeight.timestamp = nextWeek
    totalWeight.block = block
    totalWeight.weight = gaugeController.points_total(nextWeek).toBigDecimal().div(BIG_DECIMAL_1E18)
    totalWeight.save()

    createAllSnapshots(timestamp, block)
  }
}

export function handleNewGaugeWeight(event: NewGaugeWeight): void {
  _updateGaugeWeights(
    event.params.gauge_address,
    event.address,
    true,
    event.params.weight,
    event.block.number,
    event.block.timestamp
  )
}

export function handleNewTypeWeight(event: NewTypeWeight): void {
  const gaugeType = GaugeType.load(event.params.type_id.toString())

  if (gaugeType != null) {
    gaugeType.weight = event.params.weight.toBigDecimal()
    gaugeType.save()

    const totalWeight = new GaugeTotalWeight(event.params.time.toString())
    totalWeight.timestamp = event.params.time
    totalWeight.block = event.block.number
    totalWeight.weight = event.params.total_weight.toBigDecimal().div(BIG_DECIMAL_1E18)
    totalWeight.save()
  }
}

export function handleVoteForGauge(event: VoteForGauge): void {
  _updateGaugeWeights(
    event.params.gauge_addr,
    event.address,
    false,
    event.params.weight,
    event.block.number,
    event.block.timestamp
  )
  const gaugeVote = new GaugeWeightVote(
    event.params.user.toHexString() + '-' + event.params.weight.toString() + '-' + event.transaction.hash.toHexString()
  )
  gaugeVote.tx = event.transaction.hash
  gaugeVote.timestamp = event.block.timestamp
  gaugeVote.user = event.params.user.toHexString()
  gaugeVote.weight = event.params.weight.toBigDecimal()
  gaugeVote.gauge = event.params.gauge_addr
  gaugeVote.save()
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimit): void {
  const gauge = new GaugeLiquidity(event.params.user.toHexString() + '-' + event.address.toHexString())
  gauge.user = event.params.user
  gauge.gauge = event.address.toHexString()
  gauge.originalBalance = event.params.original_balance
  gauge.originalSupply = event.params.original_supply
  gauge.workingBalance = event.params.working_balance
  gauge.workingSupply = event.params.working_supply
  gauge.timestamp = event.block.timestamp
  gauge.block = event.block.number
  gauge.tx = event.transaction.hash
  gauge.save()
}

export function handleDeposit(event: Deposit): void {
  const deposit = new GaugeDeposit(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  deposit.gauge = event.address.toHexString()
  deposit.provider = event.params.provider
  deposit.value = event.params.value
  deposit.save()
}

export function handleWithdraw(event: Withdraw): void {
  const withdraw = new GaugeWithdraw(event.transaction.hash.toHexString() + '-' + event.logIndex.toString())
  withdraw.gauge = event.address.toHexString()
  withdraw.provider = event.params.provider
  withdraw.value = event.params.value
  withdraw.save()
}
