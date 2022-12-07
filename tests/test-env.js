const eventIsDefined = (item) => typeof item !== "undefined" && item !== null

const _addEventListener = EventTarget.prototype.addEventListener
const _removeEventListener = EventTarget.prototype.removeEventListener

EventTarget.prototype.events = {}

const nativeEventListener = EventTarget.prototype.addEventListener
const nativeAddEventListener = EventTarget.prototype.addEventListener
const nativeRemoveEventListener = EventTarget.prototype.removeEventListener

EventTarget.prototype.addEventListener = function (...args) {
  const [name, listener] = args
  const events = EventTarget.prototype.events
  if (!eventIsDefined(events[name])) {
    events[name] = []
  }

  if (events[name].indexOf(listener) === -1) {
    events[name].push(listener)
  }

  nativeAddEventListener.apply(this, args)
}

EventTarget.prototype.hasEventListeners = function (...args) {
  const [name, listener] = args
  const events = EventTarget.prototype.events

  return eventIsDefined(events[name]) && events[name].length > 0
}

EventTarget.prototype.hasEventListener = function (...args) {
  const [name, listener] = args
  const events = EventTarget.prototype.events

  if (!eventIsDefined(events[name])) return false

  return events[name].indexOf(listener) !== -1
}

EventTarget.prototype.getEventListeners = function (...args) {
  const [name, listener] = args
  const events = EventTarget.prototype.events
  if (eventIsDefined(events[name])) return events[name]

  return []
}

EventTarget.prototype.getEventListener = function (...args) {
  const [name, listener] = args
  const events = EventTarget.prototype.events

  if (!eventIsDefined(events[name])) return null

  return events[name].find((event) => event === listener) ?? null
}

EventTarget.prototype.removeEventListener = function (...args) {
  const [name, listener, ...otherArgs] = args
  const events = EventTarget.prototype.events

  if (eventIsDefined(events[name])) {
    events[name].splice(events[name].indexOf(listener), 1)
  }

  _removeEventListener(name, listener, ...otherArgs)
}
