const sinon = require('sinon');
const {
  electWithSingleTransVote,
  electWithFibonacci,
  _: _election
} = require('../src/election')

describe('election', () => {
  describe('fib', () => {
    [
      [-1, 1],
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 5],
      [4, 8],
      [5, 13],
      [6, 21]
    ].forEach(([input, output]) => {
      it(`should output ${output} for input ${input}`, () => {
        expect(_election.fib(input)).toBe(output)
      })
    })
  })

  describe('firstPref', () => {
    [
      [{preferences: []}, undefined],
      [{preferences: ['a']}, 'a'],
      [{preferences: [1,2,3]}, 1],
      [{preferences: [6]}, 6],
      [{notPrefs: [2,3]}, undefined],
      [undefined, undefined],
      [null, undefined]
    ].forEach(([input, output]) => {
      it(`should output ${output} for input ${input}`, () => {
        expect(_election.firstPref(input)).toBe(output)
      })
    })
  })

  describe('collectVotes', () => {
    [
      [
        [{weight: 1, preferences: [0, 1]},
         {weight: 1, preferences: [0, 2, 1]},
         {weight: 1, preferences: [0, 1, 2]}],
        {"0": 3}
      ],
      [
        [{weight: 1, preferences: [0, 1, 2]},
         {weight: 1, preferences: [2, 1, 0]},
         {weight: 1, preferences: [1, 0, 2]}],
        {"0": 1, "1": 1, "2": 1}
      ],
      [
        [{weight: 0.5, preferences: [0, 1, 2]},
         {weight: 0.5, preferences: [1, 2, 0]},
         {weight: 1,   preferences: [1, 0, 2]}],
        {"0": 0.5, "1": 1.5}
      ],
    ].forEach(([input, output]) => {
      it(`should output ${output} for input ${input}`, () => {
        expect(_election.collectVotes(input)).toEqual(output)
      })
    })
  })
});
