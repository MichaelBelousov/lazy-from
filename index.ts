// Typescript@4.0 probably simplifies or allows better alternative typings for
// some of these

/** return whether arg is T or an iterable of T */
function isIterable<T>(arg: T | Iterable<T>): arg is Iterable<T> {
  return typeof arg === "object" && Symbol.iterator in arg;
}

/** iterable wrapper for functional programming with lazy composition */
export default class Lazy<T> implements Iterable<T> {
  static from<T>(iterable: Iterable<T>) {
    return new Lazy<T>(iterable);
  }

  public constructor(protected iterable: Iterable<T>) {}

  [Symbol.iterator](): Iterator<T> {
    return this.iterable[Symbol.iterator]();
  }

  public filter(predicate: (t: T) => boolean) {
    const _this = this;
    return Lazy.from({
      *[Symbol.iterator]() {
        for (const t of _this) if (predicate(t)) yield t;
      },
    });
  }

  public map<U>(transform: (t: T) => U) {
    const _this = this;
    return Lazy.from<U>({
      *[Symbol.iterator]() {
        for (const t of _this) yield transform(t);
      },
    });
  }

  public flat(
    this: Lazy<
      Iterable<
        Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<T>>>>>>>
      >
    >,
    depth: 7
  ): Lazy<T>;
  public flat(
    this: Lazy<
      Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<T>>>>>>>
    >,
    depth: 6
  ): Lazy<T>;
  public flat(
    this: Lazy<Iterable<Iterable<Iterable<Iterable<Iterable<Iterable<T>>>>>>>,
    depth: 5
  ): Lazy<T>;
  public flat(
    this: Lazy<Iterable<Iterable<Iterable<Iterable<Iterable<T>>>>>>,
    depth: 4
  ): Lazy<T>;
  public flat(
    this: Lazy<Iterable<Iterable<Iterable<Iterable<T>>>>>,
    depth: 3
  ): Lazy<T>;
  public flat(this: Lazy<Iterable<Iterable<Iterable<T>>>>, depth: 2): Lazy<T>;
  public flat(this: Lazy<Iterable<Iterable<T>>>, depth?: 1): Lazy<T>;
  public flat(this: Lazy<Iterable<T>>, depth: 0): Lazy<T>;
  public flat(depth?: number): Lazy<any>;
  /** @see Array.prototype.from */
  public flat(depth = 1) {
    const _this = this;
    if (depth <= 0) return this;
    else
      return Lazy.from({
        *[Symbol.iterator]() {
          for (const item of _this) {
            if (isIterable(item)) yield* Lazy.from(item).flat(depth - 1);
            else yield item;
          }
        },
      });
  }

  public concat(...args: (Iterable<T> | T)[]): Lazy<T> {
    const _this = this;
    return Lazy.from({
      *[Symbol.iterator]() {
        yield* _this;
        for (const arg of args)
          if (isIterable(arg)) yield* arg;
          else yield arg;
      },
    });
  }

  public forEach(doSomething: (t: T) => void) {
    for (const item of this) doSomething(item);
  }

  public take(n: number): Lazy<T> {
    const _this = this;
    return Lazy.from({
      *[Symbol.iterator]() {
        let i = 0;
        for (const item of _this) {
          if (!(i < n)) break;
          yield item;
          i++;
        }
      },
    });
  }

  public reduce<Result>(
    callback: (prev: Result, curr: T, index: number) => Result,
    initial?: Result
  ): Result {
    // FIXME: perhaps there's a better way to use typings here
    let result: Result = initial!;
    let i = 0;
    for (const curr of this) {
      if (i === 0 && initial === undefined) result = curr as any;
      else result = callback(result!, curr, i);
      i++;
    }
    return result;
  }

  public toSet(): Set<T> {
    const result = new Set<T>();
    for (const item of this) result.add(item);
    return result;
  }

  public toArray(): T[] {
    return [...this];
  }

  public some(predicate: (t: T) => boolean): boolean {
    for (const item of this) if (predicate(item)) return true;
    return false;
  }

  public every(predicate: (t: T) => boolean): boolean {
    return !this.some((t) => !predicate(t));
  }

  public empty(): boolean {
    const item = this[Symbol.iterator]().next();
    return !!item.done;
  }

  public sort(...[sortFunc]: Parameters<Array<T>["sort"]>) {
    return Lazy.from([...this].sort(sortFunc));
  }

  public get length() {
    let i = 0;
    for (const item of this) i++;
    return i;
  }

  public includes(t: T) {
    for (const item of this) if (item === t) return true;
    return false;
  }

  public find(predicate: (t: T) => boolean) {
    for (const item of this) if (predicate(item)) return item;
    return false;
  }
}
