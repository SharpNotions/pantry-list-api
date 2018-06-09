# pantry-list-api

> A Koa backend for the Pantry List app.

## Developing Locally

```bash
yarn
yarn start-dev
```

Server listens on port 4000.

Testing: `yarn test-watch`

### GraphQL
`/graphiql` is enabled on dev and prod

## Deployments

Heroku automatically:
* Deploys new pushes to `master` to https://pantry-list-api.herokuapp.com.
* Runs tests for any branch push.

## Docker
https://hub.docker.com/r/sharpnotionsllc/pantry-list-api/

1. copy your npmrc file to dir `cp ~/.npmrc .`

```bash
docker-compose up
```
* open [localhost:4000](http://localhost:4000)

## Database Miscellanea

For developing against a local db:
```
psql
CREATE DATABASE pantry_list;
CREATE DATABASE pantry_list_test;
```

### Create migration
```
yarn create-migration -- <migration name>
```

### Run migrations
```
yarn migrate

yarn migrate -- --env test
```

### Rollback migrations
```
yarn migrate-rollback
```
