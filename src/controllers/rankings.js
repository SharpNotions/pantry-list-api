const { graphql } = require('graphql')
const { schema }  = require('./graphql')
const { pathOr }  = require('ramda');

const query = (depth) => {
  const recursiveRankings = generateRankingsRecursive(depth)
  return `
    query UserRankings($user_id: Int) {
      userRankings(prev_ranking_idIsNull: true, user_id: $user_id) {
        ...RankingFields
        ${recursiveRankings}
      }
    }

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
}

async function getUserRankings(ctx, next) {
  const depth = pathOr(10, ['request', 'query', 'depth'], ctx)
  const { data } = await graphql(schema, query(depth), null, null, {user_id: 1})
  const flattenedUserRankings = flattenRankings(data.userRankings[0], [])
  ctx.body = flattenedUserRankings
}

function generateRankingsRecursive(n) {
  if (n === 1) {
    return 'nextRanking { ...RankingFields }'
  }
  return `nextRanking { ...RankingFields ${generateRankingsRecursive(n - 1)}}`
}

function flattenRankings(currentItem, rankings) {
  if (!currentItem.nextRanking) {
    return [currentItem.item, ...rankings]
  } else {
    rankings = [currentItem.item, ...rankings]
    return flattenRankings(currentItem.nextRanking, rankings)
  }
}

exports.getUserRankings = getUserRankings
