# DataMigrator
Node.js module for migrating data between two different data objects using paths, conditions, and normalize functions

## Installation
Using npm:
```
npm install --save data-migrator
```
In Node.js
```js
var DataMigrator = require('data-migrator');
```
## Quick Overall Example

```js
// Require the DataMigrator
var DataMigrator = require('data-migrator');

// My source object
var sourceObject = {
  item1: 1,
  item2: '2',
  item3: [3],
  item4: 4,
  item5: 4,
};

// My target object
var targetObject = {
  item1: 0,
  item2: 0,
  item3: 0,
  item4: 0,
  item5: 5,
};

// Initialize a new DataMigrator using the sourceObject as source and the targetObject as target
var dataMigrator = new DataMigrator({source:sourceObject, target:targetObject});

// Migrate from sourceObject.item1 to targetObject.item1
dataMigrator.addPath({from:'item1'});

// Migrate from sourceObject.item2 to taretObject.item2
dataMigrator.addPath({from:'item2', normalizer: 'number'});

// Migrate from sourceObject.item3[0] to targetObject.item3
dataMigrator.addPath({from:'item3[0]', to:'item3'});

// Migrate from sourceObject.item4 to targetObject.item4
//   but only if from is a number
//   and normalize the value to equal the starting value times one.
dataMigrator.addPath({from:'item4', fromCondition:'isNumber', normalizer: function(value){ return value * 1; }});

// Migrate from sourceObject.item5 to targetObject.item5
//   but only if the target is not equal to 5
dataMigrator.addPath({from:'item5', toCondition:'notEqual', toConditionArgs: 5}); // ment to fail

// Run the migration
dataMigrator.run(function(err, stats){
  console.log('dataMigrator.run() has completed with the below stats...');
  console.log(JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(targetObject, null, 2));
});
```
####The code should display the following on the console
```js
dataMigrator.run() has completed with the below stats...
{
  "sourceUriNotFound": 0,
  "fromFailed": 0,
  "fromConditionFailed": 0,
  "toFailed": 0,
  "toConditionFailed": 1,
  "normalizerFailed": 0,
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

This project utilizes mutiple open source projects

* [lodash](https://lodash.com/) - JavaScript utility library
* [async](https://github.com/caolan/async) - Async utility module

Llicensing and copyrights notices can be found on their respective websites.

---

### Initialization

Here is the basics on how to initialize the DataMigrator.

---

####<a name="DataMigrator"></a> DataMigrator([params])

The data migrator must be initialized using the `new` keyword, to create a new instance of the migrator

**Since**

0.1.0

**Arguments**

1. `params` (Object): Params

**Params Object**

- `source`: (Object) - The source object passed to [`setSource`](#setSource)
- `target`: (String) - The target object passed to [`setTarget`](#setTarget)
- `condition`: (Object|Array) - The condition object or an array of objects passed to [`addCondition`](#addCondition)
- `normalizer`: (Object|Array) - The normalizer object or an array of objects passed to [`addNormalizer`](#addNormalizer)
- `path`: (Object|Array) - The path object or an array of objects passed to [`addPath`](#addPath)

The above params are processed in that order.

**Returns**

(Object): The newly initialized DataMigration object.

**Examples**

```js
// Empty dataMigrator
var dataMigrator = new DataMigrator();
```
```js
// My source object
var sourceObject = {
  item1: 1,
  item2: '2',
  item3: [3],
  item4: 4,
  item5: 4,
};

