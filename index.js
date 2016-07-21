var Model = require('model')
var Reactive = require('reactive')
var domify = require('domify')
var uid = require('uid')
var body = document.body

/**
 * Cteate ListRender
 *
 * `template` repeat element or (template string) for rendering
 * `parentNode` element for list element to append to
 * `option` optional config obj
 * `option.delegate` delegate object for [reactive]
 * `option.bindings` bindings object for [reactive]
 * `option.filters` filters object for [reactive]
 * `option.model` model class used for generate model
 * `option.limit` the limit number for render when `setData()` (default Infinity)
 * `option.perpage` the limit number for paging, should >= limit
 * `option.empty` String or Element rendered in parentNode when internal data list is empty
 *
 * @param  {Element}  template
 * @param {Element} parentNode
 * @param {Object} option
 * @api public
 */
function ListRender(template, parentNode, option) {
  if (!(this instanceof ListRender)) return new ListRender(template, parentNode, option)
  if (typeof template === 'string') template = domify(template)
  option = option || {}
  var empty = option.empty
  if (empty) {
    this.emptyEl = typeof empty === 'string' ? domify(empty) : empty
    delete option.empty
  }
  this.curpage = 0
  this.curr = 0
  this.parentNode = parentNode
  this.template = template
  this.reactives = []
  this.data = []
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
  if (this._removed) return
  this.data = array.slice()
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
  if (this.limit === Infinity) return false
  var d = this.maxMoreCount()
  if (d === 0) return false //no more items could render
  var list = this.filtered || this.data
  var from = this.curr
  var to = from + Math.min(max, d)
  var arr = list.slice(from ,to)
  var fragment = this.createFragment(arr)
  this.parentNode.appendChild(fragment)
  this.curr = to
  this.onchange()
  return true
}

/**
 * The max count of items can be rendered by more
 *
 * @return {number}
 * @api public
 */
ListRender.prototype.maxMoreCount = function () {
  // filter
  var list = this.filtered || this.data
  var l = list.length
  var perpage = this.perpage
  // no more data
  if (this.curr >= l) return 0
  var still = l - this.curr
  // paging
  if (perpage) {
    var c = this.reactives.length
    // page is full
    if (c >= perpage) return 0
    return Math.min(perpage - c, still)
  }
  return still
}
/**
 * Append more data and render them, no refresh
 *
 * @param {Array} array
 * @api public
 */
ListRender.prototype.appendData = function (array) {
  if (array.length == 0) return
  this.data = this.data.concat(array)
  var fragment = this.createFragment(array)
  this.parentNode.appendChild(fragment)
  this.curr = this.curr + array.length
  this.empty(false)
  this.onchange()
}
/**
 * Prepend more data and render them, no refresh
 *
 * @param {Array} array
 * @api public
 */
ListRender.prototype.prependData = function (array) {
  if (array.length == 0) return
  this.data = array.concat(this.data)
  var fragment = this.createFragment(array)
  prepend(this.parentNode, fragment)
  this.curr = this.curr + array.length
  this.empty(false)
  this.onchange()
}

/**
 * Empty the exist list, and render the specific range of
 * internal data array (end not included, no option.limit restrict)
 *
 * @param {Number} start
 * @param {Number}  [end]
 * @api public
 */
