/*!
 * data-migrator
 * https://github.com/michaeljstutz/node-data-migrator
 *
 * Copyright (c) 2016 Michael Stutz
 * Released under the MIT license
 */
'use strict';

const _ = require('lodash');
const async = require('async');
const crypto = require('crypto');

const safePathParams = [
  'from',
  'fromCondition',
  'fromConditionValue',
  'normalize',
  'to',
  'toCondition',
  'toConditionValue',
];

const internalCondition = {
  true: (value) => { return true; },
  false: (value) => { return false; },
  isNil: (value) => { return _.isNil(value); },
  notNil: (value) => { return ! _.isNil(value); },
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
  isBoolean: (value) => { return _.isBoolean(value); },
  notBoolean: (value) => { return ! _.isBoolean(value); },
  isArray: (value) => { return _.isArray(value); },
  notArray: (value) => { return ! _.isArray(value); },
  eq: (value, condition) => { return _.eq(value, condition); },
  lt: (value, condition) => { return _.lt(value, condition); },
  lte: (value, condition) => { return _.lte(value, condition); },
  gt: (value, condition) => { return _.gt(value, condition); },
  gte: (value, condition) => { return _.gte(value, condition); },
  isEqual: (value, condition) => { return _.isEqual(value, condition); },
  notEqual: (value, condition) => { return ! _.isEqual(value, condition); },
};

const internalNormalize = {
  string: (value) => { return _.toString(value); },
  number: (value) => { return _.toNumber(value); },
  integer: (value) => { return _.toSafeInteger(value); },
  array: (value) => { return _.castArray(value); },
};

var DataMigrator = function DataMigrator(params) {
  this._source = {};
  if ( _.has(params, 'source') ) this.setSource.bind(this)(params.source);
  
  this._target = {};
  if ( _.has(params, 'target') ) this.setTarget.bind(this)(params.target);

  this._currentlyRunning = false;
  this._paths = {};
  this._conditions = {};
  this._normalize = {};
  this._defaultFromCondition = null;
  this._defaultToCondition = null;
};

DataMigrator.prototype.run = function run(params, cb) {
  this._currentlyRunning = true;

  // if the second arg is nil and the first arg is a function move the parms to the cb and set the params to null
  if ( _.isNil(cb) && _.isFunction(params) ) {
    cb = params;
    params = null;
  }

  // TODO: parse through the parms, set anything up that needs to be configured
    
  let source = this._source;
  let target = this._target;

  // Loop through all the paths
  async.map(Object.keys(this._paths), (key, done) => {
    let mapStats = {
      sourceUriNotFound: 0,
      fromConditionFailed: 0,
      toConditionFailed: 0,
    };
    let fromPath = key;

    // If the source does not have the given key exit
    if ( ! _.has(source, fromPath) ) {
      mapStats.sourceUriNotFound = 1;
      return done(null, mapStats); 
    }

    let toPaths = _.get(this._paths, key);

    // Go through all the toPaths
    for (let i = 0; i < toPaths.length; i++) {
      let pathMap = toPaths[i];

      pathMap.fromValue = _.get(this._source, fromPath);

      // Adds support for having a default fromCondition
      if ( ! _.has( pathMap, 'fromCondition' ) && ! _.isNull(this._defaultFromCondition) ) 
        _.set( pathMap, 'fromCondition', this._defaultFromCondition );

      // Check to see if there is a from condition, and if so check to see if it fails
      if ( _.has( pathMap, 'fromCondition' ) && ! this._fromConditionCheck.bind( this, pathMap )() ) {
        mapStats.fromConditionFailed++;
        continue;
      }

      let toPath = pathMap.to;
      pathMap.toValue = _.get(this._target, toPath);

      // Adds support for having a default toCondition
      if ( ! _.has( pathMap, 'toCondition' ) && ! _.isNull(this._defaultToCondition) ) 
        _.set( pathMap, 'toCondition', this._defaultToCondition );

      // Check to see if there is a to condition, and if so check to see if it fails
      if ( _.has( pathMap, 'toCondition' ) && ! this._toConditionCheck.bind( this, pathMap )() ) {
        mapStats.toConditionFailed++;
        continue;
      }

      // TODO: add support for the from/to being a function

      // Handle the normalizer functionality
      let normalizerFunction = (v) => { return v; }; // Default function is a passthrough
      if ( _.has( pathMap, 'normalize' ) && _.isFunction( pathMap.normalize ) ) {
        // If the normalize value is set and is a function
        normalizerFunction = pathMap.normalize;    
      } else if ( _.has( pathMap, 'normalize' ) && _.isString( pathMap.normalize ) ) {
        // If the normalize value is a string and has been added to the this._normalize collection
        if ( _.has(this._normalize, pathMap.normalize) ) normalizerFunction = this._normalize[pathMap.normalize];
        // If the normalize value is a string and has been added to the normalize collection
        else if ( _.has(internalNormalize, pathMap.normalize) ) normalizerFunction = internalNormalize[pathMap.normalize];
      }

      // Get the from value through the normalizer
      pathMap.fromValue = normalizerFunction( pathMap.fromValue );

      if ( pathMap.isToArray ) {
        // Cast value to an array 
        if ( ! _.isArray( pathMap.toValue ) ) pathMap.toValue = _.castArray( pathMap.toValue );
        // Push the fromValue to the toValue
        pathMap.toValue.push( pathMap.fromValue );
      } else {
        pathMap.toValue = pathMap.fromValue;
      }

      // Set the from value
      _.set( target, toPath, pathMap.toValue );
      
    }

    return done(null, mapStats);
  }, (err, results) => {
    if (err) dfa.logger.error(err);
    this._currentlyRunning = false;

    // Reduce the stats
    let totalStats = { totalPathsProcessed: 0 };
    for (let i = 0; i < results.length; i++) {
      totalStats.totalPathsProcessed++;
      for (let key in results[i]) {
        if ( _.has(totalStats, key) ) totalStats[key] += results[i][key];
        else totalStats[key] = results[i][key];
      }
    }

    cb(null, totalStats);
  });
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

  params = _.pick(params, safePathParams);

  if ( _.has(params, 'fromCondition') ) {
    if ( ! _.isFunction(params.fromCondition) && ! _.isString(params.fromCondition) ) 
      throw new TypeError('params.fromCondition is not a function or string');
    if ( _.isString(params.fromCondition) && ! _.has(this._conditions, params.fromCondition) && ! _.has(internalCondition, params.fromCondition) ) 
      throw new TypeError('params.fromCondition function from string can not be found');
  }

  if ( _.has(params, 'toCondition') ) {
    if ( ! _.isFunction(params.toCondition) && ! _.isString(params.toCondition) ) 
      throw new TypeError('params.toCondition is not a function or string');
    if ( _.isString(params.toCondition) && ! _.has(this._conditions, params.toCondition) && ! _.has(internalCondition, params.toCondition) ) 
      throw new TypeError('params.toCondition function from string can not be found');
  }

  // If the to is not set use the from location
  if ( ! _.has(params, 'to') || _.isEmpty(params.to) ) _.set(params, 'to', params.from);

  // Add support for the from being a function or an array
  params.isFromFunction = false;
  params.isFromArray = false;
  if ( _.endsWith(params.from, '()') ) {
    params.isFromFunction = true;
    params.from = _.trimEnd(params.from, '()');
  } else if ( _.endsWith(params.from, '[]') ) {
    params.isFromArray = true;
    params.from = _.trimEnd(params.from, '[]');
  }

  // Add support for the to being a function or an array
  params.isToFunction = false;
  params.isToArray = false;
  if ( _.endsWith(params.to, '()') ) {
    params.isToFunction = true;
    params.to = _.trimEnd(params.to, '()');
  } else if ( _.endsWith(params.to, '[]') ) {
    params.isToArray = true;
    params.to = _.trimEnd(params.to, '[]');
  }

  // Check to make sure the from path has been created, if not create 
  if ( ! _.has(this._paths, params.from) ) this._paths[params.from] = [];

  // Create a randome hash id
  params.id = this.randomHash.bind(this)();

  // Add to the paths
  this._paths[params.from].push( params );

  // Return the new pathId
  return params.id;
};

