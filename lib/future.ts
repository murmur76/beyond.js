import async = require('async');

interface FutureFunction<T> {
  (cb: FutureCallback<T>): void;
}

interface FutureCallback<T> {
  (err?: Error, result?: T): void;
}

interface FutureSuccessCallback<T> {
  (result: T): void;
}

interface FutureFailureCallback {
  (err: Error): void;
}

interface FutureCompleteCallback<T> {
  (result: Error | T, isSuccess: boolean): void;
}

class Future<T> {
  private fn: FutureFunction<T>;
  private completeCallback: FutureCompleteCallback<T>;
  private successCallback: FutureSuccessCallback<T>;
  private failureCallback: FutureFailureCallback;

  constructor(fn: FutureFunction<T>) {
    this.fn = fn;
  }

  onComplete(callback: FutureCompleteCallback<T>) {
    this.completeCallback = callback;
    return this;
  }

  onSuccess(callback: FutureSuccessCallback<T>) {
    this.successCallback = callback;
    return this;
  }

  onFailure(callback: FutureFailureCallback) {
    this.failureCallback = callback;
    return this;
  }

  map<U>(mapping: (org: T) => U): Future<U> {
    let future = new Future<U>((cb: FutureCallback<U>) => {
      this.fn(function (err, result) {
        if (err) {
          cb(err);
        } else {
          cb(null, mapping(result));
        }
      });
    });
    return future;
  }

  flatMap<U>(futuredMapping: (org: T) => Future<U>): Future<U> {
    let future = new Future<U>((cb: FutureCallback<U>) => {
      this.fn(function (err, result) {
        if (err) {
          cb(err);
        } else {
          futuredMapping(result)
            .onSuccess(function (data: U) {
              cb(null, data);
            })
            .onFailure(cb)
            .end();
        }
      });
    });
    return future;
  }

  end() {
    this.fn((err, result) => {
      if (err) {
        if (this.failureCallback) {
          this.failureCallback(err);
        }
        if (this.completeCallback) {
          this.completeCallback(err, false);
        }
      } else {
        if (this.successCallback) {
          this.successCallback(result);
        }
        if (this.completeCallback) {
          this.completeCallback(result, true);
        }
      }
    });
    return this;
  }

  static sequence(...futures: Future<any>[]): Future<any[]> {
    return new Future(function (cb: FutureCallback<any[]>) {
      async.parallel(
        futures.map((future: Future<any>) => {
          return (asyncCallback) => {
            future
              .onSuccess((result) => {
                asyncCallback(null, result);
              })
              .onFailure(asyncCallback)
              .end();
          };
        })
      , cb);
    });
  }

  static successful<T>(result: T): Future<T> {
    return new Future((callback) => {
      setTimeout(() => callback(null, result), 0);
    });
  }
}

export = Future;
