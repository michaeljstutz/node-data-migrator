'use strict';

const _ = require('lodash');
const async = require('async');
const crypto = require('crypto');

const safePathParams = [
  'id',
  'from',
  'fromCondition',
  'normalize',
  'to',
  'toCondition',
];

const safeHookParams = [
  'id',
  'source',
  'path',
  'function',
];

const safeHookTypes = [
  'source',
  'target',
  'condition',
  'normalize',
];

// TODO: Add additional conditions
const condition = {
  isNull: (value) => { return _.isNull(value); },
  notNull: (value) => { return ! _.isNull(value); },
  isEmpty: (value) => { return _.isEmpty(value); },
  notEmpty: (value) => { return ! _.isEmpty(value); },
  isInteger: (value) => { return _.isInteger(value); },
  notInteger: (value) => { return ! _.isInteger(value); },
  isNumber: (value) => { return _.isNumber(value); },
  notNumber: (value) => { return ! _.isNumber(value); },
  isString: (value) => { return _.isString(value); },
  notString: (value) => { return ! _.isString(value); },
};

// TODO: add additional normalize function
const normalize = {
  string: (value) => { return _.toString(value); },
  number: (value) => { return _.toNumber(value); },
  integer: (value) => { return _.toSafeInteger(value); },
};

var DataMigrator = function DataMigrator(params) {

  this._source = {};
  if ( _.has(params, 'source') ) this.setSource.bind(this)(params.source);
  
  this._target = {};
  if ( _.has(params, 'target') ) this.setSource.bind(this)(params.target);

  this._currentlyRunning = false;
  this._hooks = {
    source: {},
    target: {},
    condition: {},
    normalize: {},
  };
  this._paths = {};
  this._conditions = {};
  this._normalize = {};
};

DataMigrator.prototype.run = function run(params, cb) {
  // TODO: parse through the parms and set anything up that needs to be configured

  // TODO: add logic to support only passing the callback without params

  // TODO: code the run function

  // TODO: loop through all the paths
  
    // TODO: check if the fromCondition && toCondition is true
    
    // TODO: run through all the source hooks
    
    // TODO: run normalize on the content

    // TODO: run through all the target hooks
    
    // TODO: save the content to the target

  // TODO: return stats?

  cb(null);
};

DataMigrator.prototype.setSource = function setSource(source) {
  if ( this._currentlyRunning ) throw new Error('Can not use setSource while migration is running');
  if ( ! _.isPlainObject(source) || _.isNull(source) ) throw new TypeError('source must be a plain object and not null');
  this._source = source;
};

DataMigrator.prototype.setTarget = function setTarget(target) {
  if ( this._currentlyRunning ) throw new Error('Can not use setTarget while migration is running');
  if ( ! _.isPlainObject(target) || _.isNull(target) ) throw new TypeError('target must be a plain object and not null');
  this._target = target;
};

DataMigrator.prototype.getSource = function getSource(params) {
  return this._source;
};

DataMigrator.prototype.getTarget = function getTarget(params) {
  return this._target;
};

DataMigrator.prototype.addPath = function addPath(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use addPath while migration is running');
  if ( ! _.has(params, 'from') ) throw new Error('params.from is required');
  if ( ! _.isString(params.from) ) throw new TypeError('params.from is not a valid string');
  
  // If the to is not set use the from location
  if ( ! _.has(params, 'to') ) _.set(params, 'to', params.from);

  // Check to make sure the from path has been created, if not create 
  if ( ! _.has(this._paths, params.from) ) this._paths[params.from] = [];

  // Create a randome hash id
  params.id = this.randomHash.bind(this)();

  // Add to the paths
  this._paths[params.from].push(  _.pick(params, safePathParams)  );

  // Return the new pathId
  return params.id;
};

DataMigrator.prototype.removePath = function removePath(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removePath while migration is running');
  if ( ! _.has(params, 'id') ) throw new Error('params.id is required');
  //TODO: add the remove path functionality
};

DataMigrator.prototype.addHook = function addHook(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use addHook while migration is running');
  if ( ! _.has(params, 'type') ) throw new Error('params.type is required');
  if ( ! _.isString(params.type) ) throw new TypeError('params.type is not a valid string');
  if ( ! _.has(params, 'key') || ! _.has(params, 'path') ) throw new Error('params.path or params.key is required');
  if ( ! _.isString(params.key) || ! _.isString(params.path) ) throw new TypeError('params.path or parmas.key is not a valid string');
  if ( ! _.has(params, 'function') ) throw new Error('params.function is required');
  if ( ! _.isFunction(params, 'function') ) throw new TypeError('params.function must be a function');

  if ( ! _.has(params, 'key') ) _.set( params, 'key', params.path );

  // Check the params.type and match it to the correct hooks object
  let hooks;
  if ( _.has(this._hooks, params.type ) hooks = this._hooks[params.type];
  else throw new TypeError('Invalid params.type');
  
  // Check to make sure the from path has been created, if not create 
  if ( ! _.has(hooks, params.key) ) hooks[params.key] = [];

  // Create a randome hash id
  params.id = this.randomHash.bind(this)();

  // Add to the paths
  hooks[params.key].push(  _.pick(params, safeHookParams)  );

  // Return the new pathId
  return params.id;
};

DataMigrator.prototype.removeHook = function removeHook(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removeHook while migration is running');
  if ( ! _.has(params, 'id') ) throw new Error('params.id is required');
  //TODO: add the remove hook functionality
};

DataMigrator.prototype.addCondition = function addCondition(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use addCondition while migration is running');
  if ( ! _.has(params, 'key') ) throw new Error('params.key is required');
  if ( ! _.isString(params.key) ) throw new TypeError('params.key is not a valid string');
  if ( ! _.has(params, 'function') ) throw new Error('params.function is required');
  if ( ! _.isFunction(params, 'function') ) throw new TypeError('params.function must be a function');
  return _.set(this._conditions, params.key, params.function);
};

DataMigrator.prototype.removeCondition = function removeCondition(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removeCondition while migration is running');
  if ( ! _.has(params, 'key') ) throw new Error('params.key is required');
  return _.unset(this._conditions, params.key);
};

DataMigrator.prototype.addNormalize = function addNormalize(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use addNormalize while migration is running');
  if ( ! _.has(params, 'key') ) throw new Error('params.key is required');
  if ( ! _.isString(params.key) ) throw new TypeError('params.key is not a valid string');
  if ( ! _.has(params, 'function') ) throw new Error('params.function is required');
  if ( ! _.isFunction(params, 'function') ) throw new TypeError('params.function must be a function');
  return _.set(this._normalize, params.key, params.function);
};

DataMigrator.prototype.removeNormalize = function removeNormalize(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removeNormalize while migration is running');
  if ( ! _.has(params, 'key') ) throw new Error('params.key is required');
  return _.unset(this._normalize, params.key);
};

DataMigrator.prototype.isRunning = function isRunning() {
  return this._currentlyRunning;
};

DataMigrator.prototype.randomHash = function _randomHash() {
  return crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString() + _.uniqueId()).digest('hex');
};

module.exports = DataMigrator;
