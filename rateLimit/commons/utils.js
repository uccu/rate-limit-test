'use strict';
const delimiter = '%%%';

// 限流的 uniqueId 根据当前接口的 method + 路由 + fields 构建
function buildUniqueKey(ctx, option) {
  const matchedRoute = option.matchedRoute || ctx._matchedRoute;
  const matchedMethod = (option.matchedMethod || ctx.method).toLowerCase();
  let transferPath = matchedRoute.replace(/:/g, '$').replace(/\//g, ':');
  transferPath = transferPath.slice(1, transferPath.length);
  if (transferPath.endsWith(':')) {
    transferPath = transferPath.slice(0, transferPath.length - 1);
  }
  let uniqueId = matchedMethod + ':' + transferPath;
  if (option.level === 'item') {
    let fields = '';
    if (option.fields) {
      const args = getAllArgs(ctx);
      option.fields.forEach(field => {
        if (args[field] == null || args[field] === undefined) {
          throw new Error('限流参数 field 有误，' + field + ' 不存在');
        }
        fields += ':' + args[field];
      });
    }
    uniqueId += fields;
  }

  if (option.prefix) uniqueId = option.prefix + ':' + uniqueId;
  return uniqueId;
}


// 限流的 uniqueId 根据name + fields 构建
function buildUniqueKeyByRequest(ctx, option) {
  let uniqueId = option.name;
  if (option.level === 'item') {
    const args = getAllArgs(ctx);
    const fieldsValue = option.fields.map(field => {
      if (args[field] == null || args[field] === undefined) {
        throw new Error('限流参数 field 有误，' + field + ' 不存在');
      }
      return args[field];
    });
    uniqueId = concatNameWithFields(uniqueId, concatFieldsValue(fieldsValue));
  }

  return uniqueId;
}

function concatFieldsValue(fieldsValue) {
  return fieldsValue.join(':');
}

function concatNameWithFields(name, fields) {
  return name + delimiter + fields;
}

function getNameByUniqueId(uniqueId) {
  return uniqueId.split(delimiter)[0];
}

function getAllArgs(ctx) {
  return {
    ...ctx.query,
    ...ctx.params,
    ...ctx.request.body,
  };
}

exports.buildUniqueKey = buildUniqueKey;
exports.buildUniqueKeyByRequest = buildUniqueKeyByRequest;
exports.getAllArgs = getAllArgs;
exports.getNameByUniqueId = getNameByUniqueId;
exports.concatNameWithFields = concatNameWithFields;
exports.concatFieldsValue = concatFieldsValue;
