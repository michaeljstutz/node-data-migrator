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
};

var targetObject = {
  newItem1: 0,
  newItem2: 0,
  newItem3: 0,
  newItem4: 4,
};

var dataMigrator = new DataMigrator({source:sourceObject, target:targetObject});

dataMigrator.addPath({from:'item1', to:'newItem1', normalizer: function(value){ return value; }});
dataMigrator.addPath({from:'item2', to:'newItem2', normalizer:'number'});
dataMigrator.addPath({from:'item3[0]', to:'newItem3', fromCondition:'isNumber'});
dataMigrator.addPath({from:'item4', to:'newItem4', toCondition:'isEmpty'});

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
  "toConditionFailed": 0,
  "totalToPathsProcessed": 4,
  "totalFromPathsProcessed": 4
}
{
  "newItem1": 1,
  "newItem2": 2,
  "newItem3": 3,
  "newItem4": 4
}
```
