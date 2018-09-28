const {Model, transaction} = require('objection')

class UserRanking extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'user_rankings'
  }

  static get softDelete() {
    return false
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
        list_id: {type: 'integer'},
      }
    };
  }

  static get relationMappings() {
    const Item = require('./Item');
    const User = require('./User');
    const List = require('./List');

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
      },
      list: {
        relation: Model.BelongsToOneRelation,
        modelClass: List,
        join: {
          from: 'user_rankings.list_id',
          to: 'lists.id'
        }
      }
    }
  }

  async moveAfter(prevItemId) {
    // Where prevId indicates rankingA.id...
    // rankingA <-- rankingC <--   ...   <-- this <-- rankingD
    //    becomes
    // rankingA <--   this   <-- rankingC <-- ... <-- rankingD

    if (prevItemId === this.item_id) {
      throw new Error("Cannot move item to be ranked after itself")
    }

    const rankingA = await UserRanking.query()
      .findOne({
        item_id: prevItemId,
        user_id: this.user_id,
        list_id: this.list_id
      })

    if (rankingA && rankingA.id === this.prev_ranking_id) {
      return this
    }

    if (prevItemId && !rankingA) {
      throw new Error(`No such previous ranking for item id ${prevItemId} exists.`)
    }

    return transaction(UserRanking.knex(), async (trx) => {
      const thisPrevRankingId = this.prev_ranking_id;

      // Unplug this from list
      await this.$query(trx)
        .patch({prev_ranking_id: null})

      // Attach rankingD to this.prev_ranking_id
      const res = await UserRanking.query(trx)
        .patch({prev_ranking_id: thisPrevRankingId})
        .where({
          prev_ranking_id: this.id,
          user_id: this.user_id,
          list_id: this.list_id
        }).returning('*')

      // Attach rankingC to this
      await UserRanking.query(trx)
        .patch({prev_ranking_id: this.id})
        .where({
          prev_ranking_id: rankingA ? rankingA.id : null,
          user_id: this.user_id,
          list_id: this.list_id
        })
        .andWhere('id', '!=', this.id)

      // Plug this back in at the new location
      await this.$query(trx)
        .patch({prev_ranking_id: rankingA ? rankingA.id : null})

      return this
    })
  }

  deleteFromList() {
    // rankingA <--   this  <-- rankingB
    // v Becomes v
    // rankingA <-- rankingB

    return transaction(UserRanking.knex(), async (trx) => {
      const thisPrevRankingId = this.prev_ranking_id

      // Unplug this from list
      await this.$query(trx)
        .patch({prev_ranking_id: null})

      await UserRanking.query(trx)
        .patch({prev_ranking_id: thisPrevRankingId})
        .where({
          prev_ranking_id: this.id,
          user_id: this.user_id
        })

      await this.$query(trx)
        .delete()
    })
  }

  static async insertAfter(prevItemId, graph) {
    // Where prevId indicates rankingA.id...
    // rankingA <-- rankingC
    // v Becomes v
    // rankingA <-- rankingB <-- rankingC

    const rankingA = await UserRanking.query()
      .findOne({
        item_id: prevItemId,
        user_id: graph.user_id,
        list_id: graph.list_id
      })

    return transaction(UserRanking.knex(), async (trx) => {
      // Create new ranking
      const rankingB = await UserRanking.query(trx)
        .insert({
          user_id: graph.user_id,
          item_id: graph.item_id,
          list_id: graph.list_id
        })

      // Attach rankingC after new ranking
      await UserRanking.query(trx)
        .patch({prev_ranking_id: rankingB.id})
        .where({
          prev_ranking_id: rankingA ? rankingA.id : null,
          user_id: graph.user_id,
          list_id: graph.list_id
        })
        .andWhere('id', '!=', rankingB.id)

      // Plug new ranking into list after rankingA
      if (rankingA) {
        await rankingB.$query(trx)
          .patch({prev_ranking_id: rankingA.id})
      }

      return rankingB
    })
  }
}

module.exports = UserRanking
