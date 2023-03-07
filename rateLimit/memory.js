'use strict';

const { RateLimiterMemory } = require('rate-limiter-flexible');
const redis = require('../redis')
const util = require('./commons/utils');
const uuid = require('uuid');

exports.middleware = function middleware(options = {
    points: 60,
    duration: 60,
    name: 'rateLimit'
}) {
    const rateLimiterMemory = new RateLimiterMemory({
        points: options.points,
        duration: options.duration,
    })
    return function () {
        return rateLimiterMemory.consume('test').then((res) => {
            return true;
        }).catch(e => {
            return false;
        })
    }

}


