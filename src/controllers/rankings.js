const { graphql } = require('graphql');
const { schema } = require('./graphql')

const query = `
query UserRankings($user_id: Int) {
  userRankings(prev_ranking_idIsNull: true, user_id: $user_id) {
    ...RankingFields
    ...RankingsRecursive
  }
}

fragment RankingsRecursive on UserRankings {
  nextRanking {
    ...RankingFields
    nextRanking {
      ...RankingFields
      nextRanking {
        ...RankingFields
        nextRanking {
          ...RankingFields
          nextRanking {
            ...RankingFields
            nextRanking {
              ...RankingFields
              nextRanking {
                ...RankingFields
                nextRanking {
                  ...RankingFields
                }
              }
            }
          }
        }
      }
    }
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

async function getUserRankings(ctx, next) {
  const { data } = await graphql(schema, query, null, null, {user_id: ctx.state.user.id})
  const flattenedUserRankings = flattenRankings(data.userRankings[0], [])
  ctx.body = flattenedUserRankings
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
