import { BigInt } from "@graphprotocol/graph-ts"
import {
  VotingEscrow,
  CommitOwnership,
  ApplyOwnership,
  Deposit,
  Withdraw,
  Supply
} from "../generated/VotingEscrow/VotingEscrow"
import { ExampleEntity } from "../generated/schema"

export function handleCommitOwnership(event: CommitOwnership): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.admin = event.params.admin

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.get_last_user_slope(...)
  // - contract.user_point_history__ts(...)
  // - contract.locked__end(...)
  // - contract.balanceOf(...)
  // - contract.balanceOf(...)
  // - contract.balanceOfAt(...)
  // - contract.totalSupply(...)
  // - contract.totalSupply(...)
  // - contract.totalSupplyAt(...)
  // - contract.token(...)
  // - contract.supply(...)
  // - contract.locked(...)
  // - contract.epoch(...)
  // - contract.point_history(...)
  // - contract.user_point_history(...)
  // - contract.user_point_epoch(...)
  // - contract.slope_changes(...)
  // - contract.controller(...)
  // - contract.transfersEnabled(...)
  // - contract.name(...)
  // - contract.symbol(...)
  // - contract.version(...)
  // - contract.decimals(...)
  // - contract.future_smart_wallet_checker(...)
  // - contract.smart_wallet_checker(...)
  // - contract.admin(...)
  // - contract.future_admin(...)
}

export function handleApplyOwnership(event: ApplyOwnership): void {}

export function handleDeposit(event: Deposit): void {}

export function handleWithdraw(event: Withdraw): void {}

export function handleSupply(event: Supply): void {}
