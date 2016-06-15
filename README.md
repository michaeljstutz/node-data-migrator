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
var dataMigrator = new DataMigrator();

```
## Quick Examples

```js

var sourceObject = {
  item1: 1,
  item2: '2',
  item3: true,
  item4: [1,2,3,4],
  item5: {subItem1: 1, subItem2: '2'},
};

var targetObject = {
  newItem1: [],
  newItem2: {},
};

dataMigrator.addSource(sourceObject);
dataMigrator.addTarget(targetObject);

dataMigrator.addPath({from:'item1', to:'newItem2.item1', normalize: function(value){ return value * 10; }});
dataMigrator.addPath({from:'item2', to:'newItem2.item2', normalize:'number'});
dataMigrator.addPath({from:'item3', to:'newItem2.item3', fromCondition:'isNumber'});
dataMigrator.addPath({from:'item4[1]', to:'newItem1[]'}, fromCondition:'isNumber', toCondition:'isArray');
dataMigrator.addPath({from:'item4[3]', to:'newItem1[]'}, fromCondition:'isNumber', toCondition:'isArray');
dataMigrator.addPath({from:'item4[0]', to:'newItem1[]'}, fromCondition:'isNumber', toCondition:'isArray');
dataMigrator.addPath({from:'item4[2]', to:'newItem1[]'}, fromCondition:'isNumber', toCondition:'isArray');
dataMigrator.addPath({from:'item5.subItem1', to:'newItem2.item5.subItem1', normalize:'string'});
dataMigrator.addPath({from:'item5.subItem2', to:'newItem2.item5.subItem2', normalize:'string'});

dataMigrator.run(function(err, stats){
  console.log('dataMigrator.run() has completed with the below stats...');
  console.log(JSON.stringify(stats, null, 2));
  console.log(JSON.stringify(targetObject, null, 2));
});
```
###The code should display the following on the console
```js
dataMigrator.run() has completed with the below stats...
stats: {
  "totalPathsProcessed": 9,
  "sourceUriNotFound": 0,
  "fromConditionFailed": 1,
  "toConditionFailed": 0
}
sourceObject: {
  "item1": 1,
  "item2": "2",
  "item3": true,
  "item4": [
    1,
    2,
    3,
    4
  ],
  "item5": {
    "subItem1": 1,
    "subItem2": "2"
  }
}
targetObject: {
  "newItem1": [
    2,
    4,
    1,
    3
  ],
  "newItem2": {
    "item1": 10,
    "item2": 2,
    "item5": {
      "subItem1": "1",
      "subItem2": "2"
    }
  }
}


```

Note: the fromConditionFailed: 1 count value is because the condition isNumber failed for item3 (was a boolean)

