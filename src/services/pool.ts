import { Address } from '@graphprotocol/graph-ts'
import { Pool } from '../../generated/schema'
import { CURVE_PLATFORM_ID, CURVE_REGISTRY, CURVE_REGISTRY_V2, V2_SWAPS } from 'const'
import { ERC20 } from '../../generated/GaugeController/ERC20'
import { CurveRegistry } from '../../generated/GaugeController/CurveRegistry'

export function getPool(lpToken: Address): Pool {
  let pool = Pool.load(lpToken.toHexString())
  let name = ''
  const curveRegistry = CurveRegistry.bind(CURVE_REGISTRY)
  if (!pool) {
    pool = new Pool(lpToken.toHexString())
    pool.lpToken = lpToken
    let swapResult = curveRegistry.try_get_pool_from_lp_token(lpToken)

    // v1 factory pools have lpToken = pool
    let swap = lpToken
    if (!(swapResult.reverted || swapResult.value == Address.zero())) {
      swap = swapResult.value
      const nameResult = curveRegistry.try_get_pool_name(swap)
      name = nameResult.reverted ? '' : nameResult.value
    } else {
      const curveRegistryV2 = CurveRegistry.bind(CURVE_REGISTRY_V2)
      swapResult = curveRegistryV2.try_get_pool_from_lp_token(lpToken)
      if (!(swapResult.reverted || swapResult.value == Address.zero())) {
        swap = swapResult.value
        const nameResult = curveRegistry.try_get_pool_name(swap)
        name = nameResult.reverted ? '' : nameResult.value
      }
      // these pools predate the v2 registry
      else if (V2_SWAPS.has(pool.id)) {
        swap = Address.fromString(V2_SWAPS.get(pool.id))
      }
    }

    pool.address = swap

    if (name == '') {
      const lpTokenContract = ERC20.bind(lpToken)
      const lpTokenNameResult = lpTokenContract.try_name()
      name = lpTokenNameResult.reverted ? '' : lpTokenNameResult.value
    }

    pool.name = name
    pool.platform = CURVE_PLATFORM_ID
    pool.save()
  }

  return pool
}
