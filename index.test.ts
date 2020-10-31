import Lazy from '.'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toIterateEqually(expected: Iterable<any>): R
      toBeUnreachable(): R
    }
  }
}

// extend an expect matcher "toBeUnreachable"
expect.extend({
  toIterateEqually(received: Iterable<any>, expected: Iterable<any>) {
    const received_iter = received[Symbol.iterator]()
    const expected_iter = expected[Symbol.iterator]()
    let iter_count = 0
    const MAX_ITER_COUNT = 10000
    while (iter_count < MAX_ITER_COUNT) {
      const received_item = received_iter.next()
      const expected_item = expected_iter.next()
      if (
        received_item.value !== expected_item.value ||
        received_item.done !== expected_item.done
      ) {
        return {
          message: () =>
            `index ${iter_count} had differing values \`${received_item.value}\` (received) and \`${expected_item.value}\` (expected)`,
          pass: false,
        }
      }
      if (received_item.done && expected_item.done) break
      iter_count++
      if (iter_count >= MAX_ITER_COUNT) throw Error('potentially iterable')
    }
    // pass must be true if we get here
    return {
      message: () => `expected iterators to not be the same`,
      pass: true,
    }
  },
  // TODO: needs to be fixed to not have any arguments
  toBeUnreachable() {
    return {
      message: () => `unreachable code was reached`,
      pass: false,
    }
  },
})

describe('Lazy', () => {
  it('iterable can reiterate', () => {
    const iterable = {
      *[Symbol.iterator]() {
        yield 2
        yield 'hello'
      },
    }
    const lazy = Lazy.from(iterable)
    expect(lazy).toIterateEqually([2, 'hello'])
    expect(lazy).toIterateEqually([2, 'hello'])
  })
})

describe('Lazy.prototype.map', () => {
  it('smoke', () => {
    const iterator = Lazy.from([1, 2, 3])
      .map((x) => x * 3)
      [Symbol.iterator]()
    expect(iterator.next().value).toEqual(3)
    expect(iterator.next().value).toEqual(6)
    expect(iterator.next().value).toEqual(9)
    expect(iterator.next().done).toEqual(true)
  })
})

describe('Lazy.prototype.filter', () => {
  it('smoke', () => {
    const iterator = Lazy.from([1, 2, 3])
      .map((x) => x * 3)
      [Symbol.iterator]()
    expect(iterator.next().value).toEqual(3)
    expect(iterator.next().value).toEqual(6)
    expect(iterator.next().value).toEqual(9)
    expect(iterator.next().done).toEqual(true)
  })
})

describe('Lazy.prototype.take', () => {
  it('from infinite', () => {
    const naturals = {
      *[Symbol.iterator]() {
        for (let i = 0; true; i++) yield i
      },
    }
    const size = 1000
    const lazy = Lazy.from(naturals).take(size)
    expect(Array.from(lazy)).toHaveLength(size)
  })
})

describe('Lazy.prototype.length', () => {
  it('from array', () => {
    const size = 100
    const array = new Array(size).fill(null)
    expect(Lazy.from(array).length).toEqual(array.length)
  })
})
