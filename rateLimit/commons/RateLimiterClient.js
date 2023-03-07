'use strict';
const getRateLimiterFactory = require('./RateLimiterFactory');
const { concatNameWithFields, concatFieldsValue } = require('./utils');

class RateLimiterClient {
  // 查询 rateLimiter 的配置信息
  // name 是限流器名称
  // fieldsValue：如果是 item 类型的限流器，则需要传递，此值为配置中 fields 对应的值。如 fields = ['id']，则 fieldsValue = [100032]
  async getRateLimiterSetting({ name, fieldsValue }) {
    let uniqueId = name;
    if (fieldsValue) {
      uniqueId = concatNameWithFields(name, this._handleFieldsValue(fieldsValue));
    }
    let setting = await getRateLimiterFactory()._getSettingFromRedis({ uniqueId });
    if (!setting) {
      setting = getRateLimiterFactory().getDefaultRateLimiterSetting({ uniqueId });
      if (setting) setting.isDefault = true;
    }
    return setting;
  }

  // 更新 rateLimiter 的配置信息
  // name 是限流器名称
  // fieldsValue：如果是 item 类型的限流器，则需要传递，此值为配置中 fields 对应的值。如 fields = ['id']，则 fieldsValue = [100032]
  async updateRateLimiterSetting({ name, fieldsValue, points, duration, expiredAt }) {
    let uniqueId = name;
    if (fieldsValue) {
      uniqueId = concatNameWithFields(name, this._handleFieldsValue(fieldsValue));
    }
    await getRateLimiterFactory().updateRate({ uniqueId, points, duration, expiredAt });
  }

  _handleFieldsValue(fieldsValue) {
    if (!Array.isArray(fieldsValue)) fieldsValue = [ fieldsValue ];
    return concatFieldsValue(fieldsValue);
  }
}

let clientInstance = null;
function getRateLimiterClient() {
  if (!clientInstance) {
    clientInstance = new RateLimiterClient();
  }
  return clientInstance;
}

module.exports = getRateLimiterClient;
