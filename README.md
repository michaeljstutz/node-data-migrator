# DataMigrator
Node.js module for migrating data between two different data objects using paths, conditions, and normalize functions

## Installation
Using npm:
```
npm install --save data-migrator
```
In Node.js
```
var DataMigrator = require('data-migrator');

```
## Quick Examples

```js
var sourceObject = {
  item1: 1,
  item2: '2',
  item3: [3],
  item4: 4,
  item5: 4,
};

var targetObject = {
  item1: 0,
  item2: 0,
  item3: 0,
  item4: 0,
  item5: 5,
};

var dataMigrator = new DataMigrator({source:sourceObject, target:targetObject});

// addPath supports the following keys 
dataMigrator.addPath({from:'item1'});
dataMigrator.addPath({from:'item2', normalizer: 'number'});
dataMigrator.addPath({from:'item3[0]', to:'item3'});
dataMigrator.addPath({from:'item4', fromCondition:'isNumber', normalizer: function(value){ return value * 1; }});
dataMigrator.addPath({from:'item5', toCondition:'notEqual', toConditionArgs: 5});

dataMigrator.run(function(err, stats){
  console.log('dataMigrator.run() has completed with the below stats...');
  console.log(JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(targetObject, null, 2));
});
```
###The code should display the following on the console
```js
dataMigrator.run() has completed with the below stats...
{
  "sourceUriNotFound": 0,
  "fromConditionFailed": 0,
  "toConditionFailed": 1,
  "totalToPathsProcessed": 5,
  "totalNoramlizerCalls": 4,
  "totalFromPathsProcessed": 5
}
{
  "item1": 1,
  "item2": 2,
  "item3": 3,
  "item4": 4,
  "item5": 5
}
```

## Documentation

### .addCondition(params)

####<a name="addCondition.internalConditions"></a> Available Internal Conditions

