import assert = require('assert');
import Future = require('../lib/future');

describe('Future', function () {
  describe('constructor', function () {
    it('returns a Future object with a callback', function () {
      let future = new Future(function (callback) {
        setTimeout(callback, 0);
      });
      assert.equal(future.constructor, Future);
    });
  });

  describe('#onSuccess', function () {
    it('registers a success callback.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, null, 10), 0);
      });
      future.onSuccess(function (result) {
        assert.equal(result, 10);
        done();
      });
      future.end();
    });
  });

  describe('#onFailure', function () {
    it('registers a failure callback.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, new Error('hello, error!'), 0));
      });
      future.onFailure(function (err) {
        assert.equal(err.message, 'hello, error!');
        done();
      });
      future.end();
    });
  });

  describe('#map', function () {
    it('maps the result of a Future into another result.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, null, 10));
      });
      let mapedFuture = future.map(function (result: number) {
        return result + ' times!';
      });
      mapedFuture.onSuccess(function (result: string) {
        assert.equal(result, '10 times!');
        done();
      });
      mapedFuture.end();
    });

    it('throws error when the original future throws error.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, new Error('hello, error!')));
      });
      let mapedFuture = future.map(function (result: number) {
        return result + ' times!';
      });
      mapedFuture.onFailure(function (err) {
        assert.equal(err.message, 'hello, error!');
        done();
      });
      mapedFuture.end();
    });
  });

  describe('#flatMap', function () {
    it('maps the result of a Future into another futured result.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, null, 10));
      });
      let flatMappedFuture = future.flatMap(function (result: number) {
        let future = new Future(function (callback) {
          setTimeout(callback.bind(null, null, result + ' times!'));
        });
        return future;
      });
      flatMappedFuture.onSuccess(function (result: string) {
        assert.equal(result, '10 times!');
        done();
      });
      flatMappedFuture.end();
    });

    it('throws error when the original future throws error.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, new Error('hello, error!')));
      });
      let flatMappedFuture = future.flatMap(function (result: number) {
        let future = new Future(function (callback) {
          setTimeout(callback.bind(null, null, result + ' times!'));
        });
        return future;
      });
      flatMappedFuture.onFailure(function (err) {
        assert.equal(err.message, 'hello, error!');
        done();
      });
      flatMappedFuture.end();
    });

    it('throws error when a mapped future throws error.', function (done) {
      let future = new Future(function (callback) {
        setTimeout(callback.bind(null, null, 10));
      });
      let flatMappedFuture = future.flatMap(function (result: number) {
        let future = new Future(function (callback) {
          setTimeout(callback.bind(null, new Error('hello, error!')));
        });
        return future;
      });
      flatMappedFuture.onFailure(function (err) {
        assert.equal(err.message, 'hello, error!');
        done();
      });
      flatMappedFuture.end();
    });
  });
});