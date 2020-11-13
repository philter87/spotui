import {assert } from "chai";
import {describe} from "mocha";
import {Drop, Get, join} from "../src/drop";


describe('Store tests', () => {
    it('Initial value', () => {
        const expected = 'Hello';
        const store = new Drop(expected);

        store.subscribe(val => assert.equal(val, expected));
    })
    it('Set', () => {
        const expected = 'ValueIsSet';
        const store = new Drop('');

        store.set(expected);

        store.subscribe(val => assert.equal(val, expected));
    })
    it('Update', () => {
        const expected = 1 + 10;
        const store = new Drop(1);

        store.update( val => val+10);

        store.subscribe( val =>  assert.equal(val, expected));
    })
    it('Set multiple times', () => {
        const values = [];
        const store = new Drop(0);
        store.subscribe( val => {
            values.push(val);
        });

        store.set(1);
        store.set(2);

        assert.deepEqual(values, [0, 1, 2]);
    })
    it('Unsubscribe', () => {
        const values = [];
        const store = new Drop(0);
        const unsubscribe = store.subscribe( val => {
            values.push(val);
        });
        store.set(1);

        unsubscribe();
        store.set(2);

        assert.deepEqual(values, [0, 1]);
    })
    it('map: operator', () => {
        const expected = "count: 0";
        const store = new Drop(0);
        const readStore = store.map(num => "count: " + num);
        readStore.subscribe( val => assert.equal(val, expected));
    })
    it('join operator', () => {
        const source1 = new Drop(5);
        const source2 = new Drop(5);
        const joined = join(get => get(source1) + get(source2));
        let actualValue;

        joined.subscribe( val => actualValue = val);

        assert.equal(actualValue, 10);
        source1.set(10)
        assert.equal(actualValue, 15);
        source2.set(10)
        assert.equal(actualValue, 20);
    })
    it('join operator - unsubscribe', () => {
        const expected = 2;
        const source1 = new Drop(1);
        const source2 = new Drop(1);
        const joined = join(get => get(source1) + get(source2));
        let actualValue;

        const unsubscribe = joined.subscribe( val => actualValue = val);

        assert.equal(actualValue, 2);
        unsubscribe()
        source1.set(10)
        source2.set(10)

        assert.equal(actualValue, 2, "actualValue is still 2, because we unsubscribed before settings sourc1 and source2");
    })
})