import {Platform} from '../../generated/schema'
import {CURVE_PLATFORM_ID} from '../../packages/constants'
import {BigInt} from "@graphprotocol/graph-ts";

export function getPlatform(): Platform {
    let platform = Platform.load(CURVE_PLATFORM_ID)
    if (!platform) {
        platform = new Platform(CURVE_PLATFORM_ID)
        platform.totalCrvLocked = BigInt.zero()
        platform.totalVeCrv = BigInt.zero()
        platform.crvSupply = BigInt.zero()
        platform.save()
    }
    return platform
}