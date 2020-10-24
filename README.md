# lazy-from (Lazy.from)

Tired of `.filter().map()` allocating two whole arrays every time you
chain them? 
Tired of needing to convert all your iterables to an Array (with `Array.from` or spread syntax)
just to use `map`, `filter`, `concat`, `flat`, `includes`,  etc?

Use `Lazy.from`. It's just like `Array.from` but no conversion to arrays
and more features (`zip`, `toSet`, `take`, etc).

```JavaScript
Lazy.from([1,2,3])
    .map(x => x*3)
    .filter(x => x%2==0)
    .map(x => `${x}`)
    .concat([10, 11])
    .concat({ *[Symbol.iterator]() { yield 2; yield* "hello"; }})
```

- no dependencies (I might add an optional dependency of some typescript type helpers)
- written in TypeScript with well-cared-for types. Might add a version that doesn't require typescript@^4.0
- feel free to contribute fixes and new useful methods
- written using anonymous generator objects in JavaScript which make the codebase tiny and neat, check them out

