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
  'fromArray',
  'fromCondition',
  'fromConditionArgs',
  'fromConditionTest',
  'normalizer',
  'normalizerArgs',
  'to',
  'toArray',
  'toCondition',
  'toConditionArgs',
  'toConditionTest',
];

const internalConditions = {
  true: (value) => { return true; },
  isTrue: (value) => { return value === true; },
  notTrue: (value) => { return value !== true; },
  false: (value) => { return false; },
  isFalse: (value) => { return value === false; },
  notFalse: (value) => { return value !== false; },
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
  eq: (value, args) => { return _.eq(value, args); },
  lt: (value, args) => { return _.lt(value, args); },
  lte: (value, args) => { return _.lte(value, args); },
  gt: (value, args) => { return _.gt(value, args); },
  gte: (value, args) => { return _.gte(value, args); },
  isEqual: (value, args) => { return _.isEqual(value, args); },
  notEqual: (value, args) => { return ! _.isEqual(value, args); },
};

const internalNormalizers = {
  string: (value) => { return _.toString(value); },
  number: (value) => { return _.toNumber(value); },
  integer: (value) => { return _.toSafeInteger(value); },
  array: (value) => { return _.castArray(value); },
};

var DataMigrator = function DataMigrator(params) {
  if ( _.isNil(this) ) throw new Error('Object must be created using the new keyword');

  // Setup the base internal storage
  this._source = {};
  this._target = {};
  this._currentlyRunning = false;
  this._paths = {};
  this._conditions = {};
  this._normalizers = {};
  this._defaultFromCondition = null;
  this._defaultToCondition = null;
  // Creating a safe scope when binding functions
  this._safeScope = new SafeScope(this);

  // Check to see if params were passed in, and if so use them
  this._loadParams.bind(this)(params);

};

DataMigrator.prototype.run = function run(params, cb) {
  if ( this._currentlyRunning ) throw new Error('Can not use run while migration is running');
  this._loadParams.bind(this)(params);
  this._currentlyRunning = true;

  // if the second arg is nil and the first arg is a function move the parms to the cb and set the params to null
  if ( _.isNil(cb) && _.isFunction(params) ) {
    cb = params;
    params = {};
  }


  // Alows the function to be async and not block when called
  return async.setImmediate(() => {

    let sourceKeys = Object.keys(this._paths);

    async.map(sourceKeys, (key, done) => {
      let mapStats = this._runPath.bind(this, key)();
      mapStats.totalFromPathsProcessed = 1;
      return done(null, mapStats);
    }, (err, results) => {
      if (err) dfa.logger.error(err);
      // Reduce the stats
      let totalStats = {};
      for (let i = 0; i < results.length; i++) {
        for (let key in results[i]) {
          if ( _.has(totalStats, key) ) totalStats[key] += results[i][key];
          else totalStats[key] = results[i][key];
        }
      }
      this._currentlyRunning = false;    
      cb(null, totalStats);
    });
  });
};

DataMigrator.prototype.setSource = function setSource(source) {
  if ( this._currentlyRunning ) throw new Error('Can not use setSource while migration is running');
  if ( _.isNil(source) || ! _.isObject(source) ) throw new TypeError('source must be a object and not null');
  _.unset(this, '_source');
  this._source = source;
};

