const R = require('ramda')

const fib = R.memoize(n => {
  if (n <= 0) return 1
  if (n === 1) return 2
  else return fib(n - 1) + fib(n - 2)
})

const firstPref = R.compose(R.prop(0), R.prop('preferences'))

// Count the votes cast for each ballot's first preference,
// using a ballot's weight as the value of that ballot's vote.
// Returns an object {<candidate id>: <total vote value>}
const collectVotes = (ballots) => {
  return R.reduce((voteColl, ballot) => {
    const pref = firstPref(ballot)
    return {
      ...voteColl,
      [pref]: (voteColl[pref] || 0) + ballot.weight
    }
  }, {}, ballots)
}

// Takes a vote count object and returns the item id of
// the candidate with the least number of votes
const getLoser = (voteCounts) => R.compose(
  ([cand, _]) => cand,
  R.reduce(
    R.minBy(([_, votes]) => votes),
    [1,Infinity]),
  R.toPairs,
)(voteCounts)

// Casts elem (will be an item id) to a string before checking if
// set contains it.
const contains = R.curry((elem, set) => {
  const elemAsString = String(elem)
  return R.any(R.equals(elemAsString), set)
})

// Determines if the ballot's first preference (being a winner) has a surplus
// number of votes over the vote quota. If it does, reduce the ballot's vote weight
// by the ratio of surplus votes to votes cast for that first preference.
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

// Takes a set of id's to remove and an array of ballots, and peels off any
// first preferences that are in toRemove.
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

// Converts an object {<candidate id>: <candidate vote count>} to an array
// [{candidate: <cand id>, votes: <vote count>, round: <round num>}].
// Note that this is used to convert an object of winning candidate vote counts
// into an array for concatenation, tracking in which round each winning candidate
// earned its votes.
const voteCountsToList = (round, voteCounts) => R.compose(
  R.map(([candidate, votes]) => ({candidate, votes, round})),
  R.toPairs
)(voteCounts)

// Given an array of item objects and ids, return the item object
// associated with each id.
const associateIdsWithItems = R.curry((items, ids) => {
  const byIds = R.groupBy(R.prop('id'), items)

  return R.map(id => byIds[id][0], ids)
})

// Run the first round of a Single Transferable Vote election, then recursively
// continue with the next round.
// (https://en.wikipedia.org/wiki/Single_transferable_vote#Finding_the_winners)
// Broadly:
//   1. Set a quota beyond which we say a candidate item will certainly be chosen.
//   2. Using each ballot's first preference as their vote, and each ballot's weight
//      as the value of its vote, find all winning candidates whose vote count is > the quota.
//   3. If there were any winners this round,
//      3a. peel those winners from the front of each ballot (so they'll have a new first
//          preference next round), and
//      3b. diminish the weight of any ballots that voted for a winner (their vote gets "used up").
//      3c. Return the winners, concated to the results of a recursive election with the altered
//          ballots, looking for however many more winners we need.
//   4. If there were no winners this round,
//      4a. Find the loser with the lowest vote count.
//      4b. Remove them from the front of each ballot (so they're no longer first preferences).
//      4c. Return the result of a recursively called new election, looking for the same number
//          of winners, but with the newly altered ballots.
//
//   numWinners:      the number of winners we need
//   ballots:         array of ballots, of form [{preferences: [<item id>, ...],
//                                                weight: <weight of this ballot's votes}]
//   previousWinners: array of winners we've already found, so we know if this round's winners
//                    are new (and count against numWinners)
//   round:           the round number of the election, attached to this round's results,
//                    used for tiebreakers
const singleTransferableVoteElection = (numWinners, ballots, previousWinners=[], round=1) => {
  // Ditch any ballots that have had all candidates peeled out
  ballots = R.filter(ballot => ballot.preferences.length > 0, ballots)

  // Base case
  if (numWinners <= 0 || ballots.length === 0) {
    return []
  }

  // Count votes for each ballot's first preference
  const voteCounts = collectVotes(ballots)
  const numVotesCast = R.sum(R.values(voteCounts))  // Total value of votes cast in this round

  // const voteQuota = numVotesCast / numWinners // Hare
  const voteQuota = (numVotesCast / (numWinners + 1)) // Droop

  // Vote counts of candidates that won
  const winnersWithVoteCounts = R.filter(
    votes => votes >= voteQuota,
    voteCounts
  )
  const winners = R.keys(winnersWithVoteCounts)

  if (winners.length > 0) {
    const isWinner = contains(R.__, winners)  // Determine if a cand id is in winners

    // Diminish weights of ballots that voted for a winner, then remove winners
    // from front of ballots.
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
    // Just remove the loser from the front of each ballot
    const adjustBallots = removeCandidatesFromBallots([loser])

    return singleTransferableVoteElection(
      numWinners,
      adjustBallots(ballots),
      previousWinners,
      round + 1
    )
  }
}

