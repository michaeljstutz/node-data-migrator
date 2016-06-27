'use strict';

const _ = require('lodash');
const expect = require('chai').expect
// Memory tests
//const memwatch = require('memwatch-next');
//memwatch.on('leak', function(info) { console.log(info) });
//memwatch.on('stats', function(stats) { console.log(stats) });

const DataMigrator = require('../lib/data-migrator');

describe('Working with DataMigrator', function(done) {
  //TODO: create a better testSource
  let testSource = {
    testing:true,
    sourceObject1: {
      key1: true,
      key2: false,
      key3: 1,
      key4: '2',
      key5: [1,2,3,4,5],
      key6: {one:1, two:'2', three: 3, four: 4, five: '5'},
    },
  };
  let testTarget = {
    testing:true,
    sourceObject1:{
      key1: false 
    }
  };
  let dataMigrator = new DataMigrator();
  describe('Base functionality', function() {
    it('should be created using the new keyword to create an instance', function(done){
      expect(DataMigrator).to.throw('Object must be created using the new keyword');
      expect(new DataMigrator()).to.be.an('object');
      done();  
    });
    it('should support passing in starting params', function(){
      let testMigrator = new DataMigrator({
        source: testSource,
        target: testTarget,
        conditions: [{key:'testing', function:(value)=>{return true;}}],
        normalizers: [{key:'testing', function:(value)=>{return value;}}],
        paths: [{from:'sourceObject1'}],
      });
      expect(testMigrator._source).to.deep.equal(testSource);
      expect(testMigrator._target).to.deep.equal(testTarget);
      expect(Object.keys(testMigrator._conditions).length).to.be.a('number', 1);
      expect(Object.keys(testMigrator._normalizers).length).to.be.a('number', 1);
      expect(Object.keys(testMigrator._paths).length).to.be.a('number', 1);
    });
  });
  describe('setSource() & getSource()', function() {
    it('should throw an error when passed a bad object', function(){
      expect(dataMigrator.setSource.bind(dataMigrator, 1)).to.throw('source must be a object and not null');
    });
    it('should not throw an error when passing a object', function(){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      expect(dataMigrator._source).to.deep.equal(testSource);
    });
    it('should return an object with the same testing value', function(){
      expect(dataMigrator.getSource.bind(dataMigrator)()).that.is.an('object')
        .to.deep.equal(testSource);
    });
  });
  describe('setTarget() & getTarget()', function() {
    it('should throw an error when passed a bad object', function(){
      expect(dataMigrator.setTarget.bind(dataMigrator, 1)).to.throw('target must be a object and not null');
    });
    it('should not throw an error when passing a object', function(){
      expect(dataMigrator.setTarget.bind(dataMigrator, testTarget)).to.not.throw('target must be a object and not null');
      expect(dataMigrator._target).to.deep.equal(testTarget);
    });
    it('should return an object with the same testing value', function(){
      expect(dataMigrator.getTarget.bind(dataMigrator)()).that.is.an('object')
        .to.deep.equal(testTarget);
    });
  });
  describe('reset()', function() {
    it('should be able to reset everything', function(){
      expect(dataMigrator.reset.bind(dataMigrator)).to.not.throw();
    });
  });
  describe('addPath()', function() {
    let testParams = {};
    it('should throw an error if not passed an object or array', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, 'invalid')).to.throw('params is not an array or an object');
    });
    it('should throw an error when parms.from is missing', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params[0].from is required');
    });
    it('should throw an error when parms.from is empty', function(){
      testParams.from = '';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params[0].from can not be empty');
    });
    it('should support passing params.from as a string', function(){
      testParams.from = 'sourceObject1.key1';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
      testParams.from = 'sourceObject1.key1()';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
      testParams.from = 'sourceObject1.key1[]';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
    });
    it('should support passing params.from as an array', function(){
      testParams.from = ['sourceObject1','key1'];
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
      testParams.from = ['sourceObject1','key1', '[]'];
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
      testParams.from = ['sourceObject1','key1', '()'];
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
    });
    it('should support passing params.from as a function', function(){
      testParams.from = () => {return 1;};
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.not.throw();
    });
    it('should support adding in an array of path objects', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, [
        {from:'sourceObject1.key1'},
        {from:'sourceObject1.key2'},
      ])).to.not.throw();
    });
    it('should throw an error with details on which path caused the problem (when passing an array)', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, [
        {from:'sourceObject1.key1'},
        {from:''},
      ])).to.throw('params[1].from can not be empty');
    });
    it('should return the total added count', function(){
      testParams.from = 'sourceObject1.key1';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)()).that.is.an('array').and.not.be.empty;
    });
    it('should throw an error when parms.fromCondition is not valid', function(){
      testParams.fromCondition = {};
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params[0].fromCondition is not a function or string');
    });
    it('should throw an error when parms.fromCondition is not valid', function(){
      testParams.fromCondition = 'invalid';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params[0].fromCondition function can not be found');
    });
    it('should not throw an error with a valid parms.fromCondition string', function(){
      testParams.fromCondition = 'notNull';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).not.to.throw();
    });
    it('should throw an error when parms.toCondition is not valid', function(){
      testParams.toCondition = {};
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params[0].toCondition is not a function or string');
    });
    it('should throw an error when parms.toCondition is not valid', function(){
      testParams.toCondition = 'invalid';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params[0].toCondition function can not be found');
    });
    it('should not throw an error with a valid parms.toCondition string', function(){
      testParams.toCondition = 'notNull';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).not.to.throw();
    });
    it('should support params.toConditionTest allowing the condition test to match true or false', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, [
        {from:'sourceObject1.key1', toCondition: 'false', toConditionTest: false}
      ])).to.not.throw();
    });
    it('should support params.normalizerArgs to be passed to the normalizer function', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, [
        {from:'sourceObject1.key1', normalizer: 'string', normalizerArgs: {test:true}}
      ])).to.not.throw();
    });
  });
  describe('removePath()', function() {
    it('should remove path given the id passed in', function(){
      expect(dataMigrator.reset.bind(dataMigrator)).to.not.throw();
      let samplePath = {from:'sourceObject1.key1', normalizer: 'string'};
      let sampleIds = dataMigrator.addPath.bind(dataMigrator, samplePath)();
      expect(dataMigrator.getPath.bind(dataMigrator, sampleIds[0])()).to.not.be.false;
      expect(dataMigrator.removePath.bind(dataMigrator, {id:sampleIds[0]})).to.not.throw();
      expect(dataMigrator.getPath.bind(dataMigrator, sampleIds[0])()).to.be.false;
    });
  });
  describe('addCondition()', function() {
    it('should be able to add a new conditon function', function(){
      expect(dataMigrator.addCondition.bind(dataMigrator, [
        {key:'test1', function: (value)=>{return true;}}
      ])).to.not.throw();
    });
    it('should throw an error if function is not a function', function(){
      expect(dataMigrator.addCondition.bind(dataMigrator, [
        {key:'test2', function: 'false'}
      ])).to.throw('params[0].function must be a function');
    });
  });
  describe('removeCondition()', function() {
    it('should be able to remove condition function by key', function(){
      expect(dataMigrator.addCondition.bind(dataMigrator, [
        {key:'test1', function: (value)=>{return true;}}
      ])).to.not.throw();
      expect(dataMigrator.removeCondition.bind(dataMigrator, [
        {key:'test1'}
      ])).to.not.throw();
    });
  });
  describe('addNormalizer()', function() {
    it('should be able to add a new normalizer function', function(){
      expect(dataMigrator.addNormalizer.bind(dataMigrator, [
        {key:'test1', function: (value)=>{return value;}}
      ])).to.not.throw();
    });
    it('should throw an error if function is not a function', function(){
      expect(dataMigrator.addNormalizer.bind(dataMigrator, [
        {key:'test2', function: 'false'}
      ])).to.throw('params[0].function must be a function');
    });
  });
  describe('removeNormalizer()', function() {
    it('should be able to remove the normalizer function by key', function(){
      expect(dataMigrator.addNormalizer.bind(dataMigrator, [
        {key:'test1', function: (value)=>{return value;}}
      ])).to.not.throw();
      expect(dataMigrator.removeNormalizer.bind(dataMigrator, [
        {key:'test1'}
      ])).to.not.throw();
    });
  });
  describe('clearPaths()', function() {
    it('should clear all the current paths', function(){
      expect(dataMigrator.clearPaths.bind(dataMigrator)()).that.is.a('boolean', true);
    });
  });
  describe('reset()', function() {
    it('should be able reset all the internal values', function(){
      expect(dataMigrator.reset.bind(dataMigrator)).to.not.throw();
    });
  });
  describe('run()', function() {
    it('should supporting passing in most of the params', function(){
      expect(dataMigrator.reset.bind(dataMigrator)).to.not.throw();
      expect(dataMigrator.run.bind(dataMigrator, {
        source: testSource,
        target: testTarget,
        conditions: [{key:'testing', function:(value)=>{return true;}}],
        normalizers: [{key:'testing', function:(value)=>{return value;}}],
        paths: [{from:'sourceObject1'}],      
      })).not.to.throw();
      expect(dataMigrator._source).to.deep.equal(testSource);
      expect(dataMigrator._target).to.deep.equal(testTarget);
      expect(Object.keys(dataMigrator._conditions).length).to.be.a('number', 1);
      expect(Object.keys(dataMigrator._normalizers).length).to.be.a('number', 1);
      expect(Object.keys(dataMigrator._paths).length).to.be.a('number', 1);
    });
    it('should process all the paths added', function(done){
      expect(dataMigrator.reset.bind(dataMigrator)).to.not.throw();
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      dataMigrator.addPath(
        {
          from:'sourceObject1.key1',
          fromCondition: 'isEqual',
          fromConditionValue: true,
        }
      );
      dataMigrator.addPath({from:'sourceObject1.key2'});
      dataMigrator.addPath({from:'sourceObject1.key3'});
      dataMigrator.addPath({from:'sourceObject1.key4'});
      dataMigrator.addPath({from:'sourceObject1.key5'});
      dataMigrator.addPath({from:'sourceObject1.key6'});
      dataMigrator.run({}, (err, results)=>{
        dataMigrator.clearPaths();
        done();
      });
    });
    it('should work with custom condition functions', function(done){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      dataMigrator.addPath(
        {
          from:'sourceObject1.key1',
          fromCondition: 'isBoolean',
        }
      );
      dataMigrator.addPath(
        {
          from:'sourceObject1.key2',
          fromCondition: (value) => { return _.isBoolean(value); },
        }
      );
      dataMigrator.run({}, (err, stats)=>{
        expect(stats).to.have.property('totalFromPathsProcessed', 2);
        dataMigrator.clearPaths();
        done();
      });
    });
    it('should work with custom normalizer functions', function(done){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      dataMigrator.addNormalizer({key:'sqValue', function: function(value) { return _.toNumber(value) * _.toNumber(value); } });
      dataMigrator.addPath(
        {
          from:'sourceObject1.key4',
          normalizer: 'sqValue',
        }
      );
      dataMigrator.run({}, (err, stats)=>{
        expect(stats).to.have.property('totalFromPathsProcessed', 1);
        dataMigrator.clearPaths();
        dataMigrator.removeNormalizer({key:'sqValue'});
        done();
      });
    });
    it('should return detailed stats on the results of the function', function(done){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      dataMigrator.addNormalizer({key:'sqValue', function: function(value) { return _.toNumber(value) * _.toNumber(value); } });
      dataMigrator.addPath(
        {
          from:'sourceObject1.key4',
          normalizer: 'sqValue',
        }
      );
      dataMigrator.run({}, (err, stats)=>{
        expect(stats).to.have.property('sourceUriNotFound', 0);
        expect(stats).to.have.property('fromConditionFailed', 0);
        expect(stats).to.have.property('toConditionFailed', 0);
        expect(stats).to.have.property('totalToPathsProcessed', 1);
        expect(stats).to.have.property('totalFromPathsProcessed', 1);
        dataMigrator.clearPaths();
        dataMigrator.removeNormalizer({key:'sqValue'});
        done();
      });
    });
    it('should work with appending items from one array into another', function(done){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      let tempTarget = {sourceObject1:{key5:[10,20,30,40,50]}};
      expect(dataMigrator.setTarget.bind(dataMigrator, tempTarget)).to.not.throw('source must be a object and not null');
      dataMigrator.addPath(
        {
          from:'sourceObject1.key5[]',
          to:'sourceObject1.key5[]',
        }
      );

      dataMigrator.run({}, (err, stats)=>{
        expect(dataMigrator._target.sourceObject1.key5).to.have.lengthOf(10);
        dataMigrator.clearPaths();
        done();
      });
    });
    it('should work with appending items from one array into another', function(done){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a object and not null');
      let tempTarget = {sourceObject1:{key5:[10,20,30,40,50]}};
      expect(dataMigrator.setTarget.bind(dataMigrator, tempTarget)).to.not.throw('source must be a object and not null');
      dataMigrator.addPath(
        {
          from:'sourceObject1.key5[]',
          to:'sourceObject1.key5[]',
        }
      );

      dataMigrator.run({}, (err, stats)=>{
        expect(dataMigrator._target.sourceObject1.key5).to.have.lengthOf(10);
        dataMigrator.clearPaths();
        done();
      });
    });
    it('should work with passing an object of options', function(done){
      let sourceObject = {
        item1: 1,
        item2: '2',
        item3: [3],
        item4: 4,
        item5: 4,
      };

      let targetObject = {
        item1: 0,
        item2: 0,
        item3: 0,
        item4: 0,
        item5: 5,
      };

      let dataMigrator = new DataMigrator();

      // addPath supports the following keys 
      dataMigrator.addPath({from:'item1'});
      dataMigrator.addPath({from:'item2', to:'item2', normalizer: 'number'});
      dataMigrator.addPath({from:'item3[0]', to:'item3'});
      dataMigrator.addPath({from:'item4', fromCondition:'isNumber', normalizer: function(value){ return value * 1; }});
      dataMigrator.addPath({from:'item5', toCondition:'notEqual', toConditionArgs: 5});

      dataMigrator.run({source:sourceObject, target:targetObject}, function(err, stats){
        expect(targetObject).to.deep.equal({
          item1: 1,
          item2: 2,
          item3: 3,
          item4: 4,
          item5: 5,
        });
        done();
      });
    });
  });
  describe('Create output for the README', function() {
    it('should console.log some results', function(done){
      let sourceObject = {
        item1: 1,
        item2: '2',
        item3: [3],
        item4: 4,
        item5: 4,
      };

      let targetObject = {
        item1: 0,
        item2: 0,
        item3: 0,
        item4: 0,
        item5: 5,
      };

      let dataMigrator = new DataMigrator({source:sourceObject, target:targetObject});

      // addPath supports the following keys 
      dataMigrator.addPath({from:'item1'});
      dataMigrator.addPath({from:'item2', to:'item2', normalizer: 'number'});
      dataMigrator.addPath({from:'item3[0]', to:'item3'});
      dataMigrator.addPath({from:'item4', fromCondition:'isNumber', normalizer: function(value){ return value * 1; }});
      dataMigrator.addPath({from:'item5', toCondition:'notEqual', toConditionArgs: 5});

      dataMigrator.run(function(err, stats){
        console.log('dataMigrator.run() has completed with the below stats...');
        console.log(JSON.stringify(stats, null, 2));
        console.log(JSON.stringify(targetObject, null, 2));
        expect(targetObject).to.deep.equal({
          item1: 1,
          item2: 2,
          item3: 3,
          item4: 4,
          item5: 5,
        });
        done();
      });
    });
  });
  /* Added for later
  describe('exportPaths()', function() {
    it('should support exporting a list of paths');
  });
  describe('importPaths()', function() {
    it('should support adding in an exported list of paths');
  });
  */
});
