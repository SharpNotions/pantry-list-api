const R = require('ramda')

const fib = R.memoize(n => {
  if (n <= 0) return 1
  if (n === 1) return 2
  else return fib(n - 1) + fib(n - 2)
})

const firstPref = R.compose(R.prop(0), R.prop('preferences'))

const collectVotes = (ballots) => {
  return R.reduce((voteColl, ballot) => {
    const pref = firstPref(ballot)
    return {
      ...voteColl,
      [pref]: (voteColl[pref] || 0) + ballot.weight
    }
  }, {}, ballots)
}

const getWinners = (quota, voteCounts) =>
  R.filter((votes) => votes >= quota, voteCounts)

const getLoser = (voteCounts) => R.compose(
  ([cand, _]) => cand,
  R.reduce(
    R.minBy(([_, votes]) => votes),
    [1,Infinity]),
  R.toPairs,
)(voteCounts)

const contains = R.curry((elem, set) => {
  const elemAsString = String(elem)
  return R.any(R.equals(elemAsString), set)
})

const diminishWeightBySurplus = R.curry((voteCounts, voteQuota, ballot) => {
  const candidateVotes = voteCounts[String(firstPref(ballot))]
  const surplusRatio = (candidateVotes - voteQuota) / candidateVotes

  if (surplusRatio < 0) {
    return ballot
  } else {
    return {
      ...ballot,
      weight: ballot.weight * (surplusRatio || 0)
    }
  }
});

const removeCandidatesFromBallots = R.curry((toRemove, ballots) => {
  const shouldRemoveCandidate = contains(R.__, toRemove);

  return R.map((ballot) => {
    if (shouldRemoveCandidate(firstPref(ballot))) {
      return {...ballot, preferences: R.tail(ballot.preferences)}
    } else {
      return ballot
    }
  }, ballots)
})

const voteCountsToList = (round, voteCounts) => R.compose(
  R.map(([candidate, votes]) => ({candidate, votes, round})),
  R.toPairs
)(voteCounts)

const associateIdsWithItems = R.curry((items, ids) => {
  const byIds = R.groupBy(R.prop('id'), items)

  return R.map(id => byIds[id][0], ids)
})

const singleTransferableVoteElection = (numWinners, ballots, previousWinners=[], round=1) => {
  ballots = R.filter(ballot => ballot.preferences.length > 0, ballots)

  if (numWinners <= 0 || ballots.length === 0) {
    return []
  }

  const voteCounts = collectVotes(ballots)
  const numVotesCast = R.sum(R.values(voteCounts))

  // const voteQuota = numVotesCast / numWinners // Hare
  const voteQuota = (numVotesCast / (numWinners + 1)) // Droop

  const winnersWithVoteCounts = R.filter(
    votes => votes >= voteQuota,
    voteCounts
  )
  const winners = R.keys(winnersWithVoteCounts)

  if (winners.length > 0) {
    const isWinner = contains(R.__, winners)

    const adjustBallots = R.compose(
      removeCandidatesFromBallots(winners),
      R.map(R.ifElse(
        R.compose(isWinner, firstPref),
        diminishWeightBySurplus(voteCounts, voteQuota),
        R.identity
      ))
    )

    const newWinners = R.difference(winners, previousWinners)

    return [
      ...voteCountsToList(round, winnersWithVoteCounts),
      ...singleTransferableVoteElection(
        numWinners - newWinners.length,
        adjustBallots(ballots),
        [...previousWinners, ...newWinners],
        round + 1
      )
    ]
  } else {
    const loser = getLoser(voteCounts)
    const adjustBallots = removeCandidatesFromBallots([loser])

    return singleTransferableVoteElection(
      numWinners,
      adjustBallots(ballots),
      previousWinners,
      round + 1
    )
  }
}

const fibonacciElection = (numWinners, ballots) => {
  const greatestBallotLength = R.compose(
    R.reduce(R.max, -Infinity),
    R.map(R.prop('length')),
  )(ballots)

  const idxToFibo = i => fib(greatestBallotLength - 1 - i)

  const mapWithIdx = R.addIndex(R.map)

  return R.compose(
    R.reduce(R.mergeWith(R.add), {}),
    R.flatten,
    R.map(mapWithIdx((cand, idx) => ({
      [cand]: idxToFibo(idx)
    }))),
  )(ballots)
}

const electWithSingleTransVote = (numWinners, allUserRankings) => {
  // This isn't super
  const allItems = R.compose(
    R.uniqBy(R.prop('id')),
    R.flatten
  )(allUserRankings)
  const allItemIds = R.map(item => String(item.id), allItems)

  const basicBallots = R.map(R.map(R.prop('id')), allUserRankings)
  const ballots = R.map(
    (preferences) => ({weight: 1, preferences}),
    basicBallots
  )

  const roughElectionResults = singleTransferableVoteElection(numWinners, ballots)

  const summedElectionResults = R.compose(
    R.map(R.reduce((res1, res2) => {
      const sumVotes = res1.votes + res2.votes

      return {
        votes: sumVotes,
        round: sumVotes
          ? (res1.round * res1.votes + res2.round * res2.votes) / sumVotes
          : Math.max(res1.round, res2.round)
      }
    }, {votes: 0, round: 0})),
    R.groupBy(R.prop('candidate'))
  )(roughElectionResults)

  const finalRankings = R.compose(
    associateIdsWithItems(allItems),
    R.take(numWinners),
    // Fill in finalRankings with any
    R.converge(R.concat, [
      R.identity,
      R.difference(allItemIds)
    ]),
    R.map(R.prop(0)),
    R.sortWith([
      R.descend(R.path([1, 'votes'])),
      R.ascend(R.path([1, 'round']))
    ]),
    R.toPairs
  )(summedElectionResults)

  return finalRankings
}

const electWithFibonacci = (numWinners, allUserRankings) => {
  const ballots = R.map(R.map(R.prop('id')), allUserRankings)
  const fiboElectionResults = fibonacciElection(numWinners, ballots)

  const allItems = R.compose(
    R.uniqBy(R.prop('id')),
    R.flatten
  )(allUserRankings)

  const fibonacciWinners = R.compose(
    associateIdsWithItems(allItems),
    R.map(R.prop(0)),
    R.take(numWinners),
    R.sort(R.descend(R.prop(1))),
    R.toPairs
  )(fiboElectionResults)

  return fibonacciWinners
}

module.exports = {
  electWithSingleTransVote,
  electWithFibonacci
}
