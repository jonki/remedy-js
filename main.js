const docString = `
I'm just having fun here, trying to imitate Clojure Fulcro
in JavaScript. It may be interesting someday.

Basically the idea is to have graph DB, and data-based
query language, that allows to query it as deeply, and
having as many joins, as you want.

There are idents, and collections of this idents. Idents
allow queries to be implemented simply as obj access.

You make all operations on write, and then reads should be
super-duper fast. Because you keep data once, and then you
just create collections of idents, writes shouldn't be that
expensive, most times

Next step is to add mutations mechanisms, and make DB
nicely observable (meaning it should inform about changes in it),
as every nice DB should be
`

const defaults = {
    string: Symbol('string'),
    number: Symbol('number'),
    obj: Symbol('obj'),
    arr: Symbol('arr'),
    map: Symbol('map'),
    set: Symbol('set'),
    symbol: Symbol('symbol')
}

const db = {
    uiPeople: [{personById: 1}, {personById: 2}, {personById: 3}, {personById: 4}],
    otherPeople: [{personById: 2}, {personById: 3}],
    personById: {
        1: {name: 'Zofia', ego: 'huge'},
        2: {name: 'Janek', ego: 'huge',
            friends: [{personById: 1}, {personById: 4}, {personById: 2}]},
        3: {name: 'Halyna', ego: 'medium'},
        4: {name: 'Duhast', ego: 'dope',
            friends: [{personById: 1}, {petById: 1}]},
    },
    petById: {
        1: {name: 'hello', race: 'dog'}
    },
    nicePets: [{petById: 1}, {petById: 2}]
}

const stop = Symbol('stop')

const notFound = Symbol('not-found')

const defaultRace = Symbol()

const query = {
    otherPeople: { name: defaults.string,
                   friends: { friends: { race: defaultRace, name: defaults.string, ego: defaults.number },
                              ego: defaults.number }
                 },
    nicePets: { race: defaultRace }
}

const notFoundValues = {
    [defaults.string]: 'string that was not found',
    [defaultRace]: 'doggy dog'
}

const collectionsToData = (db, collections, notFoundValues) => {
    return collections.map(
        ([collection, qKeys]) => {
            const result = collection.map(item => {
                const [key] = Object.keys(item)
                const [value] = Object.values(item)

                const collectionFromDb = db[key]
                const ret = collectionFromDb[value]

                if (!ret) {
                    console.error(`You've queried for item: { ${key}: ${value} }, that is not located in your DB`)

                    return notFound
                }

                const retrievedValues = Object.keys(qKeys)
                      .map(qKey => [qKey, ret[qKey], qKeys[qKey]])

                return retrievedValues
                    .reduce((acc, [objKey, maybeValue, valueSym]) => {

                        if (maybeValue) {
                            if (Array.isArray(maybeValue)) {
                                const stepFurther = collectionsToData(
                                    db, [[maybeValue].concat([qKeys[objKey]])], notFoundValues)[0]

                                return Object.assign(acc, {[objKey]: stepFurther})
                            }

                            return Object.assign(acc, {[objKey]: maybeValue})
                        }

                        if (typeof valueSym === 'symbol') {
                            // we're quering for single value, and we did not found it
                            return Object.assign(acc, {[objKey]: notFoundValues[valueSym] || valueSym})
                        }

                        // we're quering for collection, and we did not found it
                        return Object.assign(acc, {[objKey]: notFound})
                    }, {})
            })

            return result
        }
    )
}

const doQuery = (db, query, notFoundValues) => {
    const keys = Object.keys(query)
    const collections = keys.map(k => [db[k], query[k]])

    return collectionsToData(db, collections, notFoundValues)
}

doQuery(db, query, notFoundValues)
