import Lazy from '.'

// tests require node.js>=12 for Array.prototype.flat
// TODO: should probably add some fuzzing tests with
// good output testing Array.prototype vs Lazy.prototype

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toIterateEqually(expected: Iterable<any>): R
      toBeUnreachable(): R
    }
  }
}

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

const lazy123 = Lazy.from({
  *[Symbol.iterator]() {
    yield 1
    yield 2
    yield 3
  },
}) as Lazy<number>

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyGenerator = (function* () {})()

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

describe('Lazy.prototype.filter', () => {
  it('smoke', () => {
    const array = [1, 2, 3].filter(x => x > 1)
    const lazy = Lazy.from([1, 2, 3].filter(x => x > 1))
    expect(lazy).toIterateEqually(array)
  })
})

describe('Lazy.prototype.map', () => {
  it('smoke', () => {
    const array = [1, 2, 3].map(x => x * 3)
    const lazy = Lazy.from([1, 2, 3].map(x => x * 3))
    expect(lazy).toIterateEqually(array)
  })
})

describe('Lazy.prototype.flat', () => {
  const source = [[], [1, 2, 3], [[4, 5], 6], 7]
  it('arbitrary-depth', () => {
    expect([...Lazy.from(source).flat(undefined)]).toEqual(
      source.flat(undefined)
    )
  })

  it('depth 1', () => {
    expect([...Lazy.from(source).flat()]).toEqual(source.flat())
  })

  it('depth 2', () => {
    expect([...Lazy.from(source).flat(2)]).toEqual(source.flat(2))
  })
})

describe('Lazy.prototype.concat', () => {
  it('items', () => {
    const array = [1, 2, 3].concat(1, 2, 3)
    const lazy = Lazy.from([1, 2, 3]).concat(1, 2, 3)
    expect(lazy).toIterateEqually(array)
  })

  it('lists', () => {
    const array = [1, 2, 3].concat([1, 2], [3])
    const lazy = Lazy.from([1, 2, 3]).concat([1, 2], [3])
    expect(lazy).toIterateEqually(array)
  })

  it('items and lists', () => {
    const array = [1, 2, 3].concat([1, 2], 3)
    const lazy = Lazy.from([1, 2, 3]).concat([1, 2], 3)
    expect(lazy).toIterateEqually(array)
  })
})

