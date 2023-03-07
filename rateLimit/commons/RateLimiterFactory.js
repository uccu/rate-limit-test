'use strict';
const { RateLimiterRedis } = require('rate-limiter-flexible');
const LRU = require('lru-cache');
const { getNameByUniqueId } = require('./utils');

const options = {
  max: 1000, // 最大 1000 个限流器
  maxAge: 5 * 60 * 1000, // 最长存活时间 5 分钟
};
const defaultExpireMillSec = 30 * 24 * 60 * 60 * 1000;

class RateLimiterFactory {
  constructor({ storeClient, keyPrefix }) {
    this.storeClient = storeClient;
    this.redisClient = storeClient;
    this.keyPrefix = keyPrefix;
    this.limiterCache = new LRU(options);
    this.defaultLimiterSetting = new LRU({ max: 1000 });
  }

  // 在 Factory 中注册限流器
  async registerLimiter({ uniqueId, points, duration, expiredAt }) {
    const opts = {
      storeClient: this.storeClient,
      keyPrefix: this.keyPrefix,
      points, // 可用令牌数
      duration, // 时间段，单位 s
    };
    const rateLimiterRedis = new RateLimiterRedis(opts);
    this.limiterCache.set(this._buildSettingKey(uniqueId), rateLimiterRedis);
    await this._updateSettingToRedis({ uniqueId, points, duration, expiredAt });
    return rateLimiterRedis;
  }

  // 获取限流器
  getLimiter({ uniqueId }) {
    return this.limiterCache.get(this._buildSettingKey(uniqueId));
  }

  /**
   * 获取或创建限流器
   * @return {RateLimiterRedis}
   */
  async getOrCreateLimiter({ uniqueId }) {
    const limiter = this.getLimiter({ uniqueId });
    if (limiter) return limiter;

    // 当本地限流器配置过期时，从 redis 中获取限流器的最新配置信息
    // 如果 redis 中配置信息过期，则采用接口中配置的默认设置
    const storeInfo = await this._getSettingFromRedis({ uniqueId }) || {};
    const defaultSetting = this.getDefaultRateLimiterSetting({ uniqueId });
    await this.registerLimiter({ uniqueId, ...defaultSetting, ...storeInfo });
    return this.getLimiter({ uniqueId });
  }

  // 更新限流器的配置信息
  async updateRate({ uniqueId, points, duration, expiredAt }) {
    const limiter = await this.registerLimiter({ uniqueId, points, duration, expiredAt });
    // 删除当前的限流信息
    this.storeClient.del(`${this.keyPrefix}:${uniqueId}`);
    return limiter;
  }

  // 构建 limiter 配置的 key
  _buildSettingKey(uniqueId) {
    return `${this.keyPrefix}:setting:${uniqueId}`;
  }

  // 从 redis 中获取限流器的配置信息
  async _getSettingFromRedis({ uniqueId }) {
    const result = await this.redisClient.get(this._buildSettingKey(uniqueId));
    return result ? JSON.parse(result) : null;
  }

  // 更新 redis 中的限流器的配置信息，默认配置信息生效 30 天
  async _updateSettingToRedis({ uniqueId, points, duration, expiredAt }) {
    const currentTime = new Date().getTime();
    if (!expiredAt) expiredAt = new Date(currentTime + defaultExpireMillSec);
    const diffMillSec = new Date(expiredAt).getTime() - currentTime;
    if (diffMillSec < 0) throw new Error('不能设置过去的日期为过期时间');
    await this.redisClient.set(this._buildSettingKey(uniqueId), JSON.stringify({ points, duration, expiredAt }), 'PX', diffMillSec);
  }

  // 注册默认的限流器配置信息
  registerDefaultRateLimiterSetting({ uniqueId, points, duration }) {
    const setting = this.getDefaultRateLimiterSetting({ uniqueId });
    if (setting) throw new Error('限流器名称不能重复');
    this.defaultLimiterSetting.set(this._buildSettingKey(getNameByUniqueId(uniqueId)), { points, duration });
  }

  // 获取默认的限流器配置信息
  getDefaultRateLimiterSetting({ uniqueId }) {
    return this.defaultLimiterSetting.get(this._buildSettingKey(getNameByUniqueId(uniqueId)));
  }
}



let factoryInstance = null;

/**
 * 
 * @return {RateLimiterFactory}
 */
function getRateLimiterFactory({ storeClient, keyPrefix } = {}) {
  if (!factoryInstance) {
    factoryInstance = new RateLimiterFactory({ storeClient, keyPrefix });
  }
  return factoryInstance;
}

module.exports = getRateLimiterFactory;
