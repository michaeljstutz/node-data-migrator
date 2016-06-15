'use strict';

const _ = require('lodash');
const expect = require('chai').expect
//const memwatch = require('memwatch-next');

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
      key6: {},
    },
    sourceObject2: {
      sourceArray: [
        1,
        '2',
        {
          type: 'test',
          value: 'true',
        },
        [
          '1',
          '2',
          '3',
        ],
      ],
    },
  };
  let testTarget = {testing:true};
  let dataMigrator = new DataMigrator();
  describe('Base functionality', function(done) {
    it('should be created using the new keyword to create an instance');
    it('should support passing in starting params');
  });
  describe('setSource() & getSource()', function() {
    it('should throw an error when passed a bad object', function(){
      expect(dataMigrator.setSource.bind(dataMigrator, 1)).to.throw('source must be a plain object and not null');
    });
    it('should not throw an error when passing a plain object', function(){
      expect(dataMigrator.setSource.bind(dataMigrator, testSource)).to.not.throw('source must be a plain object and not null');
    });
    it('should return an object with the same testing value', function(){
      expect(dataMigrator.getSource.bind(dataMigrator)()).that.is.an('object')
        .to.have.property('testing', testSource.testing);
    });
  });
  describe('setTarget() & getTarget()', function() {
    it('should throw an error when passed a bad object', function(){
      expect(dataMigrator.setTarget.bind(dataMigrator, 1)).to.throw('target must be a plain object and not null');
    });
    it('should not throw an error when passing a plain object', function(){
      expect(dataMigrator.setTarget.bind(dataMigrator, testTarget)).to.not.throw('target must be a plain object and not null');
    });
    it('should return an object with the same testing value', function(){
      expect(dataMigrator.getTarget.bind(dataMigrator)()).that.is.an('object')
        .to.have.property('testing', testTarget.testing);
    });
  });
  describe('addPath()', function() {
    let testParams = {};
    it('should throw an error when parms.from is missing', function(){
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params.from is required');
    });
    it('should return the added pathId', function(){
      testParams.from = '';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)()).that.is.a('string');
    });
    it('should throw an error when parms.fromCondition is not valid', function(){
      testParams.fromCondition = {};
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params.fromCondition is not a function or string');
    });
    it('should throw an error when parms.fromCondition is not valid', function(){
      testParams.fromCondition = 'invalid';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params.fromCondition function from string can not be found');
    });
    it('should not throw an error with a valid parms.fromCondition string', function(){
      testParams.fromCondition = 'notNull';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).not.to.throw();
    });
    it('should throw an error when parms.toCondition is not valid', function(){
      testParams.toCondition = {};
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params.toCondition is not a function or string');
    });
    it('should throw an error when parms.toCondition is not valid', function(){
      testParams.toCondition = 'invalid';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).to.throw('params.toCondition function from string can not be found');
    });
    it('should not throw an error with a valid parms.toCondition string', function(){
      testParams.toCondition = 'notNull';
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)).not.to.throw();
    });
    it('should support from being a function');
    it('should support to being a function');
  });
  describe('removePath()', function() {
    it('should remove path given the id passed in');
  });
  describe('addCondition()', function() {
    it('should be able to add a new conditon function');
  });
  describe('removeCondition()', function() {
    it('should be able to remove condition function by key');
  });
  describe('addNormalize()', function() {
    it('should be able to add a new normalize function');
  });
  describe('removeNormalize()', function() {
    it('should be able to remove the normalize function by key');
  });
  describe('clearPaths()', function() {
    it('should clear all the current paths', function(){
      expect(dataMigrator.clearPaths.bind(dataMigrator)()).that.is.a('boolean', true);
    });
  });
  describe('run()', function() {
    it('should supporting passing in most of the params');
    it('should process all the paths added', function(done){
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
        done();
      });
    });
    it('should return detailed stats on the results of the function');
    it('should work with custom from functions');
    it('should work with custom to functions');
    it('should work with custom condition functions');
    it('should work with custom noramlize functions');
  });
  describe('addPaths()', function() {
    it('should support adding in an array of path objects');
  });
  describe('exportPaths()', function() {
    it('should support exporting a list of paths');
  });
  describe('importPaths()', function() {
    it('should support adding in an exported list of paths');
  });
});