describe('Lazy.prototype.forEach', () => {
  it('items', () => {
    const array = [1, 2, 3]
    const lazy = lazy123
    const func = jest.fn()
    array.forEach(func)
    expect(func).toBeCalledTimes(array.length)
    func.mockReset()
    lazy.forEach(func)
    expect(func).toBeCalledTimes(3)
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

describe('Lazy.prototype.reduce', () => {
  it('smoke', () => {
    const lazy = Lazy.from([1, 2, 3])
    expect(lazy.reduce((acc, x) => acc + x, 10)).toEqual(16)
  })

  it('sum with initial', () => {
    const array = [1, 2, 3]
    const lazy = lazy123
    const args = [(acc: number, x: number) => acc + x, 10] as const
    expect(lazy.reduce(...args)).toEqual(array.reduce(...args))
  })

  it('sum without initial', () => {
    const array = [1, 2, 3]
    const lazy = lazy123
    const args = [(acc: number, x: number) => acc + x] as const
    expect(lazy.reduce(...args)).toEqual(array.reduce(...args))
  })

  it('indices', () => {
    const array = [1, 2, 3]
    const lazy = Lazy.from({
      *[Symbol.iterator]() {
        yield* [1, 2, 3]
      },
    })
    const args = [
      (acc: number[], _: any, i: number) => (acc ? [...acc, i] : [i]),
      [] as number[],
    ] as const
    expect(lazy.reduce(...args)).toEqual(array.reduce(...args))
  })
})

describe('Lazy.prototype.toSet', () => {
  it('smoke', () => {
    expect(Lazy.from([]).toSet() instanceof Set).toBeTruthy()
  })
})

describe('Lazy.prototype.toArray', () => {
  it('smoke', () => {
    expect(lazy123.toArray()).toIterateEqually([1, 2, 3])
  })
})

describe('Lazy.prototype.some', () => {
  const array_result = [1, 2, 3].some(x => x == 3)
  const lazy_result = Lazy.from([1, 2, 3]).some(x => x == 3)

  it('matches array', () => {
    expect(lazy_result).toEqual(array_result)
  })

  it('true', () => {
    expect(lazy_result).toBeTruthy()
  })

  it('false', () => {
    const lazy_false_result = Lazy.from([1, 2, 3]).some(x => x == 0)
    expect(lazy_false_result).toBeFalsy()
  })
})

describe('Lazy.prototype.every', () => {
  const array_result = [1, 2, 3].every(x => x >= 1)
  const lazy_result = Lazy.from([1, 2, 3]).some(x => x >= 1)

  it('matches array', () => {
    expect(lazy_result).toEqual(array_result)
  })

  it('true', () => {
    expect(lazy_result).toBeTruthy()
  })

  it('false', () => {
    const lazy_false_result = Lazy.from([1, 2, 3]).every(x => x != 3)
    expect(lazy_false_result).toBeFalsy()
  })
})

describe('Lazy.prototype.empty', () => {
  it('empty generator', () => {
    expect(Lazy.from(emptyGenerator).take(0).empty()).toBeTruthy()
  })

  it('empty array', () => {
    expect(Lazy.from([]).take(0).empty()).toBeTruthy()
  })

  it('empty set', () => {
    expect(Lazy.from(new Set<string>()).take(0).empty()).toBeTruthy()
  })

  it('take 0', () => {
    expect(Lazy.from([1]).take(0).empty()).toBeTruthy()
  })
})

describe('Lazy.prototype.sort', () => {
  const numeric = [23, 2, 5, 3, 10, -200]
  it('matches array default', () => {
    expect(Lazy.from(numeric).sort()).toIterateEqually(numeric.slice().sort())
  })

  it('matches array (a,b)=>a-b', () => {
    const cmp = (a: number, b: number) => a - b
    expect(Lazy.from(numeric).sort(cmp)).toIterateEqually(
      numeric.slice().sort(cmp)
    )
  })
})

describe('Lazy.prototype.length', () => {
  it('matches array', () => {
    const array = [1, 2, 3]
    expect(Lazy.from(array)).toHaveLength(array.length)
    expect(Lazy.from(array)).toHaveLength(3)
  })

  it('matches filtered array', () => {
    const array = new Array(100)
      .fill(undefined)
      .map((_, i) => i)
      .filter(x => x % 3 == 0)
    expect(Lazy.from(array)).toHaveLength(array.length)
  })

  it('matches constructed array', () => {
    const size = 100
    const array = new Array(size).fill(null)
    expect(Lazy.from(array).length).toEqual(array.length)
  })
})

describe('Lazy.prototype.includes', () => {
  const array = [1, 2, 3, 1, 1]
  it('from array', () => {
    expect(Lazy.from(array).includes(1)).toBeTruthy()
    expect(Lazy.from(array).includes(2)).toBeTruthy()
    expect(Lazy.from(array).includes(3)).toBeTruthy()
    expect(Lazy.from(array).includes(4)).toBeFalsy()
    expect(Lazy.from(array).includes(5)).toBeFalsy()
    expect(Lazy.from(array).includes(6)).toBeFalsy()
  })

  it('from generator', () => {
    expect(Lazy.from(lazy123).includes(1)).toBeTruthy()
    expect(Lazy.from(lazy123).includes(2)).toBeTruthy()
    expect(Lazy.from(lazy123).includes(3)).toBeTruthy()
    expect(Lazy.from(lazy123).includes(4)).toBeFalsy()
    expect(Lazy.from(lazy123).includes(5)).toBeFalsy()
    expect(Lazy.from(lazy123).includes(6)).toBeFalsy()
  })
})

describe('Lazy.zip', () => {
  const letters = ['a', 'b', 'c'] as (string | number)[]
  const numbers = [1, 2, 3] as (string | number)[]
  it('smoke', () => {
    const zipped = Lazy.zip(letters, numbers)
    const zipped_iter = zipped[Symbol.iterator]()

    const first = zipped_iter.next()
    expect(first.value).toEqual(['a', 1])

    const second = zipped_iter.next()
    expect(second.value).toEqual(['b', 2])

    const third = zipped_iter.next()
    expect(third.value).toEqual(['c', 3])

    const end = zipped_iter.next()
    expect(end.done).toBeTruthy()
  })
})
