var Model = require('model')
var Reactive = require('reactive')
var domify = require('domify')
var uid = require('uid')

/**
 * Cteate ListRender
 *
 * `el` repeat element or (template string) for rendering
 * `parentNode` element for list element to append to
 * `option` optional config obj
 * `option.delegate` delegate object for [reactive]
 * `option.bindings` bindings object for [reactive]
 * `option.filters` filters object for [reactive]
 * `option.model` model class used for generate model
 * `option.limit` the limit number for render when `setData()` (default Infinity)
 * `option.empty` String or Element rendered in parentNode when internal data list is empty
 *
 * @param  {Element}  el
 * @param {Element} parentNode
 * @param {Object} option
 * @api public
 */
function ListRender(el, parentNode, option) {
  if (!(this instanceof ListRender)) return new ListRender(el, parentNode, option)
  if (typeof el === 'string') el = domify(el)
  var empty = option.empty
  if (empty) {
    this.emptyEl = typeof empty === 'string' ? domify(empty) : empty
    delete option.empty
  }
  this.curr = 0
  this.parentNode = parentNode
  this.el = el
  this.reactives = []
  this.data = []
  option = option || {}
  assign(this, option)
  this.limit = this.limit || Infinity
}

/**
 * Set internal data array, and render them limit by `option.limit`
 *
 * @param {Array} array
 * @api public
 */
ListRender.prototype.setData = function (array) {
  this.data = array || []
  this.renderRange(0, this.limit)
}

/**
  Render more internal data, return `false` if no data to render
 *
 * @param {Number} max
 * @return {Boolean}
 * @api public
 */
ListRender.prototype.more = function (max) {
  var l = this.data.length
  if (this.curr >= l) return false 
  var from = this.curr
  var to = Math.min(from + max, l)
  this.curr = to
  var list = this.filtered || this.data
  var arr = list.slice(from ,to)
  var fragment = this.createFragment(arr)
  this.parentNode.appendChild(fragment)
  return true
}
/**
 * Append more data and render them, no refresh
 *
 * @param {Array} array
 * @api public
 */
ListRender.prototype.appendData = function (array) {
  if (!array || array.length === 0) return
  this.data = this.data.concat(array)
  var fragment = this.createFragment(array)
  this.parentNode.appendChild(fragment)
  this.curr = this.curr + array.length
}
/**
 * Prepend more data and render them, no refresh
 *
 * @param {Array} array
 * @api public
 */
ListRender.prototype.prependData = function (array) {
  if (!array || array.length === 0) return
  this.data = array.concat(this.data)
  var fragment = this.createFragment(array)
  prepend(this.parentNode, fragment)
  this.curr = this.curr + array.length
}

/**
 * Empty the exist list, and render the specific range of
 * internal data array (end not included, no option.limit restrict)
 *
 * @param {Number} start
 * @param {Number}  [end]
 * @return {undefined}
 * @api public
 */
ListRender.prototype.renderRange = function (start, end) {
  this.clean()
  var list = this.filtered || this.data
  var arr = list.slice(start, end)
  var l = arr.length
  this.curr = Math.min(start + l, end)
  if (l === 0) {
    return this.empty(true)
  }
  this.empty(false)
  var fragment = this.createFragment(arr)
  this.parentNode.appendChild(fragment)
}
/**
 * Filter the internal data with `field` and `val` (or function used for array.filter), and render them limit by `option.limit`
 * When val or field is falsy, render all with limit by `option.limit`
 *
 * @param {String} field
 * @param {String|Function} val
 * @return {Number}
 * @api public
 */
ListRender.prototype.filterData = function (field, val) {
  var fn
  if (!field || !val) fn = function () {return true}
  if (typeof val === 'function') {
    fn = val
  } else if (typeof val === 'string') {
    val = val.replace('\\','\\\\').replace(/\s+/,'').split(/\s*/g).join('.*')
    var re = new RegExp(val, 'i')
    fn = function (o) {
      return re.test(String(o[field]))
    }
  } else {
    fn = function (o) {
      return String(o[field]) == String(val)
    }
  }
  var arr = this.filtered = this.data.filter(fn)
  var l = arr.length
  if (l === this.data.length) this.filtered = null
  this.renderRange(0, this.limit)
  return l
}

/**
 * Sort the data with `field` `direction` ( 1 or -1 for ascend and descend)
 * and method (`string` or `number`, or a sort function for javascript array),
 * render them limit by `option.limit`
 *
 * @param {String} field
 * @param {Number} dir
 * @param {String|Function} method
 * @return {undefined}
 * @api public
 */
ListRender.prototype.sortData = function (field, dir, method) {
  var data = this.filtered || this.data
  if (!field) return
  data.sort(function (obj, other) {
    var a = obj[field]
    var b = other[field]
    if (typeof method === 'function') {
      return method(a, b) * dir
    }
    switch (method) {
      case 'number':
        a = Number(a)
        b = Number(b)
        break
      case 'string':
        a = a.trim()
        b = b.trim()
        break
    }
    return (a < b ? 1 : -1) * dir
  })
  this.renderRange(0, this.limit)
}

/**
 * findReactive
 * Find a specific reactive instance related by element, useful for event delegate
 *
 * @param  {Element}  el
 * @return {reactive}
 * @api public
 */
