'use strict';

const assert = require('assert');
const awaitFirst = require('await-first');
const redis = require('ioredis');
const config = require('./config').redis;


let _redis;

exports.init = async function createClient() {

  let client = new redis(config);
  assert(config.host && config.port && config.password !== undefined && config.db !== undefined,
    `[egg-redis] 'host: ${config.host}', 'port: ${config.port}', 'password: ${config.password}', 'db: ${config.db}' are required on config`);
  console.info('[egg-redis] server connecting redis://:***@%s:%s/%s',
    config.host, config.port, config.db);


  client.on('connect', () => {
    console.info('[egg-redis] client connect success');
  });
  client.on('error', err => {
    console.error('[egg-redis] client error: %s', err);
    console.error(err);
  });

  await awaitFirst(client, ['ready', 'error']);
  console.info(`[egg-redis] instance status OK, client ready`);
  _redis = client;
  return client;
}

exports.get = function () {
  return _redis
}