DataMigrator.prototype.setTarget = function setTarget(target) {
  if ( this._currentlyRunning ) throw new Error('Can not use setTarget while migration is running');
  if ( _.isNil(target) || ! _.isObject(target) ) throw new TypeError('target must be a object and not null');
  _.unset(this, '_target');
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
  if ( _.isNil(params) ) throw new Error('params is required');
  if ( ! _.isArray( params ) && ! _.isPlainObject( params ) ) throw new TypeError('params is not an array or an object');
  if ( ! _.isArray( params ) ) params = _.castArray( params );

  var pathIds = [];

  for (let a = 0; a < params.length; a++) {
    let pathMap = params[a];

    if ( ! _.has(pathMap, 'from') ) throw new Error('params['+a+'].from is required');
    if ( ! _.isString(pathMap.from)
      && !_.isArray(pathMap.from)
      && !_.isFunction(pathMap.from)
      ) throw new TypeError('params['+a+'].from is not a valid string, array, or function');
    if ( !_.isFunction(pathMap.from) 
      &&  _.isEmpty(pathMap.from) 
      ) throw new TypeError('params['+a+'].from can not be empty');
    if ( _.has(pathMap, 'fromArray') && ! _.isBoolean(pathMap.fromArray) ) throw new Error('params['+a+'].fromArray must be a boolean');
    if ( _.has(pathMap, 'toArray') && ! _.isBoolean(pathMap.toArray) ) throw new Error('params['+a+'].toArray must be a boolean');

    pathMap = _.pick(pathMap, safePathParams);

    // If the to is not set use the from location
    if ( ! _.has(pathMap, 'to') || ( ! _.isFunction(pathMap.to) && _.isEmpty(pathMap.to) ) ) _.set(pathMap, 'to', pathMap.from);

    // Loop through the types doing what needs to be done
    let types = ['from', 'to'];
    let keyName = {from:'', to:''};
    for (let i = 0; i < types.length; i++) {
      let type = types[i];
      let capType = _.capitalize(type);
      if ( _.has(pathMap, type+'Condition') ) {
        if ( ! _.isFunction(pathMap[type+'Condition']) && ! _.isString(pathMap[type+'Condition']) ) {
          throw new TypeError('params['+a+'].'+type+'Condition is not a function or string');
        }
        if ( _.isString(pathMap[type+'Condition']) 
          && ! _.has(this._conditions, pathMap[type+'Condition']) 
          && ! _.has(internalConditions, pathMap[type+'Condition']) ) {
            throw new TypeError('params['+a+'].'+type+'Condition function can not be found');
        }
      }

      pathMap['is'+capType+'Array'] = ( _.has(pathMap, type+'Array') ) ? pathMap[type+'Array'] : false;
      // If pathMap[type] is not a function we need to bind it to one (using _.get)
      if ( ! _.isFunction(pathMap[type]) && ! pathMap['is'+capType+'Array'] ) {
        let endsWithTestValue = ( _.isArray(pathMap[type]) ) ? _.last(pathMap[type]) : pathMap[type];
        if ( _.isArray(pathMap[type]) ) {
          if ( _.endsWith(pathMap[type][-1], '[]') ) {
            pathMap['is'+capType+'Array'] = true;
            if ( pathMap[type][-1].length === 2 ) pathMap[type].pop();
            else pathMap[type][-1] = _.trimEnd(pathMap[type][-1], '[]');
          }
          keyName[type] = _.join(pathMap[type], '.');
        } else {
          if ( _.endsWith(pathMap[type], '[]') ) {
            pathMap['is'+capType+'Array'] = true;
            pathMap[type] = _.trimEnd(pathMap[type], '[]');
          }
          keyName[type] = pathMap[type];
        }
      } else {
        // If you are passing a function in we need to genereate a random name
        keyName[type] = 'function-' + this.randomHash.bind(this)();
      }
    }

    if ( ! _.isFunction(pathMap.from) ) {
      pathMap.fromPathKey = pathMap.from;
      pathMap.from = function(){ 
        return this.get(pathMap.fromPathKey);
      };
    }
    
    if ( ! _.isFunction(pathMap.to) ) {
      pathMap.toPathKey = pathMap.to;
      pathMap.to = function(value){ 
        return this.set(pathMap.toPathKey, value);
      };
    }

    // Check to make sure the from path has been created, if not create 
    if ( ! _.has(this._paths, keyName.from) ) this._paths[keyName.from] = [];

    // Create a randome hash id
    pathMap.id = this.randomHash.bind(this)();

    // Add the ids to an array to be returned
    pathIds.push( pathMap.id );

    // Add to the paths
    this._paths[keyName.from].push( pathMap );

  }

  // return the number of items added
  return pathIds;
};

DataMigrator.prototype.removePath = function removePath(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removePath while migration is running');
  if ( _.isNil(params) ) throw new Error('params is required');
  if ( ! _.isArray( params ) && ! _.isPlainObject( params ) ) throw new TypeError('params is not an array or an object');
  if ( ! _.isArray( params ) ) params = _.castArray( params );
  let removedCount = 0;
  for (let a = 0; a < params.length; a++) {
    if ( ! _.has(params[a], 'id') ) throw new Error('params['+a+'].id is required');
    let findId = params[a].id;
    for (let fromPath in this._paths) {
      for (let i = 0; i < this._paths[fromPath].length; i++) {
        if ( findId == this._paths[fromPath][i].id ) {
          _.pullAt(this._paths[fromPath], i);
          removedCount++;
        }
      }
    }
  }
  //TODO: add the remove path functionality
  return removedCount;
};

