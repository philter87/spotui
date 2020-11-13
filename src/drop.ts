export interface Unsubscribe {
    (): void;
}

export interface Subscriber<T> {
    (value: T) : void;
}
export interface Get {
    <T> (subscribable: Subscribable<T>) : T
}

interface Subscribable<T> {
    subscribe(subscriber: Subscriber<T>): Unsubscribe;
}

const mapFunc = <T,R>(source: Subscribable<T>, mapperFunction: (value: T) => R) => {
    return new ReadDrop<R>(subscriber => {
        return source.subscribe( val => subscriber(mapperFunction(val)))
    })
}

class ReadDrop<T> implements Subscribable<T>{
    private _subscribe: (subscriber: Subscriber<T>) => Unsubscribe;

    constructor( subscribe: (subscriber: Subscriber<T>) => Unsubscribe) {
        this._subscribe = subscribe;
    }

    subscribe(subscriber: Subscriber<T>): Unsubscribe {
        return this._subscribe(subscriber);
    }

    map<R>(mapperFunction: (value: T) => R) {
        return mapFunc(this, mapperFunction);
    }
}

export const join = <R>(joinFunction: (get: Get) => R) => {
    return new ReadDrop<R>(observer => {
        let areAllSubscribersInitialized = false;
        const values = [];
        const unsubscribes: Unsubscribe[] = [];
        let index = 0;
        const get = <Q>(s: Subscribable<Q>) => {
            const currentIndex = index++;
            if(!areAllSubscribersInitialized){
                unsubscribes[currentIndex] = s.subscribe( val => {
                    values[currentIndex] = val;
                    if(areAllSubscribersInitialized) {
                        index = 0;
                        observer(joinFunction(get))
                    }
                });
            }
            return values[currentIndex];
        }
        observer(joinFunction(get))
        areAllSubscribersInitialized = true;
        return () => unsubscribes.forEach( unsub => unsub());
    })
}

export class Drop<T> implements Subscribable<T> {
    private value: T;
    private subscribers: Subscriber<T>[];

    constructor(value: T) {
        this.value = value;
        this.subscribers = [];
    }

    subscribe(subscriber: (value: T) => void): Unsubscribe {
        subscriber(this.value);
        const index = this.subscribers.push(subscriber);
        return () => delete this.subscribers[index-1];
    }

    set(value: T) {
        this.value = value;
        this.subscribers.forEach(o => o && o(this.value));
    }

    update(updateFunction: (currentValue: T) => T) {
        this.set(updateFunction(this.value))
    }

    map<R>(mapperFunction: (value: T) => R) {
        return mapFunc(this, mapperFunction);
    }

}
