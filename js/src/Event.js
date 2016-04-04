var Event, Factory, LazyVar, Listener, Void, assert, assertType, didListen, emptyFunction, ref, throwFailure;

ref = require("type-utils"), Void = ref.Void, assert = ref.assert, assertType = ref.assertType;

throwFailure = require("failure").throwFailure;

emptyFunction = require("emptyFunction");

LazyVar = require("lazy-var");

Factory = require("factory");

Listener = require("./Listener");

didListen = LazyVar(function() {
  var event;
  event = Event();
  event._onListen = emptyFunction;
  return event;
});

module.exports = Event = Factory("Event", {
  statics: {
    Listener: Listener,
    didListen: {
      get: function() {
        return didListen.get().listenable;
      }
    }
  },
  initArguments: function(options) {
    assertType(options, [Object, Function, Void]);
    if (options == null) {
      options = {};
    } else if (options.constructor === Function) {
      options = {
        onEvent: options
      };
    }
    return [options];
  },
  optionTypes: {
    onEvent: Function.Maybe,
    onSetListeners: Function.Maybe
  },
  customValues: {
    listenerCount: {
      get: function() {
        return this._listenerCount;
      }
    },
    emit: {
      lazy: function() {
        var self;
        self = this;
        return function() {
          return self._notifyListeners(this, arguments);
        };
      }
    },
    emitArgs: {
      lazy: function() {
        var self;
        self = this;
        return function(args) {
          return self._notifyListeners(this, args);
        };
      }
    },
    listenable: {
      lazy: function() {
        var self;
        self = (function(_this) {
          return function(options) {
            return _this(options);
          };
        })(this);
        self.once = (function(_this) {
          return function(options) {
            return _this.once(options);
          };
        })(this);
        return self;
      }
    }
  },
  initValues: function(options) {
    return {
      _isNotifying: false,
      _detachQueue: [],
      _listeners: null,
      _onSetListeners: options.onSetListeners
    };
  },
  initReactiveValues: function() {
    return {
      _listenerCount: 0
    };
  },
  init: function(options) {
    if (options.onEvent) {
      return this(options.onEvent);
    }
  },
  boundMethods: ["_detachListener"],
  func: function(onEvent) {
    return this._attachListener(Listener({
      onEvent: onEvent,
      onStop: this._detachListener
    }));
  },
  once: function(onEvent) {
    return this._attachListener(Listener({
      onEvent: onEvent,
      maxCalls: 1,
      onStop: this._detachListener
    }));
  },
  many: function(maxCalls, onEvent) {
    return this._attachListener(Listener({
      onEvent: onEvent,
      maxCalls: maxCalls,
      onStop: this._detachListener
    }));
  },
  reset: function() {
    var i, len, listener, oldValue;
    oldValue = this._listeners;
    if (!oldValue) {
      return;
    }
    if (oldValue.constructor === Listener) {
      oldValue._defuse();
    } else {
      for (i = 0, len = oldValue.length; i < len; i++) {
        listener = oldValue[i];
        listener._defuse();
      }
    }
    this._setListeners(null, 0);
  },
  _attachListener: function(listener) {
    var oldValue;
    assertType(listener, Listener);
    oldValue = this._listeners;
    if (!oldValue) {
      this._setListeners(listener, 1);
    } else if (oldValue.constructor === Listener) {
      this._setListeners([oldValue, listener], 2);
    } else {
      oldValue.push(listener);
      this._setListeners(oldValue, oldValue.length);
    }
    this._onListen(listener);
    return listener;
  },
  _onListen: function(listener) {
    return didListen.get().emit(this, listener);
  },
  _notifyListeners: function(scope, args) {
    var i, len, listener, oldValue;
    oldValue = this._listeners;
    if (!oldValue) {
      return;
    }
    this._isNotifying = true;
    if (oldValue.constructor === Listener) {
      oldValue.notify(scope, args);
    } else {
      for (i = 0, len = oldValue.length; i < len; i++) {
        listener = oldValue[i];
        listener.notify(scope, args);
      }
    }
    this._isNotifying = false;
    return this._detachListeners(this._detachQueue);
  },
  _detachListener: function(listener) {
    var index, newCount, oldValue;
    if (this._isNotifying) {
      this._detachQueue.push(listener);
      return;
    }
    oldValue = this._listeners;
    if (oldValue.constructor === Listener) {
      assert(listener === oldValue);
      this._setListeners(null, 0);
    } else {
      index = oldValue.indexOf(listener);
      assert(index >= 0);
      oldValue.splice(index, 1);
      newCount = oldValue.length;
      if (newCount === 1) {
        this._setListeners(oldValue[0], 1);
      } else {
        this._setListeners(oldValue, newCount);
      }
    }
  },
  _detachListeners: function(listeners) {
    var count, i, len, listener;
    count = listeners.length;
    if (count === 0) {
      return;
    }
    if (count === 1) {
      this._detachListener(listeners[0]);
    } else {
      for (i = 0, len = listeners.length; i < len; i++) {
        listener = listeners[i];
        this._detachListener(listener);
      }
    }
    return listeners.length = 0;
  },
  _setListeners: function(newValue, newCount) {
    assert(newCount !== this._listenerCount);
    if (newValue !== this._listeners) {
      this._listeners = newValue;
    }
    this._listenerCount = newCount;
    if (!this._onSetListeners) {
      return;
    }
    return this._onSetListeners(newValue, newCount);
  }
});

//# sourceMappingURL=../../map/src/Event.map
