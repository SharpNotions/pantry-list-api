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
  R.filter((votes) => votes >= quota, voteCounts)

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
  const {weight, preferences} = ballot

  const candidateVotes = voteCounts[String(preferences[0])]
  const surplusRatio = (candidateVotes - voteQuota) / candidateVotes

  if (surplusRatio < 0) {
    return ballot
  } else {
    return {
      ...ballot,
      weight: weight * (surplusRatio || 0)
    }
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

const sortByVotes = (voteCounts) => (
  R.sort(R.descend(cand => voteCounts[cand]), R.keys(voteCounts))
)


const electWinners = (numWinners, ballots, previousWinners={}, multiplier=1, indent='') => {
  if (indent.length > 4 * 10) throw new Error();
  const log = (...msg) => console.log(indent, ...msg);
log('-----------------------')
log('numWinners', numWinners, 'ballots\n', ballots)
log('previousWinners', previousWinners)
  if (numWinners === 0) {
    // const toReturn = sortByVotes(previousWinners)
    // log('RETURNING, D', toReturn)
    // return sortByVotes(previousWinners)
    return previousWinners
  }

  ballots = R.filter(ballot => ballot.preferences.length > 0, ballots)

  const voteCounts = collectVotes(ballots)
log('voteCounts', voteCounts)

  const numVotesCast = R.sum(R.values(voteCounts));
log('numVotesCast', numVotesCast)

  const voteQuota = numVotesCast / numWinners // Hare
  // const voteQuota = (numVotesCast / (numWinners + 1)) // Droop
log('voteQuota', voteQuota)

  const winnersWithVoteCounts = getWinners(voteQuota, voteCounts)
log('winnersWithVoteCounts', winnersWithVoteCounts)
  const winners = R.keys(winnersWithVoteCounts)
log('winners', winners)
  if (winners.length > 0) {
    const isWinner = contains(R.__, winners)

    const adjustBallots = R.compose(
      removeCandidatesFromBallots(winners),
      R.map(R.ifElse(
        R.compose(isWinner, R.head, R.prop('preferences')),
        diminishWeightBySurplus(voteCounts, voteQuota),
        R.identity
      ))
    )

    const numNewWinners = R.difference(winners, R.keys(previousWinners)).length
    log('winnersWithVoteCounts', winnersWithVoteCounts)

    const nextWinnersObject = R.mergeWith(
      R.add,
      R.map(v => v * multiplier, winnersWithVoteCounts),
      // winnersWithVoteCounts,
      previousWinners
    )

    const electedWinners = electWinners(
    // return electWinners(
      numWinners - numNewWinners,
      adjustBallots(ballots),
      nextWinnersObject,
      multiplier * 0.9,
      indent+'----'
    )
    log('RETURNING, W', electedWinners)
    return electedWinners
  } else {
    const loser = getLoser(voteCounts)
    log('loser', loser)
    const adjustBallots = removeCandidatesFromBallots([loser])

    const electedWinners = electWinners(
    // return electWinners(
      numWinners,
      adjustBallots(ballots),
      previousWinners,
      multiplier * 0.9,
      indent+'----'
    )
    log('RETURNING, L', electedWinners)
    return electedWinners
  }
}

const fib = R.memoize(n => {
  if (n <= 0) return 1;
  if (n === 1) return 2;
  else return fib(n-1) + fib(n-2)
})
const electWinnersByFibo = (numWinners, ballots) => {
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

  // electWinnersByFibo(3, R.map(x => x.preferences, ballots))
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
