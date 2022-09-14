import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { PowerSnapshot, Lock } from '../../generated/schema'
import { getUser, getUserBalance } from './user'
import { VotingEscrow } from '../../generated/VotingEscrow/VotingEscrow'
import { CRV_ADDRESS, VOTING_ESCROW_ADDRESS } from 'const'
import { getLockType } from './locktype'
import { getPlatform } from './platform'
import { CRVToken } from '../../generated/VotingEscrow/CRVToken'

export function createLock(
  tx: Bytes,
  timestamp: BigInt,
  block: BigInt,
  provider: Address,
  value: BigInt,
  type: i32,
  locktime: BigInt,
  deposit: boolean
): void {
  const lock = new Lock(tx.toHexString() + provider.toHexString() + value.toString())
  const user = getUser(provider)
  const escrowContract = VotingEscrow.bind(VOTING_ESCROW_ADDRESS)
  const userBalance = getUserBalance(provider, tx, timestamp)
  const crvTokenContract = CRVToken.bind(CRV_ADDRESS)
  const platform = getPlatform()

  lock.user = user.id
  lock.tx = tx
  lock.value = value
  lock.lockStart = userBalance.lockStart
  if (!deposit) {
    userBalance.lockStart = BigInt.zero()
  }
  lock.unlockTime = locktime
  lock.previousUnlockTime = userBalance.unlockTime
  lock.totalLocked = deposit ? escrowContract.locked(provider).value0 : BigInt.zero()
  lock.previousTotalLocked = userBalance.crvLocked
  lock.type = getLockType(type)
  lock.timestamp = timestamp

  userBalance.crvLocked = lock.totalLocked
  userBalance.unlockTime = lock.unlockTime

  lock.save()
  userBalance.save()

  platform.totalVeCrv = escrowContract.totalSupply()
  platform.totalCrvLocked = escrowContract.supply()
  platform.crvSupply = crvTokenContract.totalSupply()

  const dao = new PowerSnapshot(lock.id)
  dao.block = block
  dao.timestamp = timestamp
  dao.totalVeCrv = platform.totalVeCrv
  dao.totalCrvLocked = platform.totalCrvLocked
  dao.crvSupply = platform.crvSupply

  dao.save()
  platform.save()
}
