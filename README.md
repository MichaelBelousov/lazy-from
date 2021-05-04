# lazy-from (Lazy.from)

Tired of needing to convert all your iterables to an Array (with `Array.from` or spread syntax)
just to use `map`, `filter`, `concat`, `flat`, `includes`,  etc?
Maybe `.filter().map()` is allocating extra arrays every time you
chain them and you have like a billion elements so that's slow?

Use `Lazy.from`. It's just like `Array.from` but no conversion to arrays
and more features (`zip`, `toSet`, `take`, plus more).

```JavaScript
Lazy.from([1,2,3])
    .map(x => x*3)
    .filter(x => x%2==0)
    .map(x => `${x}`)
    .concat([10, 11])
    .concat((function*(){ yield 2; yield* "hello"; })())
```

- no dependencies (I might add an optional dependency of some typescript type helpers)
- written in TypeScript with well-cared-for types. Might add a version that doesn't require typescript@^4.0
- feel free to contribute fixes and new useful methods
- written using anonymous generator objects in JavaScript which make the codebase tiny and neat, check them out

## Disclaimer

Don't expect performance to be better! `.filter`/`.map` is commonly hyper-optimized by the runtime so
it can very easily out perform custom generator code. In some cases yes, this can be more performant,
but generally if you're looking for performance, not ergonomics, try to use `Array.prototype` functions
well for high performance.
