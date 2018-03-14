const sinon = require('sinon');

describe('hello', () => {
  const hello = sinon.stub().returns('Hello, beautiful!');

  it('should say hello', () => {
    expect(hello()).toBe('Hello, beautiful!');
  });
});