var body = document.body
ListRender.prototype.findReactive = function (el) {
  do {
    if (el.parentNode === this.parentNode) break
    if (el === body) return null
    el = el.parentNode
  } while (el.parentNode);
  for (var i = this.reactives.length - 1; i >= 0; i--) {
    var r = this.reactives[i];
    if (r.el === el) return r
  }
  return null
}

ListRender.prototype.remove = function () {
  if (this._removed) return
  this._removed = true
  this.clean()
  delete this.reactives
  delete this.data
  delete this.filtered
}

/**
 * Show or hide the empty element
 *
 * @param {Boolean} show
 * @api private
 */
ListRender.prototype.empty = function (show) {
  var el = this.emptyEl
  if (!el) return
  if (show) {
    this.parentNode.appendChild(el)
  } else if (el.parentNode) {
    this.parentNode.removeChild(el)
  }
}

/**
 * Clean all list items
 *
 * @api private
 */
ListRender.prototype.clean = function () {
  // reactive remove would trigger array splice
  this.reactives.slice().forEach(function (reactive) {
    if (reactive.el.parentNode) reactive.remove()
  })
}

/**
 * Create reactive config and model class by plain obj
 *
 * @param  {Object} obj
 * @return {undefined}
 * @api public
 */
ListRender.prototype.createReactiveConfig = function (obj) {
  var model
  if (this.model) {
    model = this.model(obj)
  } else {
    var clz = this.model = createModelClass(Object.keys(obj))
    model = clz(obj)
  }
  this.primaryKey = obj.hasOwnProperty('id') ? 'id' : '_id'
  if (obj[this.primaryKey] != null) {
    this.hasPrimaryKey = true
  }
  var opt = {
    delegate: this.delegate,
    bindings: this.bindings,
    filters: this.filters
  }
  return Reactive.generateConfig(this.el, model, opt)
}

/**
 * Append remove to model
 *
 * @param {Object} model
 * @api private
 */
ListRender.prototype.appendRemove = function (model, reactive) {
  var orig = model.remove
  var self = this
  var fn = function () {
    reactive.remove()
    self.more(1)
  }
  if (orig && typeof orig !== 'function') throw new TypeError('remove is not a function model')
  if (!orig) {
    model.remove = fn
  } else {
    model.remove = function () {
      var res = orig.apply(this, arguments)
      if (res && typeof res.then === 'function') {
        res.then(fn)
      } else {
        fn()
      }
    }
  }
}

/**
 * Create reactive instance from object
 *
 * @param  {Object}  obj
 * @return {Reactive}
 * @api private
 */
ListRender.prototype.createReactive = function (obj) {
  if (!this.config) throw new Error('Need config to create Reactive')
  var el = this.el.cloneNode(true)
  var model = this.model(obj)
  var id = obj[this.primaryKey]
  if (!this.hasPrimaryKey) {
    id = obj[this.primaryKey] = uid(10)
  }
  id = obj[this.primaryKey]
  var opt = {
    delegate: this.delegate,
    bindings: this.bindings,
    filters: this.filters,
    config: this.config
  }
  var reactive = Reactive(el, model, opt)
  this.appendRemove(model, reactive)
  var list = this.reactives
  var self = this
  list.push(reactive)
  // remove from list
  reactive.on('remove', function () {
    var i = list.indexOf(reactive)
    list.splice(i)
    self.removeDataById(id)
    if (self.curr > 0) {
      self.curr = self.curr - 1
    }
  })
  return reactive
}

ListRender.prototype.removeDataById = function (id) {
  var pk = this.primaryKey
  removeItem(this.data, pk, id)
  if (this.filtered) {
    removeItem(this.filtered, pk, id)
  }
}

function removeItem(arr, key, val) {
  for (var i = arr.length - 1; i >= 0; i--) {
    var v = arr[i]
    if (v && v[key] === val) {
      arr.splice(i, 1)
      return
    }
  }
}
/**
 * Get fragment from array of object
 *
 * @param  {Array}  arr
 * @api private
 */
ListRender.prototype.createFragment = function (arr) {
  var obj = arr[0]
  if (typeof this.config === 'undefined' && obj) this.config = this.createReactiveConfig(obj)
  var fragment = document.createDocumentFragment()
  arr.forEach(function (obj) {
    var reactive = this.createReactive(obj)
    fragment.appendChild(reactive.el)
  }, this)
  return fragment
}

/**
 * Prepend parentNode with newNode
 *
 * @param {Element} parentNode
 * @param {Element} newNode
 * @api private
 */
function prepend(parentNode, newNode) {
  var node = parentNode.firstChild;
  if (node) {
    parentNode.insertBefore(newNode, node)
  } else {
    parentNode.appendChild(newNode)
  }
}

/**
 * Assign properties
 *
 * @param {Object} to
 * @param {Object} from
 * @return {Object}
 * @api private
 */
function assign(to, from) {
  Object.keys(from).forEach(function (k) {
    to[k] = from[k]
  })
  return to
}

/**
 * Create model class by keys
 *
 * @param {Array} keys
 * @return {Function}
 */
function createModelClass(keys) {
  var name = uid(5)
  var clz = Model(name)
  keys.forEach(function (k) {
    clz.attr(k)
  })
  return clz
}

module.exports = ListRender
