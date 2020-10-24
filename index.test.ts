
import Lazy from ".";

describe('Lazy.prototype.map', () => {
    it('smoke', () => {
        const iter = Lazy.from([1,2,3]).map(x => x*3)[Symbol.iterator]()
        expect(iter.next().value).toEqual(3)
        expect(iter.next().value).toEqual(6)
        expect(iter.next().value).toEqual(9)
        expect(iter.next().done).toEqual(true)
    })
})
