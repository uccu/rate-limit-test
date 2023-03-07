'use strict';

const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('../redis')
const getRateLimiterFactory = require('./commons/RateLimiterFactory');
const util = require('./commons/utils');
const uuid = require('uuid');

exports.middleware = function middleware(options = {
    points: 60,
    duration: 60,
    name: 'rateLimit'
}) {

    const rateLimiterRedis = new RateLimiterRedis({
        storeClient: redis.get(),
        points: options.points,
        duration: options.duration,
    })
    return function () {
        return rateLimiterRedis.consume('test').then((res) => {
            return true;
        }).catch(e => {
            return false;
        })
    }
}