DataMigrator.prototype.getPath = function getPath(key) {
  if ( this._currentlyRunning ) throw new Error('Can not use removePath while migration is running');
  if ( _.isNil(key) ) throw new Error('key is required');
  for (let fromPath in this._paths) {
    for (let i = 0; i < this._paths[fromPath].length; i++) {
      if ( key == this._paths[fromPath][i].id ) return this._paths[fromPath];
    }
  }
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
  if ( ! _.isArray( params ) && ! _.isPlainObject( params ) ) throw new TypeError('params is not an array or an object');
  if ( ! _.isArray( params ) ) params = _.castArray( params );
  for (let a = 0; a < params.length; a++) {
    let condition = params[a];
    if ( ! _.has(condition, 'key') ) throw new Error('params['+a+'].key is required');
    if ( ! _.isString(condition.key) ) throw new TypeError('params['+a+'].key is not a valid string');
    if ( ! _.has(condition, 'function') ) throw new Error('params['+a+'].function is required');
    if ( ! _.isFunction(condition.function) ) throw new TypeError('params['+a+'].function must be a function');
    _.set(this._conditions, condition.key, condition.function)
  }
  return params.length;
};

DataMigrator.prototype.removeCondition = function removeCondition(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removeCondition while migration is running');
  if ( ! _.isArray( params ) && ! _.isPlainObject( params ) ) throw new TypeError('params is not an array or an object');
  if ( ! _.isArray( params ) ) params = _.castArray( params );
  for (let a = 0; a < params.length; a++) {
    let condition = params[a];
    if ( ! _.has(condition, 'key') ) throw new Error('params['+a+'].key is required');
    _.unset(this._conditions, condition.key);
  }
  return params.length;
};

DataMigrator.prototype.runCondition = function runNormalizer(condition, value, args, conditionTest) {
  let conditionFunction = (v) => { return conditionTest; }; // Default function the opposite of the conditionTest value 

  conditionTest = _.isNil(conditionTest) ? true : conditionTest; // make sure that conditionTest is set to something

  if ( _.isFunction( condition ) ) {
    // If the toCondition value is a function
    conditionFunction = condition;    
  } else if ( _.isString( condition ) ) {
    // If the condition value is a string and has been added to the this._conditions collection
    if ( _.has(this._conditions, condition) ) conditionFunction = this._conditions[condition];
    // If the condition value is a string and has been added to the condition collection
    else if ( _.has(internalConditions, condition) ) conditionFunction = internalConditions[condition];
  }

  return conditionFunction.bind(this._safeScope)(value, args) === conditionTest;
};

DataMigrator.prototype.addNormalizer = function addNormalizer(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use addNormalizer while migration is running');
  if ( ! _.isArray( params ) && ! _.isPlainObject( params ) ) throw new TypeError('params is not an array or an object');
  if ( ! _.isArray( params ) ) params = _.castArray( params );
  for (let a = 0; a < params.length; a++) {
    let normalizer = params[a];
    if ( ! _.has(normalizer, 'key') ) throw new Error('params['+a+'].key is required');
    if ( ! _.isString(normalizer.key) ) throw new TypeError('params['+a+'].key is not a valid string');
    if ( ! _.has(normalizer, 'function') ) throw new Error('params['+a+'].function is required');
    if ( ! _.isFunction(normalizer.function) ) throw new TypeError('params['+a+'].function must be a function');
    _.set(this._normalizers, normalizer.key, normalizer.function)
  }
  return params.length;
};

DataMigrator.prototype.removeNormalizer = function removeNormalizer(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use removeNormalizer while migration is running');
  if ( ! _.isArray( params ) && ! _.isPlainObject( params ) ) throw new TypeError('params is not an array or an object');
  if ( ! _.isArray( params ) ) params = _.castArray( params );
  for (let a = 0; a < params.length; a++) {
    let normalizer = params[a];
    if ( ! _.has(normalizer, 'key') ) throw new Error('params['+a+'].key is required');
    _.unset(this._normalizers, normalizer.key);
  }
  return params.length;
};

DataMigrator.prototype.runNormalizer = function runNormalizer(normalizer, value, args) {
  let normalizerFunction = (v) => { return v; }; // Default function is a passthrough

  if ( ! _.isNil(normalizer) && _.isFunction( normalizer ) ) {
    // If the normalizer value is set and is a function
    normalizerFunction = normalizer;    
  } else if (! _.isNil(normalizer) && _.isString( normalizer ) ) {
    // If the normalizer value is a string and has been added to the this._normalizers collection
    if ( _.has(this._normalizers, normalizer) ) normalizerFunction = this._normalizers[normalizer];
    // If the normalizer value is a string and has been added to the normalizer collection
    else if ( _.has(internalNormalizers, normalizer) ) normalizerFunction = internalNormalizers[normalizer];
  }

  return normalizerFunction.bind(this._safeScope)( value, args );
};