// Run an election based on assigning each rank a fibonacci number, and summing
// up a candidate's ranking numbers to determine their final total ranking.
const fibonacciElection = (numWinners, ballots) => {
  // Find length of longest ballot, so we know how many fibonacci numbers we need
  const greatestBallotLength = R.compose(
    R.reduce(R.max, -Infinity), // Get max length
    R.map(R.prop('length')),    // Map out length of each ballot
  )(ballots)

  // Convert array index to fibonacci number (if greatestBallotLength length == 5,
  //   0 -> 8, 1 -> 5, 2 -> 3, 3 -> 2, 4 -> 1
  // )
  const idxToFibo = i => fib(greatestBallotLength - 1 - i)

  const mapWithIdx = R.addIndex(R.map)  // Make R.map pass an idx to its mapping function

  return R.compose(
    // Sum each element {<cand>: <fiboNumber} into an object of <cand id> -> <summed fibo number>
    // Will look like {1: 58, 2: 43, 3: 188, ...}
    R.reduce(R.mergeWith(R.add), {}),
    R.flatten,  // Flatten all rankings for summing
    // For each ballot, map each candidate item to the corresponding fibo number, based on its rank
    R.map(mapWithIdx((cand, idx) => ({
      [cand]: idxToFibo(idx)
    }))),
  )(ballots)
}

// Run a Single Transferable Vote election
const electWithSingleTransVote = (numWinners, allUserRankings) => {
  // Extract all items with details that we will consider for ranking
  const allItems = R.compose(
    R.uniqBy(R.prop('id')),
    R.flatten
  )(allUserRankings)
  const allItemIds = R.map(item => String(item.id), allItems)

  // Transform user rankings into usable ballots (a ballot being a user's set of rankings)
  const basicBallots = R.map(R.map(R.prop('id')), allUserRankings)  // Map each item in each ranking to its id
  const ballots = R.map(
    (preferences) => ({weight: 1, preferences}),  // map each user's array of preferred item ids
    basicBallots
  )

  // Get election results, as a rough array of
  // {candidate: <candidate item id>, votes: <num votes cast in that round>, round: <round this result was generated in>}
  // Note that any candidate item may have multiple objects with multiple vote counts in different rounds;
  // they'll be added up.
  const roughElectionResults = singleTransferableVoteElection(numWinners, ballots)

  const summedElectionResults = R.compose(
    // Map each grouped object to
    // {<candidate id>: {
    //   votes: <sum of votes for that candidate>,
    //   round: <weighted average round in which votes were cast for this candidate}
    // }
    // We need the weighted average round to break ties between votes
    R.map(R.reduce((res1, res2) => {
      const sumVotes = res1.votes + res2.votes

      return {
        votes: sumVotes,
        round: sumVotes
          ? (res1.round * res1.votes + res2.round * res2.votes) / sumVotes
          : Math.max(res1.round, res2.round)
      }
    }, {votes: 0, round: 0})),
    R.groupBy(R.prop('candidate'))  // Group that rough array by candidate item id
  )(roughElectionResults)

  const finalRankings = R.compose(
    // Re-attach item info to corresponding item ids
    associateIdsWithItems(allItems),
    R.take(numWinners),
    // Fill in finalRankings with any missing items, up to length numWinners
    (rankedIds) => {
      const unrankedItems = R.difference(allItemIds, rankedIds)
      return R.concat(rankedIds, unrankedItems)
    },
    R.map(R.prop(0)), // Map out candidate id
    R.sortWith([  // Sort by highest votes first, then earliest round
      R.descend(R.path([1, 'votes'])),
      R.ascend(R.path([1, 'round']))
    ]),
    R.toPairs // Convert object to pairs for sorting
  )(summedElectionResults)

  return finalRankings
}

const electWithFibonacci = (numWinners, allUserRankings) => {
  // Convert 2d array of user rankings to 2d array of item ids
  const ballots = R.map(R.map(R.prop('id')), allUserRankings)
  // Gets object of summed fibo numbers, looking like {1: 58, 2: 43, 3: 188, ...}
  const fiboElectionResults = fibonacciElection(numWinners, ballots)

  // Extract unique items under consideration
  const allItems = R.compose(
    R.uniqBy(R.prop('id')),
    R.flatten
  )(allUserRankings)

  const fibonacciWinners = R.compose(
    associateIdsWithItems(allItems),  // Re-attach item details to item ids
    R.map(R.prop(0)),                 // Map out candidate id
    R.take(numWinners),               // Only take the highest numWinners
    R.sort(R.descend(R.prop(1))),     // Sort candidate items by highest total summed fibo value first
    R.toPairs                         // For sorting
  )(fiboElectionResults)

  return fibonacciWinners
}

module.exports = {
  electWithSingleTransVote,
  electWithFibonacci,
  _: {
    fib,
    firstPref,
    collectVotes,
    getLoser,
    contains,
    diminishWeightBySurplus,
    removeCandidatesFromBallots,
    voteCountsToList,
    associateIdsWithItems,
    singleTransferableVoteElection,
    fibonacciElection
  }
}
