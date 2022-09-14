import { CREATE_LOCK, DEPOSIT_FOR, INCREASE_LOCK_AMOUNT, INCREASE_UNLOCK_TIME, WITHDRAW } from 'const'

export function getLockType(typeIndex: i32): string {
  switch (typeIndex) {
    case 0:
      return DEPOSIT_FOR
    case 1:
      return CREATE_LOCK
    case 2:
      return INCREASE_LOCK_AMOUNT
    case 3:
      return INCREASE_UNLOCK_TIME
    default:
      return WITHDRAW
  }
}
