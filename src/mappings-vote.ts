import {
  StartVote as StartVoteEvent,
  CastVote as CastVoteEvent,
  ExecuteVote as ExecuteVoteEvent,
  Voting,
} from '../generated/OwnershipVoting/Voting'
import { Proposal, Vote, Execution } from '../generated/schema'
import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { BIG_INT_ONE, OWNERSHIP, PARAMETER, PARAMETER_VOTING_ADDRESS } from 'const'
import { ipfs } from '@graphprotocol/graph-ts'
import { parseIpfsResult } from 'utils'
import { getUser } from './services/user'

export function handleStartVote(event: StartVoteEvent): void {
  const contract = Voting.bind(event.address)
  const voteInfo = contract.getVote(event.params.voteId)
  const proposal = new Proposal(event.address.toHexString() + '-' + event.params.voteId.toString())
  proposal.tx = event.transaction.hash
  proposal.voteId = event.params.voteId
  proposal.voteType = event.address == PARAMETER_VOTING_ADDRESS ? PARAMETER : OWNERSHIP
  proposal.creator = getUser(event.params.creator).id
  proposal.startDate = voteInfo.value2
  proposal.snapshotBlock = voteInfo.value3
  proposal.supportRequired = voteInfo.value4
  proposal.minAcceptQuorum = voteInfo.value5
  proposal.ipfsMetadata = event.params.metadata
  let ipfsResult: Bytes | null = null
  let retries = 0
  while (!ipfsResult) {
    ipfsResult = ipfs.cat(event.params.metadata.replace('ipfs:', ''))
    retries += 1
    if (retries > 0) {
      // we don't retry for now
      break
    }
  }
  proposal.metadata = ipfsResult ? parseIpfsResult(ipfsResult.toHexString()) : ''
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
  const vote = new Vote(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString() + '-' + event.params.voteId.toString()
  )
  const proposalId = event.address.toHexString() + '-' + event.params.voteId.toString()
  const proposal = Proposal.load(proposalId)
  if (!proposal) {
    return
  }
  vote.tx = event.transaction.hash
  vote.proposal = proposalId
  vote.voteId = event.params.voteId
  vote.voter = getUser(event.params.voter).id
  vote.supports = event.params.supports
  vote.stake = event.params.stake
  vote.timestamp = event.block.timestamp
  vote.save()

  if (vote.supports) {
    proposal.votesFor = proposal.votesFor.plus(vote.stake)
  } else {
    proposal.votesAgainst = proposal.votesAgainst.plus(vote.stake)
  }
  proposal.voteCount = proposal.voteCount.plus(BIG_INT_ONE)
  proposal.save()
}

export function handleExecuteVote(event: ExecuteVoteEvent): void {
  const exec = new Execution(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  const proposalId = event.address.toHexString() + '-' + event.params.voteId.toString()
  const proposal = Proposal.load(proposalId)
  if (!proposal) {
    return
  }
  exec.tx = event.transaction.hash
  exec.proposal = proposalId
  exec.voteId = event.params.voteId
  exec.save()
  proposal.executed = true
  proposal.save()
}