DataMigrator.prototype.isRunning = function isRunning() {
  return this._currentlyRunning;
};

DataMigrator.prototype.randomHash = function randomHash() {
  return crypto.createHash('sha1').update((new Date()).valueOf().toString() + Math.random().toString() + _.uniqueId()).digest('hex');
};

DataMigrator.prototype.reset = function reset(params) {
  if ( this._currentlyRunning ) throw new Error('Can not use reset while migration is running');

  if ( _.isNil(params) || ( _.has(params, 'source') && params.source == true ) ) {
    _.unset(this, '_source');
    _.set(this, '_source', {});
  }
  if ( _.isNil(params) || ( _.has(params, 'target') && params.target == true ) ) {
    _.unset(this, '_target');
    _.set(this, '_target', {});
  }
  if ( _.isNil(params) || ( _.has(params, 'conditions') && params.conditions == true ) ) {
    _.unset(this, '_conditions');
    _.set(this, '_conditions', {});
  }
  if ( _.isNil(params) || ( _.has(params, 'normalizers') && params.normalizers == true ) ) {
    _.unset(this, '_normalizers');
    _.set(this, '_normalizers', {});
  }
  if ( _.isNil(params) || ( _.has(params, 'paths') && params.paths == true ) ) {
    _.unset(this, '_paths');
    _.set(this, '_paths', {});
  }
}

DataMigrator.prototype._fromConditionCheck = function _fromConditionCheck(params) {
  if ( _.isNil( params) ) throw new TypeError('params can not be nil');
  params.whichCondition = 'from';
  return this._conditionCheck.bind( this, params )();
};

DataMigrator.prototype._toConditionCheck = function _toConditionCheck(params) {
  if ( _.isNil( params) ) throw new TypeError('params can not be nil');
  params.whichCondition = 'to';
  return this._conditionCheck.bind( this, params )();
};

DataMigrator.prototype._conditionCheck = function _conditionCheck(params) {
  if ( _.isNil( params) ) throw new TypeError('params can not be nil');
  if ( ! _.isObject( params ) ) throw new TypeError('params must be an object');
  if ( ! _.has( params, 'whichCondition' ) ) throw new TypeError('params.whichCondition must be an object');

  let condition = _.get(params, params.whichCondition+'Condition');
  let value = _.get(params, params.whichCondition+'Value');
  let args = _.get(params, params.whichCondition+'ConditionArgs') || null;
  let conditionTest = _.get(params, params.whichCondition+'ConditionTest') || true;

  let results = this.runCondition.bind(this)(condition, value, args, conditionTest);

  if ( _.isError( results ) ) return false;

  return results;
};

