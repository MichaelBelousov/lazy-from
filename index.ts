// Typescript@4.0 probably simplifies or allows better alternative typings for
// some of these

/** return whether arg is T or an iterable of T */
function isIterable<T>(arg: T | Iterable<T>): arg is Iterable<T> {
  return typeof arg === 'object' && Symbol.iterator in arg
}

/** iterable wrapper for functional programming with lazy composition */
export default class Lazy<T> implements Iterable<T> {
  static from<T>(iterable: Iterable<T>): Lazy<T> {
    return new Lazy<T>(iterable)
  }

  public constructor(protected iterable: Iterable<T>) {}

  [Symbol.iterator](): Iterator<T> {
    return this.iterable[Symbol.iterator]()
  }

  public filter<U extends T>(predicate: (t: T) => t is U): Lazy<U> {
    const _this = this
    return Lazy.from({
      *[Symbol.iterator]() {
        for (const t of _this) if (predicate(t)) yield t
      },
    })
  }

  public map<U>(transform: (t: T) => U): Lazy<U> {
    const _this = this
    return Lazy.from<U>({
      *[Symbol.iterator]() {
        for (const t of _this) yield transform(t)
      },
    })
  }

  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<U>>>>>>>>>, depth: 7): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<U>>>>>>>>, depth: 6): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<U>>>>>>>, depth: 5): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<Iterable<Iterable<Iterable<U>>>>>>, depth: 4): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<Iterable<Iterable<U>>>>>, depth: 3): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<Iterable<U>>>>, depth: 2): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<Iterable<U>>>, depth?: 1): Lazy<U>;
  // prettier-ignore
  public flat<U>(this: Lazy<Iterable<U>>, depth: 0): Lazy<U>;
  public flat(depth?: number): Lazy<any>
  public flat(depth = 1): Lazy<any> {
    const _this = this
    Array.prototype.flat
    if (depth <= 0) return this
    else
      return Lazy.from({
        *[Symbol.iterator]() {
          for (const item of _this) {
            if (isIterable(item)) yield* Lazy.from(item).flat(depth - 1)
            else yield item
          }
        },
      })
  }

  public concat(...args: (Iterable<T> | T)[]): Lazy<T> {
    const _this = this
    return Lazy.from({
      *[Symbol.iterator]() {
        yield* _this
        for (const arg of args)
          if (isIterable(arg)) yield* arg
          else yield arg
      },
    })
  }

  public forEach(doSomething: (t: T) => void): void {
    for (const item of this) doSomething(item)
  }

  public take(n: number): Lazy<T> {
    const _this = this
    // NOTE: perhaps (function*(){}()) is more idiomatic than {*[Symbol.iterator](){}}?
    return Lazy.from({
      *[Symbol.iterator]() {
        let i = 0
        for (const item of _this) {
          if (!(i < n)) break
          yield item
          i++
        }
      },
    })
  }

  // TODO: add reduceRight
  // TODO: allow a reference to the iterable as the 4th callback
  // arg like Array.prototype.reduce
  public reduce(callback: (prev: T, curr: T, index: number) => T): T
  public reduce(callback: (prev: T, curr: T, index: number) => T, initial: T): T
  public reduce<Result>(
    callback: (prev: Result, curr: T, index: number) => Result,
    initial: Result
  ): Result
  public reduce<Result>(
    callback: (prev: Result, curr: T, index: number) => Result
  ): Result
  public reduce<Result>(
    callback: (prev: Result, curr: T, index: number) => Result,
    initial?: Result
  ): Result {
    // FIXME: perhaps there's a better way to use typings here
    let result: Result = initial!
    let i = 0
    for (const curr of this) {
      if (i === 0 && initial === undefined) result = curr as any
      else result = callback(result!, curr, i)
      i++
    }
    return result
  }

  public toSet(): Set<T> {
    const result = new Set<T>()
    for (const item of this) result.add(item)
    return result
  }

  public toArray(): T[] {
    return [...this]
  }

  public some(predicate: (t: T) => boolean): boolean {
    for (const item of this) if (predicate(item)) return true
    return false
  }

  public every(predicate: (t: T) => boolean): boolean {
    return !this.some(t => !predicate(t))
  }

  public empty(): boolean {
    for (const _ of this) return false
    return true
  }

  public sort(...[sortFunc]: Parameters<Array<T>['sort']>): Lazy<T> {
    return Lazy.from([...this].sort(sortFunc))
  }

  public get length(): number {
    let i = 0
    for (const _ of this) i++
    return i
  }

  public includes(t: T): boolean {
    for (const item of this) if (item === t) return true
    return false
  }

  public find(predicate: (t: T) => boolean): T | undefined {
    for (const item of this) if (predicate(item)) return item
  }
}
