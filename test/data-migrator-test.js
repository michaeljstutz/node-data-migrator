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
  let testTarget = {};
  let dataMigrator = new DataMigrator();
  describe('Main functionality', function(done) {
    it('should be called using new creating a new instance');
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
      expect(dataMigrator.addPath.bind(dataMigrator, testParams)()).that.is.an('string');
    });
  });
  describe('run()', function(done) {
    it('should process all the fields added', function(done){
      dataMigrator.run({}, (err)=>{
        done();
      });
    });
  });
});