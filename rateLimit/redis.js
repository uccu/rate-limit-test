'use strict';

const redis = require('../redis')
const getRateLimiterFactory = require('./commons/RateLimiterFactory');
const util = require('./commons/utils');
const uuid = require('uuid');

exports.middleware = function middleware(options = {
    points: 60,
    duration: 60,
    name: 'rateLimit'
}) {

    const keyPrefix = 'rateLimit';
    const factory = getRateLimiterFactory({
        storeClient: redis.get(),
        keyPrefix,
    });

    const { points, duration } = options;

    // 注册默认的配置信息
    factory.registerDefaultRateLimiterSetting({ uniqueId: options.name, points, duration });

    return async function rateLimiter() {
        try {
            const uniqueId = util.concatNameWithFields(options.name, util.concatFieldsValue([1, 2]));
            const rateLimiterRedis = await factory.getOrCreateLimiter({ uniqueId: uniqueId, points, duration });
            await rateLimiterRedis.consume(uniqueId);
            return true;
        } catch (rejRes) {
            return false;
        }
    };
}


