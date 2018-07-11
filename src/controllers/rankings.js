const { graphql } = require('graphql')
const { schema }  = require('./graphql')
const R           = require('ramda')
const {
  electWithSingleTransVote, electWithFibonacci
} = require('../election')

const { pathOr }  = R

const rankingFieldsFragment = `
  fragment RankingFields on UserRankings {
    ranking_id: id
    item {
      id
      item_name
      item_details {
        description
      }
    }
  }
`

const rankingsForUserToDepth = (depth) => {
  const recursiveRankings = generateRankingsRecursive(depth)
  return `
    query UserRankings($user_id: Int) {
      userRankings(prev_ranking_idIsNull: true, user_id: $user_id) {
        ...RankingFields
        ${recursiveRankings}
      }
    }

    ${rankingFieldsFragment}
  `
}

const allRankingsToDepth = (depth) => {
  const recursiveRankings = generateRankingsRecursive(depth)
  return `
    query UserRankings {
      userRankings(prev_ranking_idIsNull: true) {
        user_id: id
        ...RankingFields
        ${recursiveRankings}
      }
    }

    ${rankingFieldsFragment}
  `
}

function depthFromCtx(ctx) {
  return pathOr(10, ['request', 'query', 'depth'], ctx)
}

async function deleteUserRanking(ctx, next) {
  const UserRanking = ctx.app.models.UserRanking;
  const itemToDelete = await UserRanking.query()
    .where({
      user_id: ctx.state.user.id,
      item_id: ctx.request.body.item_id
    })
    .first();
  if (!itemToDelete) {
    ctx.status = 404;
  } else {
    await itemToDelete.deleteFromList();
    ctx.status = 200;
  }
}

async function setUserRanking(ctx, next) {
  const UserRanking = ctx.app.models.UserRanking;
  const graph = ctx.request.body;
  await UserRanking.query()
    .where({
      user_id: ctx.state.user.id,
      item_id: graph.item_id
    })
    .first()
    .then(existingRanking => {
      if (!existingRanking) {
        // HACK: Attach the user ID to the graph since UserRanking.insertAfter needs it.
        graph.user_id = ctx.state.user.id;
        return UserRanking.insertAfter(graph.prev_item_id, graph)
      } else {
        return existingRanking.moveAfter(
          graph.prev_item_id
        );
      }
    })
    .then(body => ctx.body = body)
}

async function getUserRankings(ctx, next) {
  const depth = depthFromCtx(ctx)
  const { data } = await graphql(
    schema,
    rankingsForUserToDepth(depth),
    null,
    null,
    {user_id: ctx.state.user.id}
  )
  const flattenedUserRankings = data.userRankings && data.userRankings.length
    ? flattenRankings(data.userRankings[0], [])
    : [];
  ctx.body = flattenedUserRankings
}

async function getAllUserRankings(ctx) {
  const depth = depthFromCtx(ctx)

  const { data } = await graphql(schema, allRankingsToDepth(depth), null, null)

  const flattenedRankings = R.map(
    head => flattenRankings(head, []),
    data.userRankings)

  return flattenedRankings
}

async function getTopRankings(ctx, next) {
  const {num} = ctx.request.query;
  const allRankings = await getAllUserRankings(ctx)

  const singleTransVoteRankings = electWithSingleTransVote(num, allRankings)
  const fiboRankings = electWithFibonacci(num, allRankings)

  const res = {
    singleTransVoteRankings,
    fiboRankings
  }

  ctx.body = res
}

function generateRankingsRecursive(n) {
  if (n === 1) {
    return 'nextRanking { ...RankingFields }'
  }
  return `nextRanking { ...RankingFields ${generateRankingsRecursive(n - 1)}}`
}

function flattenRankings(currentItem) {
  if (!currentItem.nextRanking) {
    return [currentItem.item]
  } else {
    return [currentItem.item, ...flattenRankings(currentItem.nextRanking)]
  }
}

async function createUsers(ctx, next) {
  const userRankings = {
    // 1: [5,1,4,5,2],
    // 2: [2,3,1,5,4],
    // 3: [3,2,1,4,5],
    // 4: [2,1,3,4,5],
    // 5: [5,2,1,4,3],
    // 6: [1,4,5,3,2]
    1: [5,1,4,10,2,8],
    2: [2,3,1,5,4,7,8,6,10,9],
    3: [3,2,1,4,5],
    4: [2],
    5: [5,2,1,4,3],
    6: [1,4,8,4,9,10,6,7,5,3,2],
    7: [5,3,2,1,6,7,8,4,9,10]
  }

  const asyncForEach = async (f, data) => {
    if (data.length === 0) return;
    await f(R.head(data))
    await asyncForEach(f, R.tail(data))
  }

  await asyncForEach(async ([user_id, itemIds]) => {
    user_id = +user_id
    let prevUserRankingId = null
    await asyncForEach(async item_id => {
      item_id = +item_id

      const newRanking = await ctx.app.models.UserRanking.insertAfter(prevUserRankingId, {
        item_id,
        user_id
      })
      console.log('inserted', user_id, item_id)
      prevUserRankingId = newRanking.id
    }, itemIds)
  }, R.toPairs(userRankings))
}

async function clearUserRankings(ctx, next) {
  const userRankings = await ctx.app.models.UserRanking.query().delete();
  ctx.body = userRankings;
}

exports.getUserRankings = getUserRankings
exports.setUserRanking = setUserRanking
exports.deleteUserRanking = deleteUserRanking
exports.getAllUserRankings = getAllUserRankings
exports.getTopRankings = getTopRankings
exports.createUsers = createUsers
exports.clearUserRankings = clearUserRankings