Most of the internal condition are using the lodash library, for more information please visit their documentation page [link](https://lodash.com/docs). Items starting with not are mostly just reverses of the is versions ie: notNull is just a return of ! is Null.

* true: (value)
* isTrue: (value)
* notTrue: (value)
* false: (value)
* isFalse: (value)
* notFalse: (value)
* isNil: (value)
* notNil: (value)
* isNull: (value)
* notNull: (value)
* isEmpty: (value)
* notEmpty: (value)
* isInteger: (value)
* notInteger: (value)
* isNumber: (value)
* notNumber: (value)
* isString: (value)
* notString: (value)
* isBoolean: (value)
* notBoolean: (value)
* isArray: (value)
* notArray: (value)
* eq: (value, args)
* lt: (value, args)
* lte: (value, args)
* gt: (value, args)
* gte: (value, args)
* isEqual: (value, args)
* notEqual: (value, args)

### .addNormalizer(params)

####<a name="addNormalizer.internalConditions"></a> Available Internal Normalizers

Most of the internal condition are using the lodash library, for more information please visit their documentation page [link](https://lodash.com/docs).

* string: (value)
* number: (value)
* integer: (value)
* array: (value)

### .addPath(params)

This function is used in adding path mappings to process.
The params argument can be a single object or an array of object

#### Params

This can be a single object or an array of object with the following keys:
* [from](#addPath.params.from) - Accepts (String|Array|Function) - This is the path or function for getting the value from the source
* [fromArray](#addPath.params.fromArray) - Accepts (Boolean)
* [fromCondition](#addPath.params.fromCondition) - Accepts (String|Function)
* [fromConditionArgs](#addPath.params.fromConditionArgs) - Accepts (*)
* [fromConditionTest](#addPath.params.fromConditionTest) - Accepts (Boolean)
* [normalizer](#addPath.params.normalizer) - Accepts (String|Function)
* [normalizerArgs](#addPath.params.normalizerArgs) - Accepts (*)
* [to](#addPath.params.to) - Accepts (String|Array|Function) - This is the path or function for setting the value to the target
* [toArray](#addPath.params.toArray) - Accepts (Boolean)
* [toCondition](#addPath.params.toCondition) - Accepts (String|Function)
* [toConditionArgs](#addPath.params.toConditionArgs) - Accepts (*)
* [toConditionTest](#addPath.params.toConditionTest) - Accepts (Boolean)

####<a name="addPath.params.from"></a>params.from: (String|Array|Function) _required param_

This is the main required param, which should be a string or array path to the value in the source or a function that will return a value.

**Example:**
```js
params.from = 'firstKey.secondKey[1].thirdKey';
// OR
params.from = ['firstKey', 'secondKey', '1', 'thirdKey'];
// OR
params.from = function(){
  return 'value';
};
```

If you would like the 'from' to be processed as an array, append [] to the string or as the last item in the array. If you are assigning a functions please see the [params.fromArray](#addPath.params.fromArray) documentation for getting around not having access to adding '[]'.

**Example:**
```js
params.from = 'firstKey.secondKey[1].thirdKey[]';
// OR
params.from = ['firstKey', 'secondKey', '1', 'thirdKey', '[]'];
// OR
params.from = ['firstKey', 'secondKey', '1', 'thirdKey[]'];
```

####<a name="addPath.params.fromArray"></a>params.fromArray: (Boolean)

This param forces the run function to process the source path value as an array, looping through the values calling against the normalizer function and to function with each iteration.

This param will bypass the check for '[]' inside the from forcing it to work with the from as an array.

**Example:**
```js
params.fromArray = true;
```

####<a name="addPath.params.fromCondition"></a>params.fromCondition: (String|Function)

This param allows for a pre-check condition to be checked before running through the normalizer. This can be a string key referencing an already added function [see addCondition()](#addCondition) for more information on adding a new condition or [see addCondition -> Available Internal Conditions()](#addCondition.internalConditions) for a list available functions. Please note addPath will error if the condition string key is not found.

**Example:**
```js
params.fromCondition = 'isTrue'; 
// OR
params.fromCondition = function(value){
  return value === true;
};
```

####<a name="addPath.params.fromConditionArgs"></a>params.fromConditionArgs: (*)

This param allows you to send args to the condition function

**Example:**
```js
params.fromConditionArgs = 'testing';
params.fromCondition = 'eq';
// OR
params.fromConditionArgs = 'testing';
params.fromCondition = function(value, args){ 
  return value === args; 
};

```

####<a name="addPath.params.fromConditionTest"></a>params.fromConditionTest: (Boolean)

The fromCondition will return a boolean, this setting allows you to change if the condition should match true or false.

**Example:**
```js
params.fromConditionTest = true;
```

####<a name="addPath.params.normalizer"></a>params.normalizer: (String|Function)

This param allows for a process the data before it is saved to the target path. This can be a string key referencing an already added function [see addNormalizer()](#addNormalizer) for more information on adding a new normalizer. Please note addPath will error if the normalizer string key is not found.

**Example:**
```js
params.normalizer = 'string'; 
// OR
params.normalizer = function(value){
  return _.toString(value);
};
```

####<a name="addPath.params.normalizerArgs"></a>params.normalizerArgs: (*)

This param allows you to send args to the normalizer function

**Example:**
```js
params.normalizerArgs = 1;
params.normalizer = function(value, args){ 
  value = _.toNumber(value) || 1;
  return value * args; 
};

```

####<a name="addPath.params.to"></a>params.to: (String|Array|Function)

This is the path (or function) to the location you would like to save to.

**Example:**
```js
params.to = 'firstKey.secondKey.thirdKey';
// OR
params.to = ['firstKey', 'secondKey', 'thirdKey'];
// OR
params.to = function(value){
  targetObject.firstKey.secondKey.thirdKey = value;
};
```

If you would like to append the data to an array, append [] to the string or as the last item in the array. If this is not set it will overwrite the data rather then append it. If you are assigning a functions please see the [params.toArray](#addPath.params.toArray) documentation for getting around not having access to adding '[]'.

**Example:**
```js
params.to = 'firstKey.secondKey.thirdKey[]';
// OR
params.to = ['firstKey', 'secondKey', 'thirdKey', '[]'];
```

####<a name="addPath.params.toArray"></a>params.toArray: (Boolean)

This param forces the run function to push to the target path as an array. If the value is not set or is not an array it will be created or converted to an array.

This param will bypass the check for '[]' inside the to forcing it to work with the to as an array.

**Example:**
```js
params.toArray = true;
```

####<a name="addPath.params.toCondition"></a>params.toCondition (String|Function)

This param allows for a pre-check condition to be checked before saving the data to the target. This can be a string key referencing an already added function [see addCondition()](#addCondition) for more information on adding a new condition or [see addCondition -> Available Internal Conditions()](#addCondition.internalConditions) for a list available functions. Please note addPath will error if the condition string key is not found.

**Example:**
```js
params.fromCondition = 'isEmpty'; 
// OR
params.fromCondition = function(value){
  return _.isEmpty(value);
};
```

####<a name="addPath.params.toConditionArgs"></a>params.toConditionArgs: (*)

This param allows you to send args to the condition function

**Example:**
```js
params.toConditionArgs = 'testing';
params.toCondition = 'eq';
// OR
params.toConditionArgs = 'testing';
params.toCondition = function(value, args){ 
  return value === args; 
};

```

####<a name="addPath.params.toConditionTest"></a>params.toConditionTest (Boolean)

The toCondition will return a boolean, this setting allows you to change if the condition should match true or false.

**Example:**
```js
params.toConditionTest = true;
```

### .reset(params)

This function allows you to reset diffrent sections of the or all sections by calling reset without params;

