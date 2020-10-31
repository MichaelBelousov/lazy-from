import Lazy from ".";

// extend an expect matcher "toBeUnreachable"

describe("Lazy", () => {
  it("iterable can reiterate", () => {
    const iterable = {
      *[Symbol.iterator]() {
        yield 2;
        yield "hello";
      },
    };
    const lazy = Lazy.from(iterable);
    let i = 0;
    for (const x of lazy) {
      if (i == 0) expect(x).toEqual(2);
      if (i == 1) expect(x).toEqual(2);
      else expect("reached").toEqual("unreachable"); // should be unreachable
      i++;
    }
    i = 0;
    for (const x of lazy) {
      if (i == 0) expect(x).toEqual(2);
      if (i == 1) expect(x).toEqual(2);
      else expect("reached").toEqual("unreachable"); // should be unreachable
      i++;
    }
  });
});

describe("Lazy.prototype.map", () => {
  it("smoke", () => {
    const iterator = Lazy.from([1, 2, 3])
      .map((x) => x * 3)
      [Symbol.iterator]();
    expect(iterator.next().value).toEqual(3);
    expect(iterator.next().value).toEqual(6);
    expect(iterator.next().value).toEqual(9);
    expect(iterator.next().done).toEqual(true);
  });
});

describe("Lazy.prototype.take", () => {
  it("from infinite", () => {
    const naturals = {
      *[Symbol.iterator]() {
        for (let i = 0; true; i++) yield i;
      },
    };
    const iterable = Lazy.from(naturals).take(1000);
    expect(iterable.next().done).toEqual(true);
  });
});

describe("Lazy.prototype.length", () => {
  it("from array", () => {
    const size = 100;
    const array = new Array(size).fill(null);
    expect(Lazy.from(array).length).toEqual(array.length);
  });
});
