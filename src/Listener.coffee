
{ throwFailure } = require "failure"
{ isType } = require "type-utils"

emptyFunction = require "emptyFunction"
Tracer = require "tracer"
guard = require "guard"
Type = require "Type"

type = Type "Listener"

type.optionTypes =
  onEvent: Function
  onStop: Function
  maxCalls: Number

type.optionDefaults =
  onStop: emptyFunction
  maxCalls: Infinity

type.createArguments (args) ->
  args[0] = { onEvent: args[0] } if isType args[0], Function
  return args

type.defineFrozenValues

  maxCalls: (options) -> options.maxCalls

type.defineValues

  calls: ->
    return 0 if @maxCalls isnt Infinity

  notify: ->
    return @_notifyUnlimited if @maxCalls is Infinity
    return @_notifyLimited

  _onEvent: (options) -> options.onEvent

  _onStop: (options) -> options.onStop

  _onDefuse: -> emptyFunction

if isDev
  type.defineValues
    _traceInit: -> Tracer "Listener()"

type.defineMethods

  stop: ->
    @_defuse()
    @_onStop this
    return

  _notifyUnlimited: (scope, args) ->
    guard => @_onEvent.apply scope, args
    .fail (error) => throwFailure error, { scope, args, listener: this }
    return

  _notifyLimited: (scope, args) ->
    @calls += 1
    guard => @_onEvent.apply scope, args
    .fail (error) => throwFailure error, { scope, args, listener: this }
    @stop() if @calls is @maxCalls
    return

  _defuse: ->
    @notify = emptyFunction.thatReturnsFalse
    @_defuse = @stop = emptyFunction
    @_onDefuse()
    return

module.exports = type.build()
