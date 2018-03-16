# pantry-list-api

> A Koa backend for the Pantry List app.

## Developing Locally

```bash
yarn
yarn start-dev
```

Server listens on port 4000.

Testing: `yarn test-watch`

## Deployments

Heroku automatically:
* Deploys new pushes to `master` to https://pantry-list-api.herokuapp.com.
* Runs tests for any branch push.

## Docker

1. copy your npmrc file to dir `cp ~/.npmrc .`

```bash
docker-compose up
```
* open [localhost:4000](localhost:4000)
