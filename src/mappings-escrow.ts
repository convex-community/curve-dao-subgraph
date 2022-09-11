import { BigInt } from "@graphprotocol/graph-ts"
import {
  Deposit,
  Withdraw,
} from "../generated/VotingEscrow/VotingEscrow"
import {createLock} from "./services/locks";

export function handleDeposit(event: Deposit): void {
  createLock(event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.params.provider,
      event.params.value,
      event.params.type.toI32(),
      event.params.locktime,
      true
      )
}

export function handleWithdraw(event: Withdraw): void {
  createLock(event.transaction.hash,
      event.block.timestamp,
      event.block.number,
      event.params.provider,
      event.params.value,
      4,
      event.block.timestamp,
      false
  )
}