ListRender.prototype.renderRange = function (start, end) {
  this.clean()
  var list = this.filtered || this.data
  this.curr= end = Math.min(list.length, end)
  var arr = list.slice(start, end)
  if (arr.length === 0) {
    this.empty(true)
    this.onchange()
    return
  }
  this.empty(false)
  var fragment = this.createFragment(arr)
  this.parentNode.appendChild(fragment)
  this.onchange()
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
  if (typeof field === 'function') {
    fn = field
  } else if (typeof val ==='function') {
    fn = val
  } else if (!field || val === '' || typeof val === 'undefined') {
    fn = function () {return true}
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
  if (this.perpage) {
    this.select(0)
  } else {
    this.renderRange(0, this.limit)
  }
  return l
}

/**
 * Sort the data with `field` `direction` ( 1 or -1 for ascend and descend)
 * and optional method (`string` or `number`, or a sort function for javascript array),
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
  dir = parseInt(dir, 10)
  if (!dir) throw new Error('direction should only be 1 or -1')
  data.sort(function (obj, other) {
    if (typeof method === 'function') {
      return method(obj, other) * dir
    }
    var a = obj[field]
    var b = other[field]
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
  if (this.perpage) {
    this.select(this.curpage)
  } else {
    this.renderRange(0, this.limit)
  }
}

/**
 * Find a specific model instance related by element, useful for event delegate
 *
 * @param  {Element|Number}  el
 * @return {reactive}
 * @api public
 */
ListRender.prototype.findModel = function (el) {
  let id = /^(string|number)$/.test(typeof el) ? el : null
  if (el.nodeType) {
    do {
      if (el.parentNode === this.parentNode) break
      if (el === body) return null
      el = el.parentNode
    } while (el.parentNode)
  }
  for (var i = this.reactives.length - 1; i >= 0; i--) {
    var r = this.reactives[i]
    if (id && r.model[this.primaryKey] == id) return r.model
    if (id == null && r.el === el) return r.model
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
    reactive.remove()
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
  var opt = {
    delegate: this.delegate,
    bindings: this.bindings,
    filters: this.filters
  }
  return Reactive.generateConfig(this.template, model, opt)
}

/**
 * Append remove to model
 *
 * @param {Object} model
 * @api private
 */
ListRender.prototype.appendRemove = function (model, reactive) {
  var orig = model.remove
  var id = reactive.id
  var self = this
  var fn = function (res) {
    if (res === false) return
    self.removeDataById(id)
    self.curr = Math.max(0, self.curr - 1)
    reactive.remove()
    self.onchange(true)
  }
  if (orig && typeof orig !== 'function') throw new TypeError('remove is not a function on model')
  if (!orig) {
    model.remove = fn
  } else {
    model.remove = function () {
      var res = orig.apply(this, arguments)
      if (res && typeof res.then === 'function') {
        res.then(fn, function () {})
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
  var el = this.template.cloneNode(true)
  var model = this.model(obj)
  var id = obj[this.primaryKey || '_id']
  if (!id) {
    id = uid(10)
    obj[this.primaryKey] = id
  }
  var opt = {
    delegate: this.delegate,
    bindings: this.bindings,
    filters: this.filters,
    config: this.config
  }
  var reactive = Reactive(el, model, opt)
  reactive.id = id
  this.appendRemove(model, reactive)
  var list = this.reactives
  list.push(reactive)
  // remove from list
  reactive.on('remove', function () {
    var i = list.indexOf(reactive)
    list.splice(i, 1)
  })
  return reactive
}

/**
 * Remove data inside internal list by id
 *
 * @param {String|Number} id
 * @return {undefined}
 * @api private
 */
ListRender.prototype.removeDataById = function (id) {
  var pk = this.primaryKey
  removeItem(this.data, pk, id)
  if (this.filtered) {
    removeItem(this.filtered, pk, id)
  }
}

/**
 * React model change
 *
 * @public
 * @param {Object} attrs plain object of model attrs
 * @returns {undefined}
 */
ListRender.prototype.react = function (attrs) {
  var pk = this.primaryKey || '_id'
  if (!attrs.hasOwnProperty(pk) || attrs[pk] == null) throw new Error('primaryKey [' + pk + '] not found on attrs')
  var id = attrs[pk]
  var model = this.model(attrs)
  for (var i = 0, l = this.reactives.length; i < l; i++) {
    var r = this.reactives[i]
    if (r.id == id) {
      r.bind(model)
    }
  }
  //nothing happen if not found
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
 * Select page by page number,
 * rerender even if page number not change, eg: filter
 *
 * @param  {Number}  n
 * @api public
 */
ListRender.prototype.select = function (n) {
  if (!this.perpage) throw new Error('perpage required in option')
  var s = n*this.perpage
  var e = (n + 1)*this.perpage
  e = Math.min(e, s + this.limit)
  this.curpage = n
  this.renderRange(s, e)
}

/**
 * Show previous page
 *
 * @api public
 */
ListRender.prototype.prev = function () {
  this.select(Math.max(0, this.curpage - 1))
}

/**
 * Show next page
 *
 * @api public
 */
ListRender.prototype.next = function () {
  var list = this.filtered || this.data
  var max = Math.ceil(list.length/this.perpage) -1
  this.select(Math.min(max, this.curpage + 1))
}

/**
 * Interface for extra action after dom changed
 *
 * @api private
 */
ListRender.prototype.onchange = function (isRemove) { // eslint-disable-line
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