DataMigrator.prototype.removePath = function removePath(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removePath while migration is running');
  if ( ! _.has(params, 'id') ) throw new Error('params.id is required');
  //TODO: add the remove path functionality
  return false;
};

DataMigrator.prototype.clearPaths = function clearPaths(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removePath while migration is running');
  _.unset(this, '_paths');
  _.set(this, '_paths', {});
  return true;
};

DataMigrator.prototype.addCondition = function addCondition(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use addCondition while migration is running');
  if ( ! _.has(params, 'key') ) throw new Error('params.key is required');
  if ( ! _.isString(params.key) ) throw new TypeError('params.key is not a valid string');
  if ( ! _.has(params, 'function') ) throw new Error('params.function is required');
  if ( ! _.isFunction(params.function) ) throw new TypeError('params.function must be a function');
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
  if ( ! _.isFunction(params.function) ) throw new TypeError('params.function must be a function');
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

DataMigrator.prototype.randomHash = function randomHash() {
  return crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString() + _.uniqueId()).digest('hex');
};

DataMigrator.prototype._fromConditionCheck = function _fromConditionCheck(params) {
  if ( _.isNil( params) ) throw new TypeError('params can not be nil');
  
  let conditionCheck = (v) => { return false; }; // Default function returns false
  if ( _.isFunction( params.fromCondition ) ) {
    // If the fromCondition value is a function
    conditionCheck = params.fromCondition;    
  } else if ( _.isString( params.fromCondition ) ) {
    // If the condition value is a string and has been added to the this._conditions collection
    if ( _.has(this._conditions, params.fromCondition) ) conditionCheck = this._conditions[params.fromCondition];
    // If the condition value is a string and has been added to the condition collection
    else if ( _.has(internalCondition, params.fromCondition) ) conditionCheck = internalCondition[params.fromCondition];
  }

  params.fromConditionValue = params.fromConditionValue || null;

  return conditionCheck( params.fromValue, params.fromConditionValue );
};

DataMigrator.prototype._toConditionCheck = function _toConditionCheck(params) {
  if ( _.isNil( params) ) throw new TypeError('params can not be nil');

  let conditionCheck = (v) => { return false; }; // Default function returns false
  if ( _.isFunction( params.toCondition ) ) {
    // If the toCondition value is a function
    conditionCheck = params.toCondition;    
  } else if ( _.isString( params.toCondition ) ) {
    // If the condition value is a string and has been added to the this._conditions collection
    if ( _.has(this._conditions, params.toCondition) ) conditionCheck = this._conditions[params.toCondition];
    // If the condition value is a string and has been added to the condition collection
    else if ( _.has(internalCondition, params.toCondition) ) conditionCheck = internalCondition[params.toCondition];
  }

  params.toConditionValue = params.toConditionValue || null;

  return conditionCheck( params.toValue, params.toConditionValue );
};

module.exports = DataMigrator;
