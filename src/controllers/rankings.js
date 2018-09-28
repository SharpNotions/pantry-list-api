const { graphql } = require('graphql')
const { schema }  = require('./graphql')
const R           = require('ramda')
const { raw }     = require('objection')
const {
  electWithSingleTransVote, electWithFibonacci
} = require('../election')
const establishList = require('./helpers/establishList')

const { pathOr }  = R

const rankingFieldsFragment = `
  fragment RankingFields on UserRankings {
    ranking_id: id
    list_id
    item {
      id
      item_name
      item_details {
        description
      }
    }
  }
`

const generateRankingsRecursive = (n) => {
  if (!n || n === 1) {
    return 'nextRanking { ...RankingFields }'
  }
  return `nextRanking { ...RankingFields ${generateRankingsRecursive(n - 1)}}`
}

const rankingsForUserToDepth = (list_id, depth) => {
  const recursiveRankings = generateRankingsRecursive(depth)
  const listIdSelector = !!list_id ? `list_id: ${list_id}` : 'list_idIsNull: true'
  return `
    query UserRankings($user_id: Int) {
      userRankings(prev_ranking_idIsNull: true, user_id: $user_id, ${listIdSelector}) {
        ...RankingFields
        ${recursiveRankings}
      }
    }

    ${rankingFieldsFragment}
  `
}

const allRankingsInListToDepth = (list_id, depth) => {
  const recursiveRankings = generateRankingsRecursive(depth)
  const listIdSelector = !!list_id ? `list_id: ${list_id}` : 'list_idIsNull: true'
  return `
    query UserRankings {
      userRankings(prev_ranking_idIsNull: true, ${listIdSelector}) {
        user_id: id
        ...RankingFields
        ${recursiveRankings}
      }
    }

    ${rankingFieldsFragment}
  `
}

const depthFromCtx = pathOr(10, ['request', 'query', 'depth'])

const numFromCtx = pathOr(10, ['request', 'query', 'num'])

const setUserRanking = establishList(list => async (ctx, next) => {
  const UserRanking = ctx.app.models.UserRanking;
  const graph = {
    ...ctx.request.body,
    user_id: ctx.state.user.id,
    list_id: list.id
  }

  await UserRanking.query()
    .where({
      user_id: ctx.state.user.id,
      item_id: graph.item_id
    })
    .first()
    .then(existingRanking => {
      if (!existingRanking) {
        return UserRanking.insertAfter(graph.prev_item_id, graph)
      } else {
        return existingRanking.moveAfter(
          graph.prev_item_id
        );
      }
    })
    .then(body => ctx.body = body)

  await next()
})

const flattenRankings = (currentItem) => {
  if (!currentItem.nextRanking) {
    return [currentItem.item]
  } else {
    return [currentItem.item, ...flattenRankings(currentItem.nextRanking)]
  }
}

const allUserRankingsForList = list => async depth => {
  const { data } = await graphql(
    schema,
    allRankingsInListToDepth(list.id, depth),
    null
  )

  const flattenedRankings = R.map(
    head => flattenRankings(head, []),
    data.userRankings
  )

  return flattenedRankings
}

const getAllUserRankings = establishList(list => async (ctx, next) => {
  const depth = depthFromCtx(ctx)

  ctx.body = await allUserRankingsForList(list)(depth)

  await next()
})

const getUserRankings = establishList(list => async (ctx, next) => {
  const depth = depthFromCtx(ctx)

  const { data } = await graphql(
    schema,
    rankingsForUserToDepth(list.id, depth),
    null,
    null,
    { user_id: ctx.state.user.id }
  )

  const flattenedUserRankings = data.userRankings && data.userRankings.length
    ? flattenRankings(data.userRankings[0], [])
    : [];
  ctx.body = flattenedUserRankings

  await next()
})

const deleteUserRanking = establishList(list => async (ctx, next) => {
  const UserRanking = ctx.app.models.UserRanking;

  const itemToDelete = await UserRanking.query()
    .where({
      user_id: ctx.state.user.id,
      item_id: ctx.request.body.item_id,
      list_id: list.id
    })
    .first();

  if (!itemToDelete) {
    ctx.status = 404;
  } else {
    await itemToDelete.deleteFromList();
    ctx.status = 200;
  }
})

const computeTopRankings = (numTopRankings, allRankings) => {
  const singleTransVoteRankings = electWithSingleTransVote(
    numTopRankings,
    allRankings
  )
  const fiboRankings = electWithFibonacci(
    numTopRankings,
    allRankings
  )

  return {
    singleTransVoteRankings,
    fiboRankings
  }
}

const getTopRankings = establishList(list => async (ctx, next) => {
  const num = numFromCtx(ctx)
  const depth = depthFromCtx(ctx)
  const allRankings = await allUserRankingsForList(list)(depth)

  ctx.body = await computeTopRankings(num, allRankings)

  await next()
})

const saveSnapshot = establishList(list => async (ctx, next) => {
  const {
    UserRanking, RankingsSnapshot
  } = ctx.app.models

  const num = numFromCtx(ctx)
  const depth = depthFromCtx(ctx)
  const allUserRankingsLists = await allUserRankingsForList(list)(depth)

  const user_rankings = await UserRanking.query()
    .where({list_id: list.id})
  const top_rankings = await computeTopRankings(num, allUserRankingsLists)

  await RankingsSnapshot.query()
    .insert({
      snapshot: {
        list,
        user_rankings,
        top_rankings
      }
    })
})

const clearUserRankings = establishList(list => async (ctx, next) => {
  await saveSnapshot(ctx);

  const deletedUserRankings = await ctx.app.models.UserRanking.query()
    .delete()
    .where({list_id: list.id})

  ctx.body = deletedUserRankings;

  await next()
})

exports.getUserRankings = getUserRankings
exports.setUserRanking = setUserRanking
exports.deleteUserRanking = deleteUserRanking
exports.getAllUserRankings = getAllUserRankings
exports.getTopRankings = getTopRankings
exports.clearUserRankings = clearUserRankings
