const {Model, transaction} = require('objection')

class UserRanking extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'user_rankings'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['item_id', 'user_id'],
      properties: {
        id: {type: 'integer'},
        item_id: {type: 'integer'},
        user_id: {type: 'integer'},
        prev_ranking_id: {type: ['integer', null]},
      }
    };
  }

  static get relationMappings() {
    const Item = require('./Item');
    const User = require('./User');

    return {
      item: {
        relation: Model.BelongsToOneRelation,
        modelClass: Item,
        join: {
          from: 'user_rankings.item_id',
          to: 'items.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_rankings.user_id',
          to: 'users.id'
        }
      },
      prevRanking: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserRanking,
        join: {
          from: 'user_rankings.prev_ranking_id',
          to: 'user_rankings.id'
        }
      },
      nextRanking: {
        relation: Model.HasOneRelation,
        modelClass: UserRanking,
        join: {
          from: 'user_rankings.id',
          to: 'user_rankings.prev_ranking_id'
        }
      }
    }
  }

  moveAfter(prevId) {
    // Where prevId indicates rankingA.id...
    // rankingA --> rankingC -->   ...   --> this --> rankingD
    //    becomes
    // rankingA -->   this   --> rankingC --> ... --> rankingD

    if (prevId === this.id) {
      throw new Error("Cannot move ranking after itself")
    }

    if (prevId === this.prev_ranking_id) {
      return this;
    }

    return transaction(UserRanking.knex(), async (trx) => {
      const [rankingA] = await UserRanking.query(trx)
        .where('id', prevId)
        .andWhere('user_id', this.user_id)

      if (prevId && !rankingA) {
        throw new Error('No such previous ranking exists.')
      }

      const [rankingC] = await UserRanking.query(trx)
        .where('prev_ranking_id', prevId)
        .andWhere('user_id', this.user_id)

      const [rankingD] = await UserRanking.query(trx)
        .where('prev_ranking_id', this.id)
        .andWhere('user_id', this.user_id)

      if (rankingD) {
        // Unplug this from list
        await rankingD.$query(trx)
          .patch({prev_ranking_id: this.prev_ranking_id})
      }

      if (rankingC) {
        // Attach rankingC to this
        await rankingC.$query(trx)
          .patch({prev_ranking_id: this.id})
      }

      // Plug it back in at the new location
      await this.$query(trx)
        .patch({prev_ranking_id: prevId})

      return this;
    })
  }

  static async insertAfter(prevId, graph) {
    // Where prevId indicates rankingA.id...
    // rankingA --> rankingC
    // v Becomes v
    // rankingA --> rankingB --> rankingC

    return transaction(UserRanking.knex(), async (trx) => {
      const [rankingA] = await UserRanking.query(trx)
        .where('id', prevId)
        .andWhere('user_id', graph.user_id)

      if (prevId && !rankingA) {
        throw new Error('No such previous ranking exists.')
      }

      const [rankingC] = await UserRanking.query(trx)
        .where('prev_ranking_id', prevId)
        .andWhere('user_id', graph.user_id)

      // Plug new ranking into list
      const rankingB = await UserRanking.query(trx)
        .insert({
          ...graph,
          prev_ranking_id: prevId
        })

      // Attach rankingC to this
      if (rankingC) {
        await rankingC.$query(trx)
          .patch({prev_ranking_id: rankingB.id})
      }

      return rankingB
    })

    // await UserRanking.query().upsertGraph({
    //   ...graph,
    //   '#id': 'the-new-user_ranking'
    //   prevRanking: {
    //     id: prevId
    //   },
    //   nextRanking: {
    //     prevRanking: {
    //       '#ref': 'the-new-user-ranking'
    //     }
    //   }
    // })
  }
}

module.exports = UserRanking
