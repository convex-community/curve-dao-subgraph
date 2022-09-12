import {
  StartVote as StartVoteEvent,
  CastVote as CastVoteEvent,
  ExecuteVote as ExecuteVoteEvent, Voting
} from "../generated/OwnershipVoting/Voting"
import {
  Proposal,
  Vote,
  Execution
} from "../generated/schema"
import {BigInt} from "@graphprotocol/graph-ts";
import {BIG_INT_ONE, OWNERSHIP, PARAMETER, PARAMETER_VOTING_ADDRESS} from "../packages/constants";

export function handleStartVote(event: StartVoteEvent): void {
  let contract = Voting.bind(event.address)
  let voteInfo = contract.getVote(event.params.voteId)
  let proposal = new Proposal(event.params.voteId.toString())
  proposal.tx = event.transaction.hash
  proposal.voteId = event.params.voteId
  proposal.voteType = event.address == PARAMETER_VOTING_ADDRESS ? PARAMETER : OWNERSHIP
  proposal.creator = event.params.creator
  proposal.startDate = voteInfo.value2
  proposal.snapshotBlock = voteInfo.value3
  proposal.metadata = event.params.metadata
  proposal.minBalance = event.params.minBalance
  proposal.minTime = event.params.minTime
  proposal.totalSupply = event.params.totalSupply
  proposal.creatorVotingPower = event.params.creatorVotingPower
  proposal.votesFor = BigInt.zero()
  proposal.votesAgainst = BigInt.zero()
  proposal.executed = false
  proposal.script = voteInfo.value9
  proposal.voteCount = BigInt.zero()
  proposal.save()
}

export function handleCastVote(event: CastVoteEvent): void {
  let vote = new Vote(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString() + "-" + event.params.voteId.toString()
  )
  let proposal = Proposal.load(event.params.voteId.toString())
  if (!proposal) {
    return
  }
  vote.tx = event.transaction.hash
  vote.proposal = event.params.voteId.toString()
  vote.voter = event.params.voter
  vote.supports = event.params.supports
  vote.stake = event.params.stake
  vote.save()

  if (vote.supports) {
    proposal.votesFor = proposal.votesFor.plus(vote.stake)
  }
  else {
    proposal.votesAgainst = proposal.votesAgainst.plus(vote.stake)
  }
  proposal.voteCount = proposal.voteCount.plus(BIG_INT_ONE)
}

export function handleExecuteVote(event: ExecuteVoteEvent): void {
  let exec = new Execution(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  let proposal = Proposal.load(event.params.voteId.toString())
  if (!proposal) {
    return
  }
  exec.tx = event.transaction.hash
  exec.proposal = event.params.voteId.toString()
  exec.save()
  proposal.executed = true
  proposal.save()
}

