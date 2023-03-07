"use strict";

const Redis = require('./redis');
const redisRateLimit = require('./rateLimit/redis');
const redisRateLimit2 = require('./rateLimit/redis2');
const memoryRateLimit = require('./rateLimit/memory');
const promise = require('bluebird');

async function main() {

    try {
        await Redis.init()

        const fn = redisRateLimit.middleware({
            points: 100,
            duration: 60,
            name: 'rate-limit'
        });


        const start = Date.now();
        let success = 0, failed = 0;
        let fns = [];
        for (let i = 0; i < 10000; i++) {

            let f = async function () {
                const result = await fn()
                if (result) {
                    success++
                } else {
                    failed++
                }
            }
            fns.push(
                f()
            )
        }

        await promise.all(fns)



        console.log(success, failed, (Date.now() - start) / 1000)

        process.exit();
    } catch (e) {
        console.log(e)
    }


}



async function main2() {

    try {
        await Redis.init()

        await promise.delay(1000)

        const fn = memoryRateLimit.middleware({
            points: 100,
            duration: 60,
            name: 'rate-limit'
        });

        await promise.delay(1000)

        const start = Date.now();
        let success = 0, failed = 0;
        let fns = [];
        for (let i = 0; i < 10000; i++) {

            let f = async function () {
                const result = await fn()
                if (result) {
                    success++
                } else {
                    failed++
                }
            }
            fns.push(
                f()
            )
        }

        await promise.all(fns)
        await promise.delay(1000)


        console.log(success, failed, (Date.now() - start) / 1000)

        process.exit();
    } catch (e) {
        console.log(e)
    }


}

async function main3() {

    try {
        await Redis.init()

        await promise.delay(1000)


        const fn = redisRateLimit2.middleware({
            points: 100,
            duration: 60,
            name: 'rate-limit'
        });

        await promise.delay(1000)

        const start = Date.now();
        let success = 0, failed = 0;
        let fns = [];
        for (let i = 0; i < 10000; i++) {

            let f = async function () {
                const result = await fn()
                if (result) {
                    success++
                } else {
                    failed++
                }
            }
            fns.push(
                f()
            )
        }

        await promise.all(fns)

        await promise.delay(1000)

        console.log(success, failed, (Date.now() - start) / 1000)

        process.exit();
    } catch (e) {
        console.log(e)
    }


}

async function main4() {

    try {
        await Redis.init()

        await promise.delay(1000)


        const fn = redisRateLimit2.middleware({
            points: 100,
            duration: 60,
            name: 'rate-limit-1'
        });

        const fn2 = redisRateLimit2.middleware({
            points: 100,
            duration: 60,
            name: 'rate-limit-2'
        });

        const fn3 = redisRateLimit2.middleware({
            points: 100,
            duration: 60,
            name: 'rate-limit-3'
        });

        await promise.delay(1000)

        const start = Date.now();
        let success = 0, failed = 0;
        let fns = [];
        for (let i = 0; i < 100000; i++) {

            let f = async function () {
                if (await fn()) {
                    success++
                    return
                }
                if (await fn2()) {
                    success++
                    return
                }
                if (await fn3()) {
                    success++
                    return
                }
                failed++
            }
            fns.push(
                f()
            )
        }

        await promise.all(fns)

        await promise.delay(1000)

        console.log(success, failed, (Date.now() - start) / 1000)

        process.exit();
    } catch (e) {
        console.log(e)
    }


}


main4();