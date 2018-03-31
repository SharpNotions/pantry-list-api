const R = require('ramda')

const firstPref = R.compose(R.lensProp('preferences'), R.lensIndex(0));

const collectVotes = (ballots) => {
  return R.reduce((voteColl, {weight, preferences}) => {
    const firstPref = preferences[0]
    return {
      ...voteColl,
      [firstPref]: (voteColl[firstPref] || 0) + weight
    }
  }, {}, ballots)
}

const getWinners = (quota, voteCounts) =>
  R.filter(([winner, votes]) => votes >= quota, R.toPairs(voteCounts))

const getLoser = (voteCounts) => R.compose(
  R.tap(console.log),
  ([winner, votes]) => winner,
  R.tap(console.log),
  R.reduce(R.minBy(([winner, votes]) => votes), [1,Infinity]),
  R.tap(console.log),
  R.toPairs,
  R.tap(console.log)
)(voteCounts)

const contains = R.curry((elem, set) => {
  const elemAsString = String(elem)
  return R.any(R.equals(elemAsString), set)
})

const diminishWeightBySurplus = R.curry((voteCounts, voteQuota, ballot) => {
  const candidateVotes = voteCounts[ballot[0]]
  const surplusRatio = (candidateVotes - voteQuota) / candidateVotes

  if (surplusRatio < 0) {
    return ballot
  } else {
    return {...ballot, weight: ballot[weight] * surplusRatio}
  }
});

const removeCandidatesFromBallots = R.curry((toRemove, ballots) => {
  const shouldRemoveCandidate = contains(R.__, toRemove);

  return R.map((ballot) => {
    if (shouldRemoveCandidate(ballot.preferences[0])) {
      return {...ballot, preferences: R.tail(ballot.preferences)}
    } else {
      return ballot
    }
  }, ballots)
})

const adjustBallotWeights = R.curry((shouldAdjust, adjustWeight, ballots) => {
  return R.map(R.ifElse(
    shouldAdjust,
    adjustWeight,
    R.identity
  ), ballots)
})

const sortCandidatesByVotes = R.curry((voteCounts, candidates) => (
  R.sort(R.descend(cand => voteCounts[cand]), candidates)
))


const electWinners = (numWinners, ballots, indent='') => {
  if (indent.length > 4 * 10) throw new Error();
  const log = (...msg) => console.log(indent, ...msg);
log('numWinners', numWinners, 'ballots\n', ballots)
  if (numWinners === 0) return [];

  ballots = R.filter(ballot => ballot.preferences.length > 0, ballots)

  const voteCounts = collectVotes(ballots)
log('voteCounts', voteCounts)
  const candidates = R.keys(voteCounts)
  const sortByVotes = sortCandidatesByVotes(voteCounts)

//   if (candidates.length <= numWinners) {
// log('returning short circuit', R.sort(R.descend(cand => voteCounts[cand]), candidates))
//
//
//     const adjustBallots = removeCandidatesFromBallots(candidates)
//     return [
//       ...sortByVotes(candidates),
//       ...electWinners(
//         numWinners - candidates.length,
//         adjustBallots(ballots),
//         indent+'--'
//       )
//     ]
//   }

  const numVotesCast = R.sum(R.values(voteCounts));
log('numVotesCast', numVotesCast)

  const voteQuota = numVotesCast / numWinners // Hare
  // const voteQuota = 1 + (numVotesCast / (numWinners + 1)) // Droop
log('voteQuota', voteQuota)

  const winnersWithVoteCounts = getWinners(voteQuota, voteCounts)
  const winners = winnersWithVoteCounts.map(R.head)
log('winners', winners)
  if (winners.length > 0) {
    const isWinner = contains(R.__, winners)

    const adjustBallots = R.compose(
      removeCandidatesFromBallots(winners),
      R.map(R.ifElse(
        isWinner,
        diminishWeightBySurplus(voteCounts, voteQuota),
        R.identity
      ))
    )

    return [
      ...sortByVotes(winners),
      ...electWinners(
        numWinners - winners.length,
        adjustBallots(ballots),
        indent+'----'
      )
    ]
  } else {
    const loser = getLoser(voteCounts)
    const adjustBallots = removeCandidatesFromBallots([loser])

    return electWinners(
      numWinners,
      adjustBallots(ballots),
      indent+'----'
    )
  }
}



exports.electWinners = electWinners;

exports.elect = async (ctx, next) => {
  const nextRankingsToLevel = (n) => {
    if (n === 1) return 'nextRanking'
    else {
      return 'nextRanking.' + nextRankingsToLevel(n - 1)
    }
  }

  const rankings = await ctx.app.models.UserRanking.query()
    .eager(nextRankingsToLevel(10))

  const listIntoArray = (item) => {
    const withoutNext = R.omit(['nextRanking'], item)
    if (item.nextRanking)
      return [withoutNext, ...listIntoArray(item.nextRanking)]
    else
      return [withoutNext]
  };

  const ballots = R.compose(
    R.map((preferences) => ({weight: 1, preferences})),
    R.values,
    R.map(R.map(R.prop('item_id'))),
    R.map(listIntoArray),
    R.map(
      R.find(R.whereEq({prev_ranking_id: null}))
    ),
    R.groupBy(R.prop('user_id')),
    R.identity
  )(rankings)

  const res = electWinners(3, ballots);

  // const asyncForEach = async (f, data) => {
  //   if (data.length === 0) return;
  //   await f(R.head(data))
  //   await asyncForEach(f, R.tail(data))
  // }
  //
  // await asyncForEach(async userId => {
  //   let prevUserRankingId = null
  //   await asyncForEach(async itemId => {
  //     const newRanking = await ctx.app.models.UserRanking.insertAfter(prevUserRankingId, {
  //       item_id: itemId,
  //       user_id: userId
  //     })
  //     console.log('inserted', userId, itemId)
  //     prevUserRankingId = newRanking.id
  //   }, [1,2,3])
  // }, [1,2,3])



  ctx.body = res;
}