DataMigrator.prototype._runPath = function _runPath(fromPath) {

  let mapStats = {
    sourceUriNotFound: 0,
    fromFailed: 0,
    fromConditionFailed: 0,
    toFailed: 0,
    toConditionFailed: 0,
    normalizerFailed: 0,
    totalToPathsProcessed: 0,
    totalNoramlizerCalls: 0,
  };

  let source = this._source;
  let target = this._target;

  // If the source does not have the given key exit
  if ( ! _.startsWith( fromPath, 'function-' ) && ! _.has(source, fromPath) ) {
    mapStats.sourceUriNotFound = 1;
    return mapStats;
  }

  let toPaths = _.get(this._paths, fromPath);

  // Go through all the toPaths
  for (let x = 0; x < toPaths.length; x++) {
    mapStats.totalToPathsProcessed++;

    let pathMap = toPaths[x];

    pathMap.fromValue = pathMap.from.bind(this._safeScope)();
    if ( _.isError( pathMap.fromValue ) ) {
      mapStats.fromFailed++;
      _.unset( pathMap, 'fromValue' );
      continue;
    }

    // Adds support for having a default fromCondition
    if ( ! _.has( pathMap, 'fromCondition' ) && ! _.isNull(this._defaultFromCondition) ) 
      _.set( pathMap, 'fromCondition', this._defaultFromCondition );

    // Check to see if there is a from condition, and if so check to see if it fails
    if ( _.has( pathMap, 'fromCondition' ) && ! this._fromConditionCheck.bind( this, pathMap )() ) {
      mapStats.fromConditionFailed++;
      _.unset( pathMap, 'fromValue' );
      continue;
    }

    if ( ! _.isFunction(pathMap.to) ) {
      pathMap.toPathKey = pathMap.to;
    }

    let toPath = pathMap.toPathKey || false;
    
    if ( toPath ) { // if we do not have a toPath skip the toCondition test
      pathMap.toValue = _.get(this._target, toPath);

      // Adds support for having a default toCondition
      if ( ! _.has( pathMap, 'toCondition' ) && ! _.isNull(this._defaultToCondition) ) 
        _.set( pathMap, 'toCondition', this._defaultToCondition );

      // Check to see if there is a to condition, and if so check to see if it fails
      if ( _.has( pathMap, 'toCondition' ) && ! this._toConditionCheck.bind( this, pathMap )() ) {
        mapStats.toConditionFailed++;
        _.unset( pathMap, 'fromValue' );
        _.unset( pathMap, 'toValue' );
        continue;
      }
    }

    let useFromValue = (pathMap.isFromArray && _.isArray(pathMap.fromValue)) ? pathMap.fromValue : [pathMap.fromValue];

    for (let y = 0; y < useFromValue.length; y++) {
      let fromValue = useFromValue[y];

      // If pathMap.normalizerArgs is not present, create it with null
      if ( ! _.has(pathMap, 'normalizerArgs') ) pathMap.normalizerArgs = null;
      
      // Get the from value through the normalizer
      fromValue = this.runNormalizer.bind(this)( pathMap.normalizer, fromValue, pathMap.normalizerArgs );
      if ( _.isError( fromValue ) ) {
        mapStats.normalizerFailed++;
        continue;
      }
      mapStats.totalNoramlizerCalls++;

      if ( pathMap.isToArray ) {
        // If value is nil then create an empty array
        if ( _.isNil( pathMap.toValue ) ) pathMap.toValue = [];
        // Cast value to an array 
        if ( ! _.isArray( pathMap.toValue ) ) pathMap.toValue = _.castArray( pathMap.toValue );
        // Push the fromValue to the toValue
        if ( _.isArray( fromValue ) ) {
          for (let x = 0; x < fromValue.length; x++) {
            pathMap.toValue.push( fromValue[x] );
          }
        } else {
          pathMap.toValue.push( fromValue );
        }
      } else {
        pathMap.toValue = fromValue;
      }

      // Set the from value
      var toReturn = pathMap.to.bind(this._safeScope)( pathMap.toValue );
      if ( _.isError(toReturn) ) {
        mapStats.toFailed++;
      }

    }

    // unset the fromValue and toValue, no need to keep a pointer/value after this point
    _.unset( pathMap, 'fromValue' );
    _.unset( pathMap, 'toValue' );
  }

  return mapStats;

};

DataMigrator.prototype._loadParams = function _loadParams(params) {
  if ( _.has(params, 'source') ) this.setSource.bind(this)(params.source);
  if ( _.has(params, 'target') ) this.setTarget.bind(this)(params.target);
  if ( _.has(params, 'condition') ) this.addCondition.bind(this)(params.condition);
  if ( _.has(params, 'conditions') ) this.addCondition.bind(this)(params.conditions);
  if ( _.has(params, 'normalizer') ) this.addNormalizer.bind(this)(params.normalizer);
  if ( _.has(params, 'normalizers') ) this.addNormalizer.bind(this)(params.normalizers);
  if ( _.has(params, 'path') ) this.addPath.bind(this)(params.path);
  if ( _.has(params, 'paths') ) this.addPath.bind(this)(params.paths);
};

var SafeScope = function SafeContext(parantScope) {
  this.parantScope = parantScope;
  this.isSafeScope = true;
};

SafeScope.prototype.get = function get(path) {
  return _.get(this.parantScope._source, path);
};

SafeScope.prototype.set = function get(path, value) {
  return _.set(this.parantScope._target, path, value);
};

SafeScope.prototype.runCondition = function runNormalizer(condition, value, args, conditionTest) {
  return this.parantScope.runCondition.bind(this.parantScope)(condition, value, args, conditionTest);
};

SafeScope.prototype.runNormalizer = function runNormalizer(normalizer, value, args) {
  return this.parantScope.runNormalizer.bind(this.parantScope)(normalizer, value, args);
};

module.exports = DataMigrator;