// My target object
var targetObject = {
  item1: 0,
  item2: 0,
  item3: 0,
  item4: 0,
  item5: 5,
};
var dataMigrator = new DataMigrator({source: sourceObject, target: targetObject});
```

---

### Main Functions

* [`addCondition(params)`](#addCondition) - Used to add conditions
* [`addNormalizer(params)`](#addNormalizer) - Used to add normalizers
* [`addPath(params)`](#addPath) - Used to add path mappings
* [`getSource()`](#getSource) - Return the source object
* [`getTarget()`](#getTarget) - Return the target object
* [`isRunning()`](#isRunning) - Check the status of the run function
* [`randomHash()`](#randomHash) - Return a sh1 hash based on the time, math random, and lodash unique id
* [`removeCondition(key)`](#removeCondition) - Remove a condition
* [`removeNormalizer(key)`](#removeNormalizer) - Remove a normalizer
* [`removePath(id)`](#removePath) - Remove a path
* [`reset([params])`](#reset) - Reset the instance
* [`run([params], callback)`](#run) - Used to run the migration
* [`runCondition(key, value, [args])`](#runCondition) - Run a condition
* [`runNormalizer(key, value, [args])`](#runNormalizer) - Run a normalizer
* [`setSource(source)`](#setSource) - Set the source object
* [`setTarget(target)`](#setTarget) - Set the target object

### Scoped Functions

* [`get(path)`](#safescope.get) - Used to get from the source object
* [`runCondition`](#safescope.runCondition) - Run a condition
* [`runNormalizer`](#safescope.runNormalizer) - Run a normalizer
* [`set`](#safescope.set) - Used to set to the target object

### Expected Function Formats

* [`condition`](#condition) - The condition function being called
* [`from`](#from) - The from function being called
* [`normalizer`](#normalizer) - The normalizer function being called
* [`to`](#to) - The to function being called

---

##<a name="main-functions"></a> Main Functions

After the DataMigrator has been created you have access to the following functions

###<a name="addCondition"></a> addCondition(params)

Adds new condition(s) to the private conditions object. This allows the use of key based string referances in the addPath functions.

**Since**

0.1.0

**Arguments**

1. `params` (Object|Array): Object or an array of objects

**Params Object**

- `key`: (String) - The key to use for the condition
- `function`: (Function) - The [`condition`](#condition) function to call

The condition format can be found under [Expected Function Formats](#expected.function.formats) section.

**Returns**

(Integer): The number of conditions added

**Examples**

```js
//Adding a Single Condition
var params = {
  key: 'key',
  function: function(value){
    return true;
  }
};
dataMigrator.addCondition(params);
```
```js
// Adding Mutiple Conditions
params = [{
  key: 'key1',
  function: function(value){
    return true;
  }
},{
  key: 'key2',
  function: function(value){
    return true;
  }
}];
dataMigrator.addCondition(params);
```

<a name="addCondition.internalConditions"></a>**List of available internal conditions**

Most of the internal condition are using the lodash library, for more information please visit their documentation page [link](https://lodash.com/docs). Items starting with `not` are mostly just reverses of the `is` versions, example being `notNull` is just `return ! isNull(value)`.

* true
* isTrue
* notTrue
* false
* isFalse
* notFalse
* isNil
* notNil
* isNull
* notNull
* isEmpty
* notEmpty
* isInteger
* notInteger
* isNumber
* notNumber
* isString
* notString
* isBoolean
* notBoolean
* isArray
* notArray
* eq
* lt
* lte
* gt
* gte
* isEqual
* notEqual

If you do not like the way one of the above functions handles the condition mapping you can simply add a new condition using the same name as above.

###<a name="addNormalizer"></a>addNormalizer(params)

Adds new normalizer(s) to the private normalizers object. This allows the use of key based string referances in the addPath functions.

**Since**

0.1.0

**Arguments**

1. `params` (Object|Array): Object or an array of objects

**Params Object**

- `key`: (String) - The key to use for the normalizer
- `function`: (Function) - The [`normalizer`](#normalizer) function to call

The normalizer format can be found under [Expected Function Formats](#expected.function.formats) section.

**Returns**

(Integer): The number of normalizers added

**Examples**

```js
//Adding a Single Normalizer
var params = {
  key: 'keyId',
  function: function(value){
    return value;
  }
};
var count = dataMigrator.addNormalizer(params); // Returns 1
```
```js
// Adding Mutiple Normalizers
params = [{
  key: 'keyId1',
  function: function(value){
    return value;
  }
},{
  key: 'keyId2',
  function: function(value){
    return value;
  }
}];
var count = dataMigrator.addNormalizer(params); // Returns 2
```

<a name="addCondition.internalConditions"></a>**List of available internal normalizers**

Most of the internal normalizers are using the lodash library, for more information please visit their documentation page [link](https://lodash.com/docs).

* string
* number
* integer
* array

If you do not like the way one of the above functions handles the normalizing you can simply add a new normalizer using the same name as above.

---

### addPath(params)

This function is used in adding path mappings to process. The params argument can be a single object or an array of object

**Since**

0.1.0

**Arguments**

1. `params` (Object|Array): Object or an array of objects

**Params Object**

* [`from`](#addPath.params.from): (String|Array|Function) - This is the path or function for getting the value from the source
* [`fromArray`](#addPath.params.fromArray): (Boolean) - _Optional_
* [`fromCondition`](#addPath.params.fromCondition): (String|Function) - _Optional_
* [`fromConditionArgs`](#addPath.params.fromConditionArgs): (*) - _Optional_
* [`fromConditionTest`](#addPath.params.fromConditionTest): (Boolean) - _Optional_
* [`normalizer`](#addPath.params.normalizer): (String|Function) - _Optional_
* [`normalizerArgs`](#addPath.params.normalizerArgs): (*) - _Optional_
* [`to`](#addPath.params.to): (String|Array|Function) - _Optional_ path or function for setting the value to the target
* [`toArray`](#addPath.params.toArray): (Boolean) - _Optional_
* [`toCondition`](#addPath.params.toCondition): (String|Function) - _Optional_
* [`toConditionArgs`](#addPath.params.toConditionArgs): (*) - _Optional_
* [`toConditionTest`](#addPath.params.toConditionTest): (Boolean) - _Optional_

**Examples**

```js
// Migrate a single path from source.item1 to target.item1
var count = dataMigrator.addPath({
  from: 'item1'
});
```
```js
// Migrate mutiple paths
var count = dataMigrator.addPath({
  from: 'item1'
},{
  from: 'item2'
});
```

####Params Object Details

#####<a name="addPath.params.from"></a>Params.from: (String|Array|Function) - _required_

This is the main required param, which should be a string or array path to the value in the source or a function that will return a value.

If you would like the 'from' to be processed as an array, append [] to the string or as the last item in the array. If you are assigning a functions please see the [params.fromArray](#addPath.params.fromArray) documentation for getting around not having access to adding '[]'.

The [`from`](#from) function format can be found under the [Expected Function Formats](#expected.function.formats) section.

**Examples**

```js
// String Path
params.from = 'firstKey.secondKey[1].thirdKey';
```
```js
// String Path but treat source as an array
params.from = 'firstKey.secondKey[1].thirdKey[]';
```
```js
// Array of path keys
params.from = ['firstKey', 'secondKey', '1', 'thirdKey'];
```
```js
// Array of path keys but treat source as an array
params.from = ['firstKey', 'secondKey', '1', 'thirdKey', '[]'];
```
```js
// Array of path keys but treat source as an array
params.from = ['firstKey', 'secondKey', '1', 'thirdKey[]'];
```
```js
// From function returning a value
params.from = function(){
  return 'value';
};
```

#####<a name="addPath.params.fromArray"></a>Params.fromArray: (Boolean) - _optional_

This param forces the run function to process the source path value as an array, looping through the values calling against the normalizer function and to function with each iteration.

This param will bypass the check for '[]' inside the from forcing it to work with the from as an array.

**Example**

```js
params.fromArray = true;
```

#####<a name="addPath.params.fromCondition"></a>Params.fromCondition: (String|Function) - _optional_

This param allows for a pre-check condition to be checked before running through the normalizer. This can be a string key referencing an already added function [see addCondition()](#addCondition) for more information on adding a new condition or [see addCondition -> Available Internal Conditions()](#addCondition.internalConditions) for a list available functions. Please note addPath will error if the condition string key is not found.

**Examples**

```js
// Use the internal condition 'isTrue'
params.fromCondition = 'isTrue';
```
```js
// Use a custom condition function
params.fromCondition = function(value){
  return value === true;
};
```

#####<a name="addPath.params.fromConditionArgs"></a>Params.fromConditionArgs: (*) - _optional_

This param allows you to send args to the condition function

**Examples**

```js
// Using the internal condition `eq` to check against the args
params.fromConditionArgs = 'testing';
params.fromCondition = 'eq';
```
```js
// Using a custom function check against the args
params.fromConditionArgs = 'testing';
params.fromCondition = function(value, args){
  return value === args;
};
```

#####<a name="addPath.params.fromConditionTest"></a>Params.fromConditionTest: (Boolean) - _optional_

The fromCondition will return a boolean, this setting allows you to change if the condition should match true or false.

**Example**

```js
params.fromConditionTest = true;
```

#####<a name="addPath.params.normalizer"></a>Params.normalizer: (String|Function) - _optional_

This param allows for a process the data before it is saved to the target path. This can be a string key referencing an already added function [see addNormalizer()](#addNormalizer) for more information on adding a new normalizer. Please note addPath will error if the normalizer string key is not found.

The [`normalizer`](#normalizer) function format can be found under the [Expected Function Formats](#expected.function.formats) section.

**Examples**

```js
// Using the internal normalizer 'string'
params.normalizer = 'string';
```
```js
// Using a custom normalizer function
params.normalizer = function(value){
  return _.toString(value);
};
```

#####<a name="addPath.params.normalizerArgs"></a>Params.normalizerArgs: (*) - _optional_

This param allows you to send args to the normalizer function

**Example**

```js
params.normalizerArgs = 1;
params.normalizer = function(value, args){ 
  value = _.toNumber(value) || 1;
  return value * args; 
};
```

#####<a name="addPath.params.to"></a>Params.to: (String|Array|Function) - _optional_

This is the path (or function) to the location you would like to save to.

By default it will use the `from` path (String|Array) but will not work if (Function)

The [`to`](#to) function format can be found under the [Expected Function Formats](#expected.function.formats) section.

If you would like to append the data to an array, append [] to the string or as the last item in the array. If this is not set it will overwrite the data rather then append it. If you are assigning a functions please see the [params.toArray](#addPath.params.toArray) documentation for getting around not having access to adding '[]'.

**Examples**

```js
// Use a string key to set the to
params.to = 'firstKey.secondKey.thirdKey';
```
```js
// Use a key path array to set the to
params.to = ['firstKey', 'secondKey', 'thirdKey'];
```
```js
// Use a to function to set the to value
params.to = function(value){
  targetObject.firstKey.secondKey.thirdKey = value;
};
```
```js
// Use a string key to set the to, and treat it as an array
params.to = 'firstKey.secondKey.thirdKey[]';
```
```js
// Use an array key to set the to, and treat it as an array
params.to = ['firstKey', 'secondKey', 'thirdKey', '[]'];
```

#####<a name="addPath.params.toArray"></a>Params.toArray: (Boolean) - _optional_

This param forces the run function to push to the target path as an array. If the value is not set or is not an array it will be created or converted to an array.

This param will bypass the check for '[]' inside the to forcing it to work with the to as an array.

**Example**

```js
params.toArray = true;
```

#####<a name="addPath.params.toCondition"></a>Params.toCondition: (String|Function) - _optional_

This param allows for a pre-check condition to be checked before saving the data to the target. This can be a string key referencing an already added function [see addCondition()](#addCondition) for more information on adding a new condition or [see addCondition -> Available Internal Conditions()](#addCondition.internalConditions) for a list available functions. Please note addPath will error if the condition string key is not found.

**Examples**

```js
// Use the internal condition 'isEmpty'
params.fromCondition = 'isEmpty';
```
```js
// Use a custom condition function
params.fromCondition = function(value){
  return _.isEmpty(value);
};
```

#####<a name="addPath.params.toConditionArgs"></a>Params.toConditionArgs: (*) - _optional_

This param allows you to send args to the condition function

**Examples**

```js
// Using the internal condition `eq` to check against the args
params.toConditionArgs = 'testing';
params.toCondition = 'eq';
```
```js
// Using a custom function check against the args
params.toConditionArgs = 'testing';
params.toCondition = function(value, args){
  return value === args;
};
```

#####<a name="addPath.params.toConditionTest"></a>Params.toConditionTest: (Boolean) - _optional_

The toCondition will return a boolean, this setting allows you to change if the condition should match true or false.

**Example**

```js
params.toConditionTest = true;
```

---

###<a name="getSource"></a> getSource()

This will return the source object.

**Since**

0.1.0

**Arguments**

- None

**Returns**

(object): The source object

**Example**

```js
var source = dataMigrator.getSource();
```

---

###<a name="getTarget"></a> getTarget()

This will return the target object.

**Since**

0.1.0

**Arguments**

- None

**Returns**

(object): The target object

**Example**

```js
var target = dataMigrator.getTarget();
```

---

###<a name="randomHash"></a> randomHash()

Return a random sh1 hash based of the current date/time, math.random, and a lodash.uniqueId.

The purpose of this function is to create unique ids for the functions added to the Data Migrator.

**Since**

0.1.0

**Arguments**

- None

**Returns**

(string): The generated hash

**Example**

```js
var randomHash = dataMigrator.randomHash();
```

---

###<a name="removeCondition"></a> removeCondition(key)

This will remove a condition based on the key passed in. The key can be an array of keys.

**Since**

0.1.0

**Arguments**

1. `id` (String|Array): The key to be removed or array of keys to be removed.

**Returns**

(integer): Total number of conditions removed

**Examples**

```js
var count = dataMigrator.removeCondition('myCondition');
```
```js
var count = dataMigrator.removeCondition([
  'myCondition1',
  'myCondition2'
]);
```

---

###<a name="removeNormalizer"></a> removeNormalizer(key)

This will remove a normalizer based on the key passed in. The key can be an array of keys.

**Since**

0.1.0

**Arguments**

1. `id` (String|Array): The key to be removed or array of keys to be removed.

**Returns**

(integer): Total number of normalizers removed

**Examples**

```js
var count = dataMigrator.removeNormalizer('myNormalizer');
```
```js
var count = dataMigrator.removeNormalizer([
  'myNormalizer1',
  'myNormalizer2'
]);
```

---

###<a name="removePath"></a> removePath(id)

This will remove a path based on the id. The id can be an array of ids.

**Since**

0.1.0

**Arguments**

1. `id` (String|Array): The string id to be removed or array of string ids to be removed.

**Returns**

(integer): Total number of paths removed

**Examples**

```js
var count = dataMigrator.removePath('89e495e7941cf9e40e6980d14a16bf023ccd4c91');
```
```js
var count = dataMigrator.removePath([
  '89e495e7941cf9e40e6980d14a16bf023ccd4c91',
  'db61277694fea41b42a8ac82cbb678baac683990'
]);
```

---

###<a name="reset"></a> reset(params)

This function allows you to reset diffrent sections of the instance or all sections by calling reset without params.

Please note: if you reset the conditions or normalizers and your paths link to that key it will revert back to using the default behaver which is to pass the value through for normalizer and fail for conditions.

**Since**

0.1.0

**Arguments**

1. `params` (Object): _Optional_ params

**Params Object**

- `conditions`: (Boolean) - Reset the conditions
- `normalizers`: (Boolean) - Reset the normalizers
- `paths`: (Boolean) - Reset the paths
- `source`: (Boolean) - Reset the source to an empty object
- `target`: (Boolean) - Reset the target to an empty object

**Returns**

(null): Nothing is returned

**Examples**

```js
// Reset just the paths
data.Migrator.reset({paths: true});
```
```js
// Reset everything
dataMigrator.reset();
```

---

###<a name="run"></a> run([params], callback)

Run the migration. This will go through the added paths migrating the data.

**Since**

0.1.0

**Arguments**

1. `params` (Object): _Optional_ params.
2. `callback` (*): Callback function

**Params Object**

See the [initialize params](#DataMigrator) for details.

**Returns**

(null): Nothing is returned

**Examples**

```js
// Using both params and callback
dataMigrator.run({}, function(err){
  if(err) console.log(err);
});
```
```js
// Using only a callback
dataMigrator.run(function(err){
  if(err) console.log(err);
});
```

---

###<a name="runCondition"></a> runCondition(key, value, args, conditionTest)

This function runs the condition return a boolean.

**Since**

0.1.0

**Arguments**

1. `key` (String): The key used to find the function to run
2. `value` (*): The value to check the condition against
3. `args` (*): Availble args (if none pass null)
4. `conditionTest` (Boolean): Condition test to use

**Returns**

(Boolean): The results of the condition check

**Example**

```js
var results = runCondition('isEmpty', {}, null, true); // returns true
```

---

###<a name="runNormalizer"></a> runNormalizer(key, value, [args])

This function runs the normalizer and returns a value

**Since**

0.1.0

**Arguments**

1. `key` (String): The key used to find the function to run
2. `value` (*): The value to check the condition against
3. `args` (*): _Optional_ args

**Returns**

(*): The results of the normalizer

**Example**

```js
var results = runNormalizer('isEmpty', {}); // returns true
```

---

###<a name="setSource"></a> setSource(source)

Set the source object

**Since**

0.1.0

**Arguments**

1. `source` (object): The source objcet

**Returns**

(null): Nothing is returned

**Example**

```js
var sourceObject = {};
dataMigrator.setSource(sourceObject);
```

---

###<a name="setTarget"></a> setTarget(target)

Set the target object.

**Since**

0.1.0

**Arguments**

1. `target` (object): The target objcet

**Returns**

(null): Nothing is returned

**Example**

```js
var targetObject = {};
dataMigrator.setTarget(targetObject);
```

---

##<a name="scoped-functions"></a> Scoped Functions

When you pass a function for the to, from, conditions, and normalizers they are bound to a scope with access to the below functions.

Please note that if you use the new arrow functions this feature will not work due to arrow functions being forced into a lexicon scope which can not be overwritten. So if you plan to use these scoped functions please use `function(){}` over the new `()=>{}`.

---

###<a name="safescope.get"></a> get(key)

Get an item from the source object.

**Since**

0.1.0

**Arguments**

1. `key` - (String|Array) - The key used to find the value

**Returns**

(*): The value retrieved from the source

**Examples**

```js
// Get an item using a string key
var item1 = this.get('something1.something2.something3.item1');
```
```js
// Get an item using an array of keys
var item2 = this.get(['something1', 'something2', 'something3', 'item1']);
```

---

###<a name="safescope.set"></a> set(key, value)

Sets the value at path of the target.

**Since**

0.1.0

**Arguments**

1. `key` (String|Array): The key used to find the value
2. `value` (String|Array): The value to set

**Returns**

(object): Returns object.

**Examples**

```js
// Set an item using an string key
this.set('something1.something2.something3.item1', 'newValue');
```
```js
// Set an item using an array of keys
this.set(['something1','something2','something3','item1'], 'newValue');
```

---

###<a name="safescope.runCondition"></a> runCondition(key, value, [args])

See [Main Function -> runCondition(key, value, args, conditionCheck)](#runCondition) for details.

---

###<a name="safescope.runNormalizer"></a> runNormalizer(key, value, [args])

See [Main Function -> runNormaliser(key, value, [args])](#runNormalizer) for details.

---

##<a name="expected.function.formats"></a>Expected Function Formats

Here are the expected function formats

---

###<a name="condition"></a>condition(value, [args])

**Arguments**

1. `value` (*): The item that needs to be normalized
2. `args` (*): _Optional_ args

**Returns**

(Boolean|Error): The results of the condition test

**Example**

```js
var condition = function(value, args){
  return value !== args;
}
```

---

###<a name="from"></a>from([args])

**Arguments**

1. `args` (*): _Optional_ args

**Returns**

(Boolean|Error): Return true is sucessful or Error object if failure.

**Example**

```js
var from = function(args){
  // Get the data from someplace and then return it here
  return args;
}
```
---

###<a name="normalizer"></a>normalizer(value, [args])

**Arguments**

1. `value` (*): The item that needs to be normalized
2. `args` (*): _Optional_ args

**Returns**

(*|Error): The normalized value

**Example**

```js
var normalizer = function(value, args){
  return value * args;
}
```
---

###<a name="to"></a>to(value, [args])

**Arguments**

1. `value` (*): The value to set on the target
1. `args` (*): _Optional_ args

**Returns**

(Boolean|Error): Return true is sucessful or Error object if failure.

**Example**

```js
var condition = function(value, args){
  // Save the value someplace then return true
  return true;
}
```

---
