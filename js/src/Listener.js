var Tracer, Type, emptyFunction, guard, isType, throwFailure, type;

throwFailure = require("failure").throwFailure;

isType = require("type-utils").isType;

emptyFunction = require("emptyFunction");

Tracer = require("tracer");

guard = require("guard");

Type = require("Type");

type = Type("Listener");

type.optionTypes = {
  onEvent: Function,
  onStop: Function,
  maxCalls: Number
};

type.optionDefaults = {
  onStop: emptyFunction,
  maxCalls: 2e308
};

type.createArguments(function(args) {
  if (isType(args[0], Function)) {
    args[0] = {
      onEvent: args[0]
    };
  }
  return args;
});

type.defineFrozenValues({
  maxCalls: function(options) {
    return options.maxCalls;
  }
});

type.defineValues({
  calls: function() {
    if (this.maxCalls !== 2e308) {
      return 0;
    }
  },
  notify: function() {
    if (this.maxCalls === 2e308) {
      return this._notifyUnlimited;
    }
    return this._notifyLimited;
  },
  _onEvent: function(options) {
    return options.onEvent;
  },
  _onStop: function(options) {
    return options.onStop;
  },
  _onDefuse: function() {
    return emptyFunction;
  }
});

if (isDev) {
  type.defineValues({
    _traceInit: function() {
      return Tracer("Listener()");
    }
  });
}

type.defineMethods({
  stop: function() {
    this._defuse();
    this._onStop(this);
  },
  _notifyUnlimited: function(scope, args) {
    guard((function(_this) {
      return function() {
        return _this._onEvent.apply(scope, args);
      };
    })(this)).fail((function(_this) {
      return function(error) {
        return throwFailure(error, {
          scope: scope,
          args: args,
          listener: _this
        });
      };
    })(this));
  },
  _notifyLimited: function(scope, args) {
    this.calls += 1;
    guard((function(_this) {
      return function() {
        return _this._onEvent.apply(scope, args);
      };
    })(this)).fail((function(_this) {
      return function(error) {
        return throwFailure(error, {
          scope: scope,
          args: args,
          listener: _this
        });
      };
    })(this));
    if (this.calls === this.maxCalls) {
      this.stop();
    }
  },
  _defuse: function() {
    this.notify = emptyFunction.thatReturnsFalse;
    this._defuse = this.stop = emptyFunction;
    this._onDefuse();
  }
});

module.exports = type.build();

//# sourceMappingURL=../../map/src/Listener.map
