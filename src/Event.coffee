
require "isDev"

{ frozen } = require "Property"

Tracer = require "tracer"
Type = require "Type"

type = Type "Event", (maxCalls, onNotify) ->
  Event.Listener(maxCalls, onNotify).attach(this)

type.argumentTypes =
  onNotify: Function.Maybe

type.defineFrozenValues

  emit: ->
    listeners = Event.ListenerArray()
    frozen.define this, "_listeners", listeners
    return -> listeners.notify this, arguments

isDev and type.defineValues
  _trace: -> Tracer "Event()"

type.initInstance (onNotify) ->
  onNotify and Event.Listener(onNotify).attach(this)

type.definePrototype

  listenable: get: ->
    @_listenable or @_defineListenable()

  listenerCount: get: ->
    @_listeners.length

type.defineMethods

  reset: ->
    @_listeners.reset()
    return

  _onAttach: (listener) ->
    @_listeners.attach listener
    Event.didAttach.emit listener, this
    return

  _onDetach: (listener) ->
    @_listeners.detach listener
    return

  _defineListenable: ->

    event = this
    listenable = (maxCalls, onNotify) ->
      Event.Listener(maxCalls, onNotify).attach(event)

    frozen.define event, "_listenable", listenable
    return listenable

type.defineStatics

  Map: lazy: ->
    require "./EventMap"

  Listener: lazy: ->
    require "./Listener"

  ListenerArray: lazy: ->
    require "./ListenerArray"

  didAttach: lazy: ->
    event = Event()
    frozen.define event, "_onAttach", require "emptyFunction"
    return event

module.exports = Event = type.build()
