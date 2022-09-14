import { User, UserBalance } from '../../generated/schema'
import { BigInt, Bytes } from '@graphprotocol/graph-ts'

export function getUser(userAddress: Bytes): User {
  let user = User.load(userAddress.toHexString())
  if (!user) {
    user = new User(userAddress.toHexString())
    user.save()
  }
  return user
}

export function getUserBalance(userAddress: Bytes, tx: Bytes, timestamp: BigInt): UserBalance {
  let balance = UserBalance.load(userAddress.toHexString())
  if (!balance) {
    balance = new UserBalance(userAddress.toHexString())
    balance.user = userAddress.toHexString()
    balance.startTx = tx
    balance.lockStart = timestamp
    balance.crvLocked = BigInt.zero()
    balance.unlockTime = BigInt.zero()
    balance.save()
  } else {
    // in case user relocks after a withdrawal
    if ((balance.lockStart = BigInt.zero())) {
      balance.lockStart = timestamp
      balance.save()
    }
  }
  return balance
}
