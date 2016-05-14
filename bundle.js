/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var List = __webpack_require__(1)
	var Reactive = __webpack_require__(6)
	var Model = __webpack_require__(2)
	
	var users = __webpack_require__(18)
	var append_users = __webpack_require__(19)
	var prepend_users = __webpack_require__(20)
	
	var User = Model('User')
	          .attr('_id')
	          .attr('isActive')
	          .attr('gender')
	          .attr('company')
	          .attr('email')
	          .attr('phone')
	          .attr('date')
	          .attr('name')
	          .attr('age')
	          .attr('address')
	
	// load user functions
	function loadUser(arr) {
	  var curr = 0
	  return function (count) {
	    var users = arr.slice(curr, curr + count)
	    curr = curr + count
	    return users
	  }
	}
	
	var prependUsers = loadUser(prepend_users)
	var appendUsers = loadUser(append_users)
	
	// form
	Reactive(document.getElementById('form'), {}, {
	  delegate: {
	    sort: function () {
	      var field = document.getElementById('sort').value
	      var dir = document.getElementById('direction').value
	      dir = parseInt(dir, 10)
	      list.sortData(field, dir)
	    },
	    filter: function () {
	      var field = document.getElementById('filter').value
	      var val = document.getElementById('filter_input').value
	      list.filterData(field, val)
	    },
	    prepend: function () {
	      var users = prependUsers(5)
	      list.prependData(users)
	    }
	  }
	})
	
	document.querySelector('.scrollable').onscroll = function () {
	  var bottom = this.scrollHeight - this.scrollTop === this.clientHeight;
	  if (bottom) {
	    var m = list.more(5)
	    if (!m) {
	      var users = appendUsers(5)
	      list.appendData(users)
	    }
	  }
	}
	
	setInterval(function () {
	  var el = document.getElementById('count')
	  var li_count = document.querySelectorAll('#users > li').length
	  el.textContent = 'rendered:' + li_count + ' total:' + list.data.length
	}, 300)
	
	// list of users
	var parentNode = document.getElementById('users')
	var template = parentNode.firstElementChild
	parentNode.removeChild(template)
	
	User.prototype.remove = function () {
	  return new Promise(function (resolve, reject) {
	    setTimeout(function () {
	      resolve()
	    }, 200)
	  })
	}
	
	var list = List(template, parentNode, {
	  model: User,
	  limit: 10,
	  empty: '<div>No user find</div',
	  delegate: {
	    remove: function (e, user, el) {
	      e.target.disabled = true
	      // el.parentNode.removeChild(el)
	      user.remove()
	    }
	  },
	  bindings: {
	    'date-ymd': function (prop) {
	      this.bind(prop, function (model, el) {
	        var date = model[prop]
	        if(!(date instanceof Date)) date = new Date(date)
	        if (!date.getTime()) throw new TypeError('Date [' + date + ']is not a valid argument for Date')
	        el.textContent = date.getFullYear() +
	          '-' + ('0' + (1 + date.getMonth())).slice(-2) +
	          '-' + ('0' + date.getDate()).slice(-2);
	      })
	    }
	  },
	  filters: {
	    truncate: function (val, len) {
	      if (!val) return ''
	      return String(val).substr(0, len) + '...'
	    }
	  }
	})
	
	list.setData(users)


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var Model = __webpack_require__(2)
	var Reactive = __webpack_require__(6)
	var domify = __webpack_require__(10)
	var uid = __webpack_require__(17)
	
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
	 * Find a specific model instance related by element, useful for event delegate
	 *
	 * @param  {Element}  el
	 * @return {reactive}
	 * @api public
	 */
	var body = document.body
	ListRender.prototype.findModel = function (el) {
	  do {
	    if (el.parentNode === this.parentNode) break
	    if (el === body) return null
	    el = el.parentNode
	  } while (el.parentNode);
	  for (var i = this.reactives.length - 1; i >= 0; i--) {
	    var r = this.reactives[i];
	    if (r.el === el) return r.mode;
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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	var proto = __webpack_require__(3)
	var util = __webpack_require__(5)
	var buildinRe = /^(\$stat|changed|emit|clean|on|off|attrs)$/
	
	/**
	 * Expose `createModel`.
	 */
	
	module.exports = createModel
	
	/**
	 * Create a new model constructor with the given `name`.
	 *
	 * @param {String} name
	 * @return {Function}
	 * @api public
	 */
	
	function createModel(name) {
	  if ('string' != typeof name) throw new TypeError('model name required')
	
	  /**
	   * Initialize a new model with the given `attrs`.
	   *
	   * @param {Object} attrs
	   * @api public
	   */
	
	  function model(attrs) {
	    if (!(this instanceof model)) return new model(attrs)
	    attrs = attrs || {}
	    this._callbacks = {}
	    this.origAttrs = attrs
	    this.attrs = util.assign({}, attrs)
	  }
	
	  // statics
	
	  model.modelName = name
	  model.options = {}
	
	  // prototype
	
	  model.prototype = {}
	  model.prototype.model = model;
	
	  /**
	   * Define instance method
	   *
	   * @param {String} name
	   * @param {Function} fn
	   * @return {Function} self
	   * @api public
	   */
	  model.method = function (name, fn) {
	    this.prototype[name] = fn
	    return this
	  }
	
	  /**
	   * Use function as plugin
	   *
	   * @param {Function} fn
	   * @return {Function} self
	   * @api public
	   */
	  model.use = function (fn) {
	    fn(this)
	    return this
	  }
	
	  /**
	  * Define attr with the given `name` and `options`.
	  *
	  * @param {String} name
	  * @param {Object} optional options
	  * @return {Function} self
	  * @api public
	  */
	
	  model.attr = function(name, options){
	    options = options || {}
	    this.options[name] = options
	
	    if ('id' === name || '_id' === name) {
	      this.options[name].primaryKey = true
	      this.primaryKey = name
	    }
	
	    if (buildinRe.test(name)) throw new Error(name + ' could not be used as field name')
	
	    Object.defineProperty(this.prototype, name, {
	      set: function (val) {
	        var prev = this.attrs[name]
	        var diff = util.diffObject(this.attrs, this.origAttrs)
	        var changedNum = Object.keys(diff).length
	        this.attrs[name] = val
	        this.emit('change', name, val, prev)
	        this.emit('change ' + name, val, prev)
	        if (prev === val) return
	        // make sure when multiple properties changed, only emit once
	        if (changedNum === 0) return this.emit('change $stat', true)
	        if (changedNum === 1 && diff[name] === val) {
	          // became clean
	          this.emit('change $stat', false)
	        }
	      },
	      get: function () {
	        return this.attrs[name]
	      }
	    })
	
	    return this
	  }
	
	  var key
	  for (key in proto) model.prototype[key] = proto[key]
	
	  return model
	}
	


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	var Emitter = __webpack_require__(4)
	var util = __webpack_require__(5)
	
	/**
	 * Mixin emitter.
	 */
	
	Emitter(exports)
	
	
	/**
	 * Return `false` or an object
	 * containing the "dirty" attributes.
	 *
	 * Optionally check for a specific `attr`.
	 *
	 * @param {String} [attr]
	 * @return {Object|Boolean}
	 * @api public
	 */
	
	exports.changed = function(attr){
	  var changed = util.diffObject(this.origAttrs, this.attrs)
	  if (typeof changed[attr] !== 'undefined') {
	    return changed[attr]
	  }
	  if (Object.keys(changed).length === 0) return false
	  return changed
	}
	
	/**
	 * Set current attrs as original attrs
	 *
	 * @api public
	 */
	exports.clean = function(){
	  for (var k in this.attrs) {
	    this.origAttrs[k] = this.attrs[k]
	  }
	  this.emit('change $stat', false)
	}
	
	
	/**
	 * Set multiple `attrs`.
	 *
	 * @param {Object} attrs
	 * @return {Object} self
	 * @api public
	 */
	
	exports.set = function(attrs){
	  for (var key in attrs) {
	    this[key] = attrs[key]
	  }
	  return this
	}
	
	
	/**
	 * Return the JSON representation of the model.
	 *
	 * @return {Object}
	 * @api public
	 */
	
	exports.toJSON = function(){
	  return this.attrs
	}
	
	/**
	 * Check if `attr` is present (not `null` or `undefined`).
	 *
	 * @param {String} attr
	 * @return {Boolean}
	 * @api public
	 */
	
	exports.has = function(attr){
	  return null != this.attrs[attr]
	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	module.exports = Emitter;
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 5 */
/***/ function(module, exports) {

	/**
	 * Simple diff without nested check
	 * Return the changed props from b
	 *
	 * @param {Object} a
	 * @param {Object} b
	 * @api public
	 */
	exports.diffObject = function (a, b) {
	  var res = {}
	  for (var k in a) {
	    if (a[k] !== b[k]) {
	      res[k] = b[k]
	    }
	  }
	  return res
	}
	
	/**
	 * Assign props from `from` to `to` return to
	 *
	 * @param {Object} to
	 * @param {Object} from
	 * @return {Object}
	 * @api public
	 */
	exports.assign = function (to, from) {
	  Object.keys(from).forEach(function (k) {
	    to[k] = from[k]
	  })
	  return to
	}
	


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(7)


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(8)
	var domify = __webpack_require__(10)
	var Binding = __webpack_require__(11)
	var bindings = __webpack_require__(12)
	var Emitter = __webpack_require__(15)
	var filters = __webpack_require__(16)
	
	/**
	 * Reactive
	 *
	 * @param {Element|String} el element or template string
	 * @param {Object} model model with change event emitted
	 * @param {Object} option [Optional] object with `delegate` `bindings` `filters` etc
	 * @api public
	 */
	function Reactive(el, model, option) {
	  if(!(this instanceof Reactive)) return new Reactive(el, model, option)
	  if (typeof el === 'string') el = domify(el)
	  option = option || {}
	  this.bindings = util.assign({}, bindings)
	  // custom bindings first
	  util.assign(this.bindings, option.bindings || {})
	  this.filters = util.assign({}, filters)
	  // custom filters first
	  util.assign(this.filters, option.filters || {})
	  this.binding_names = Object.keys(this.bindings)
	  this.delegate = option.delegate || {}
	  this.model = model
	  this.el = el
	  var config = option.config
	  if (option.nobind) return
	  if (config == null) {
	    // this.checkModel(model)
	    this._bind()
	  } else {
	    this._bindConfig(config)
	  }
	}
	
	Emitter(Reactive.prototype)
	
	/**
	 * Remove element and unbind events
	 *
	 * @api public
	 */
	Reactive.prototype.remove = function () {
	  if (this._removed) return
	  if (this.el.parentNode) this.el.parentNode.removeChild(this.el)
	  this._removed = true
	  this.emit('remove')
	  // The model may still using, not destroy it
	  this.model = null
	  this.off()
	}
	
	/**
	 * Use generated binding config
	 *
	 * @param {Array} config
	 * @api public
	 */
	Reactive.prototype._bindConfig = function (config) {
	  var root = this.el
	  var reactive = this
	  config.forEach(function (o) {
	    var el = util.findElement(root, o.indexes)
	    var binding = new Binding(reactive, el, o.bindings)
	    binding.active(el)
	  })
	}
	
	/**
	 * bind all the node with parsed binding
	 *
	 * @api private
	 */
	Reactive.prototype._bind = function () {
	  var reactive = this
	  var root = this.el
	  util.walk(root, function (node, next, single) {
	    var binding = this.parseBinding(node, single)
	    if (binding) {
	      binding.active(node)
	      reactive.on('remove', function () {
	        binding.remove()
	      })
	    }
	    next()
	  }.bind(this))
	}
	
	/**
	 * Parse binding object for no
	 *
	 * @param {Element} node
	 * @return {Binding}
	 * @api public
	 */
	Reactive.prototype.parseBinding = function (node, single) {
	  var binding
	  if (node.nodeType === 3) {
	    binding = new Binding(this, node)
	    binding.interpolation(node.textContent)
	  } else if (node.nodeType === 1) {
	    var attributes = node.attributes
	    binding = new Binding(this, node)
	    for (var i = 0, l = attributes.length; i < l; i++) {
	      var name = attributes[i].name
	      var val = attributes[i].value
	      if (~this.binding_names.indexOf(name)) {
	        binding.add(name, val)
	      }
	    }
	    if (single) {
	      binding.interpolation(node.textContent)
	    }
	  }
	  // empty binding
	  if (binding && binding.bindings.length === 0) {
	    binding.remove()
	    binding = null
	  }
	  return binding
	}
	
	/**
	 * Subscribe to prop change on model
	 *
	 * @param {String} prop
	 * @param {Function} fn
	 * @api public
	 */
	Reactive.prototype.sub = function (prop, fn) {
	  var model = this.model
	  model.on('change ' + prop, fn)
	  this.on('remove', function () {
	    model.off('change ' + prop, fn)
	  })
	}
	
	/**
	 * Get delegate function by function name
	 *
	 * @param {String} name
	 * @param {Object} reactive
	 * @return {Function}
	 * @api public
	 */
	Reactive.prototype.getDelegate = function (name) {
	  var delegate = this.delegate
	  var fn = delegate[name]
	  if (!fn || typeof fn !== 'function') throw new Error('can\'t find delegate function for[' + name + ']')
	  return fn
	}
	
	/**
	 * Generate config array by the same arguments as Reactive constructor
	 *
	 * @param {Element} el
	 * @param {Object} model
	 * @param {Object} opt
	 * @return {Array}
	 * @api public
	 */
	Reactive.generateConfig = function (el, model, opt) {
	  if (typeof el === 'string') el = domify(el)
	  var config = []
	  opt = opt || {}
	  opt.nobind = true
	  var reactive =  Reactive(el, model, opt)
	  util.iterate(el, function (node, indexes) {
	    var single = util.isSingle(node)
	    var binding = reactive.parseBinding(node, single)
	    if (binding) {
	      config.push({
	        indexes: indexes,
	        bindings: binding.bindings
	      })
	      binding.remove()
	    }
	  }.bind(this), [])
	  return config
	}
	
	/**
	 * Create custom bindings with attribute name and function witch is call with
	 * property value eg:
	 * Reactive.createBinding('data-sum', function (value) {
	 *    var props = value.split(',')
	 *    this.bind(props, function (el, model) {
	 *      var val = props.reduce(function(pre, name) {
	 *        return pre + model[name]
	 *      }, 0)
	 *      el.textContent = val
	 *   })
	 * })
	 *
	 *
	 * @param {String} name attribute name
	 * @param {Function} fn
	 * @api public
	 */
	Reactive.createBinding = function (name, fn) {
	  var names = Object.keys(bindings)
	  if (~names.indexOf(name)) throw new Error('Global binding name [' + name+ '] already in use')
	  bindings[name] = fn
	}
	
	/**
	 * Create global custom filter with `name` and `function`
	 * eg:
	 *  Reactive.createFilter('integer', function (str) {
	 *   if (!str) return 0
	 *   var res = parseInt(str, 10)
	 *   return isNaN(res) ? 0 : res
	 * })
	 *
	 * @param {String} name
	 * @param {Function} fn
	 * @api public
	 */
	Reactive.createFilter = function (name, fn) {
	  if (filters[name]) throw new Error('Global filter name [' + name + '] already in use')
	  filters[name] = fn
	}
	
	// use with caution
	Reactive.filters = filters
	Reactive.bindings = bindings
	
	module.exports = Reactive


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var unique = __webpack_require__(9)
	var funcRe = /\([^\s]*\)$/
	
	/**
	 * walk through the root with every child nodes, call `done` if provided and finished
	 *
	 * @param {Element} el
	 * @param {Function} process
	 * @param {Function} done optional callback
	 * @api public
	 */
	exports.walk = function walk(el, process, done) {
	  var end = done || function(){}
	  var single = isSingle(el)
	  var next
	  var nodes = toArray(el.childNodes)
	  if (single || el.hasAttribute('data-skip')) nodes = []
	  next = function (stop){
	    if (stop || nodes.length === 0) {
	      return end()
	    }
	    walk(nodes.shift(), process, next)
	  }
	
	  process(el, next, single)
	}
	
	/**
	 * Node list to array, for better performance
	 *
	 * @param {Collection} list Node collection
	 * @return {Array}
	 * @api public
	 */
	var toArray = exports.toArray = function (list) {
	  var arr = new Array(list.length)
	  for (var i = 0, l = arr.length; i < l; i++) {
	    arr[i] = list[i]
	  }
	  return arr
	}
	
	/**
	 * Check if node has no element child
	 *
	 * @param {Element} node
	 * @return {Boolean}
	 * @api public
	 */
	var isSingle = exports.isSingle = function (node) {
	  var list = node.childNodes
	  var single = true
	  for (var i = list.length - 1; i >= 0; i--) {
	    var v = list[i]
	    if (v.nodeType === 1) {
	      single = false
	      break
	    }
	  }
	  return single
	}
	
	/**
	 * Parse bindings from function, function calls ignored
	 *
	 * @param {Function} fn
	 * @param {Boolean} firstParam or this
	 * @return {Array}
	 * @api private
	 */
	exports.parseBindings = function (fn, firstParam) {
	  var res = []
	  var str = fn.toString()
	  var arr
	  var param
	  if (firstParam) {
	    var ms = str.match(/\(([A-Za-z0-9_$]+?)(?:[\s,)])/)
	    param = ms ? ms[1] : null
	  } else {
	    param = 'this'
	  }
	  var re = new RegExp('\\b' + param + '\\.([\\w_$]+)\\b(?!([\\w$_]|\\s*\\())', 'g')
	  while ((arr = re.exec(str)) !== null) {
	    res.push(arr[1])
	  }
	  // console.log(res)
	  return unique(res)
	}
	
	
	/**
	 * Parse str to get the bindings and render function
	 * eg: {first} {last} => {
	 *  bindings: ['first', 'last'],
	 *  fn: function(model) { return model.first + '' + model.last}
	 * }
	 *
	 * @param {string} str textContent
	 * @return {object} bindings and render function
	 * @api public
	 */
	exports.parseInterpolationConfig = function (str) {
	  var bindings = []
	  // function names
	  var fns = []
	  var res = '"'
	  var inside = false
	  var name = ''
	  for (var i = 0; i < str.length; i++) {
	    var c = str[i]
	    if (c === '{') {
	      inside = true
	      res = res + '"'
	    } else if (c === '}') {
	      inside = false
	      res = res + ' + '
	      name = name.trim()
	      if (!name) {
	        res = res + '""'
	      } else if (/\|/.test(name)) {
	        res = res + parseFilters(name, bindings, fns)
	      } else {
	        res = res + 'model.' + name
	        parseStringBinding(name, bindings, fns)
	      }
	      res = res + '+ "'
	      name = ''
	    } else if (inside) {
	      name = name + c
	    } else {
	      if (c === '"') c = '\\"'
	      res = res + c
	    }
	  }
	  res = res.replace(/\n/g, '\\n')
	  res = res + '"'
	  var fn = new Function('model', 'filter', ' return ' + res)
	  return {
	    bindings: unique(bindings),
	    fns: unique(fns),
	    fn: fn
	  }
	}
	
	/**
	 * Parse filters in string, concat them into js function
	 * If there is function call, push the function name into fns eg:
	 * 'first | json' => 'filter.json(model.first)'
	 * 'first | nonull | json' => 'filter.json(filter.nonull(model.first))'
	 *
	 * @param {String} str
	 * @param {Array} fns
	 * @return {String}
	 * @api public
	 */
	var parseFilters = exports.parseFilters = function (str, bindings, fns) {
	  var res = ''
	  if (str[0] === '|') throw new Error('Interpolation can\'t starts with `|` [' + str + ']')
	  var arr = str.split(/\s*\|\s*/)
	  var name = arr[0]
	  res = 'model.' + name
	  parseStringBinding(name, bindings, fns)
	  for (var i = 1; i < arr.length; i++) {
	    var f = arr[i].trim()
	    if (f) {
	      var parts = f.match(/^([\w$_]+)(.*)$/)
	      var args
	      if (parts[2]) {
	        args = parseArgs(parts[2].trim())
	        res = 'filter.' + parts[1] + '(' + res + ', ' + args.join(', ') + ')'
	      } else {
	        res = 'filter.' + f + '(' + res + ')'
	      }
	    }
	  }
	  return res
	}
	
	/**
	 * Parse string binding into bindings or fns
	 * eg: 'first' => bindings.push('first')
	 *     'first.last' => bindings.push('first')
	 *     'name.first()' => bindings.push('name')
	 *     'first()' => fns.push('first')
	 *
	 * @param {String} str
	 * @api public
	 */
	var parseStringBinding = exports.parseStringBinding = function (str, bindings, fns) {
	  // if nested, only bind the root property
	  if (~str.indexOf('.')) str = str.replace(/\.[^\s]+$/,'')
	  if (funcRe.test(str)) {
	    fns.push(str.replace(funcRe, ''))
	  } else {
	    bindings.push(str)
	  }
	}
	
	/**
	 * Parse the filter function name from function string
	 * Used for check
	 *
	 * @param {Function} fn
	 * @return {Array}
	 * @api public
	 */
	var filterCallRe = /\bfilter\.([^\s(]+?)\b/g
	exports.parseFilterNames = function (fn) {
	  var res = []
	  var str = fn.toString()
	  var arr
	  while ((arr = filterCallRe.exec(str)) !== null) {
	    res.push(arr[1])
	  }
	  return unique(res)
	}
	
	/**
	 * Check if field on object is a function
	 *
	 * @param {Object} o
	 * @param {attribute} field
	 * @return {Boolean}
	 * @api public
	 */
	exports.isFunction = function (o, field) {
	  var v = o[field]
	  if (!v) return false
	  if (typeof v !== 'function') return false
	  return true
	}
	
	/**
	 * Check if `str` has interpolation.
	 *
	 * @param {String} str
	 * @return {Boolean}
	 * @api private
	 */
	
	exports.hasInterpolation = function(str) {
	  return !!~str.indexOf('{')
	}
	
	/**
	 * Iterate element with process function and pass generated indexes
	 *
	 * @param {Element} el
	 * @param {Function} process
	 * @param {Array} indexes
	 * @api public
	 */
	var iterate = exports.iterate = function (el, process, indexes) {
	  var single = isSingle(el)
	  process(el, indexes)
	  if (single) return
	  for (var i = 0, l = el.childNodes.length; i < l; i++) {
	    var node = el.childNodes[i]
	    iterate(node, process, indexes.slice().concat([i]))
	  }
	}
	
	/**
	 * Find element with indexes array and root element
	 *
	 * @param {Element} root
	 * @param {Array} indexes
	 * @api public
	 */
	exports.findElement = function (root, indexes) {
	  var res = root
	  for (var i = 0; i < indexes.length; i++) {
	    var index = indexes[i]
	    res = res.childNodes[index]
	    if (!res) return
	  }
	  return res
	}
	
	/**
	 * Parse arguments from string eg:
	 * 'a' false 3 => ['a', false, 3]
	 *
	 * @param {String} str
	 * @return {Array}
	 * @api public
	 */
	var parseArgs = exports.parseArgs = function(str) {
	  var strings = []
	  var s = str.replace(/(['"]).+?\1/g, function (str) {
	    strings.push(str)
	    return '$'
	  })
	  var arr = s.split(/\s+/)
	  for (var i = 0, l = arr.length; i < l; i++) {
	    var v= arr[i]
	    if (v === '$') {
	      arr[i] = strings.shift()
	    }
	  }
	  return arr
	}
	
	/**
	 * Copy properties from `from` to `to` and return `to`
	 *
	 * @param {Object} to
	 * @param {Object} from
	 * @return {Object}
	 * @api public
	 */
	exports.assign = function (to, from) {
	  Object.keys(from).forEach(function (k) {
	    to[k] = from[k]
	  })
	  return to
	}


/***/ },
/* 9 */
/***/ function(module, exports) {

	/*!
	 * array-unique <https://github.com/jonschlinkert/array-unique>
	 *
	 * Copyright (c) 2014-2015, Jon Schlinkert.
	 * Licensed under the MIT License.
	 */
	
	'use strict';
	
	module.exports = function unique(arr) {
	  if (!Array.isArray(arr)) {
	    throw new TypeError('array-unique expects an array.');
	  }
	
	  var len = arr.length;
	  var i = -1;
	
	  while (i++ < len) {
	    var j = i + 1;
	
	    for (; j < arr.length; ++j) {
	      if (arr[i] === arr[j]) {
	        arr.splice(j--, 1);
	      }
	    }
	  }
	  return arr;
	};


/***/ },
/* 10 */
/***/ function(module, exports) {

	
	/**
	 * Expose `parse`.
	 */
	
	module.exports = parse;
	
	/**
	 * Tests for browser support.
	 */
	
	var innerHTMLBug = false;
	var bugTestDiv;
	if (typeof document !== 'undefined') {
	  bugTestDiv = document.createElement('div');
	  // Setup
	  bugTestDiv.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
	  // Make sure that link elements get serialized correctly by innerHTML
	  // This requires a wrapper element in IE
	  innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
	  bugTestDiv = undefined;
	}
	
	/**
	 * Wrap map from jquery.
	 */
	
	var map = {
	  legend: [1, '<fieldset>', '</fieldset>'],
	  tr: [2, '<table><tbody>', '</tbody></table>'],
	  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
	  // for script/link/style tags to work in IE6-8, you have to wrap
	  // in a div with a non-whitespace character in front, ha!
	  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
	};
	
	map.td =
	map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];
	
	map.option =
	map.optgroup = [1, '<select multiple="multiple">', '</select>'];
	
	map.thead =
	map.tbody =
	map.colgroup =
	map.caption =
	map.tfoot = [1, '<table>', '</table>'];
	
	map.polyline =
	map.ellipse =
	map.polygon =
	map.circle =
	map.text =
	map.line =
	map.path =
	map.rect =
	map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];
	
	/**
	 * Parse `html` and return a DOM Node instance, which could be a TextNode,
	 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
	 * instance, depending on the contents of the `html` string.
	 *
	 * @param {String} html - HTML string to "domify"
	 * @param {Document} doc - The `document` instance to create the Node for
	 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
	 * @api private
	 */
	
	function parse(html, doc) {
	  if ('string' != typeof html) throw new TypeError('String expected');
	
	  // default to the global `document` object
	  if (!doc) doc = document;
	
	  // tag name
	  var m = /<([\w:]+)/.exec(html);
	  if (!m) return doc.createTextNode(html);
	
	  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace
	
	  var tag = m[1];
	
	  // body support
	  if (tag == 'body') {
	    var el = doc.createElement('html');
	    el.innerHTML = html;
	    return el.removeChild(el.lastChild);
	  }
	
	  // wrap map
	  var wrap = map[tag] || map._default;
	  var depth = wrap[0];
	  var prefix = wrap[1];
	  var suffix = wrap[2];
	  var el = doc.createElement('div');
	  el.innerHTML = prefix + html + suffix;
	  while (depth--) el = el.lastChild;
	
	  // one element
	  if (el.firstChild == el.lastChild) {
	    return el.removeChild(el.firstChild);
	  }
	
	  // several elements
	  var fragment = doc.createDocumentFragment();
	  while (el.firstChild) {
	    fragment.appendChild(el.removeChild(el.firstChild));
	  }
	
	  return fragment;
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var unique = __webpack_require__(9)
	var util = __webpack_require__(8)
	
	/**
	 * Create binding instance with reactive and el
	 *
	 * @param {Reactive} reactive
	 * @param {Element} el
	 * @param {Array} optional predefined bindings
	 * @api public
	 */
	function Binding(reactive, el, bindings) {
	  this._reactive = reactive
	  this.bindings = bindings || []
	  this.el = el
	}
	
	/**
	 * Add text interpolation binding
	 *
	 * @param {String} textContent el textContent
	 * @api public
	 */
	Binding.prototype.interpolation = function (textContent) {
	  if (textContent.trim() === '') return
	  if (!util.hasInterpolation(textContent)) return
	  var config = util.parseInterpolationConfig(textContent)
	  var props = config.bindings
	  var filters = this._reactive.filters
	  var fns = config.fns
	  if (fns.length) {
	    var arr = this.parseFunctionBindings(fns)
	    props = unique(props.concat(arr))
	  }
	  props = this.filterBindings(props)
	  var func = function (el) {
	    var model = this._reactive.model
	    var render = function () {
	      // much better performance than innerHTML
	      el.textContent = config.fn(model, filters)
	    }
	    this.bindReactive(props, render)
	    render()
	  }
	  this.bindings.push(func)
	}
	
	/**
	 * Get model bindings from function names
	 *
	 * @param {Array} fns function name
	 * @return {Array}
	 * @api private
	 */
	Binding.prototype.parseFunctionBindings = function (fns) {
	  var res = []
	  var model = this._reactive.model
	  fns.forEach(function (name) {
	    var fn = model[name]
	    if (!fn || typeof fn !== 'function') throw new Error('Can\'t find function [' + name + '] on model')
	    res = res.concat(util.parseBindings(fn))
	  })
	  return unique(res)
	}
	
	/**
	 * Add a binding by element attribute
	 *
	 * @param {String} attr attribute name
	 * @param {String} value attribute value
	 * @api public
	 */
	Binding.prototype.add = function (attr, value) {
	  // custom bindings first
	  var fn = this._reactive.bindings[attr]
	  // no binding should be ok
	  if (!fn) return
	  // custom bindings don't return function
	  var func = fn.call(this, value)
	  if (func) this.bindings.push(func)
	}
	
	/**
	 * Filter binding names with model
	 *
	 * @param {Array} props binding names
	 * @return {Array}
	 * @api public
	 */
	Binding.prototype.filterBindings = function (props) {
	  var model = this._reactive.model
	  return props.filter(function (name) {
	    return (name in model)
	  })
	}
	
	/**
	 * Bind all bindings to the element
	 *
	 * @param {Element} el
	 * @api public
	 */
	Binding.prototype.active = function (el) {
	  var self = this
	  if (this.bindings.length === 0) return
	  this.bindings.forEach(function (fn) {
	    fn.call(self, el)
	  })
	}
	
	/**
	 * Bind eventlistener to model attribute[s]
	 *
	 * @param {String|Array} props model attribute[s]
	 * @param {Function} fn listener
	 * @api private
	 */
	Binding.prototype.bindReactive = function (props, fn) {
	  var reactive = this._reactive
	  if (typeof props === 'string') {
	    reactive.sub(props, fn)
	  } else {
	    props.forEach(function (prop) {
	      reactive.sub(prop, fn)
	    })
	  }
	}
	
	/**
	 * Remove this binding
	 *
	 * @api public
	 */
	Binding.prototype.remove = function () {
	  this.bindings = null
	  delete this._reactive
	  delete this.el
	}
	
	/**
	 * Custom binding method: bind properties with function
	 * function is called with element and model
	 *
	 * @param {String|Array} bindings bind properties
	 * @param {Function} fn callback function
	 * @api public
	 */
	Binding.prototype.bind = function (bindings, fn) {
	  var func = function (el) {
	    var self = this
	    var model = this._reactive.model
	    var render = function () {
	      fn.call(self, model, el)
	    }
	    this.bindReactive(bindings, render)
	    render()
	  }
	  this.bindings.push(func)
	}
	
	
	module.exports = Binding


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var tap = __webpack_require__(13)
	var util = __webpack_require__(8)
	var event = __webpack_require__(14)
	
	/**
	 * Attributes supported.
	 */
	var attrs = [
	  'id',
	  'src',
	  'rel',
	  'cols',
	  'rows',
	  'name',
	  'href',
	  'title',
	  'class',
	  'style',
	  'width',
	  'value',
	  'height',
	  'tabindex',
	  'placeholder'
	]
	/*
	 * events supported
	 */
	var events = [
	  'change',
	  'tap',
	  'touchstart',
	  'touchend',
	  'click',
	  'dblclick',
	  'mousedown',
	  'mouseup',
	  'mousemove',
	  'mouseenter',
	  'mouseleave',
	  'scroll',
	  'blur',
	  'focus',
	  'input',
	  'submit',
	  'keydown',
	  'keypress',
	  'keyup'
	]
	
	/**
	 * Create data-render binding with property value
	 *
	 * @param {String} value
	 * @api public
	 */
	exports['data-render'] = function (value) {
	  var fn = this._reactive.getDelegate(value)
	  var bindings = util.parseBindings(fn, true)
	  bindings = this.filterBindings(bindings)
	  return function (el) {
	    var model = this._reactive.model
	    var context = this._reactive.delegate
	    var render = function () {
	      fn.call(context, model, el)
	    }
	    this.bindReactive(bindings, render)
	    render()
	  }
	}
	
	/**
	 * Create attribute interpolation bindings
	 *
	 */
	attrs.forEach(function (attr) {
	  // attribute bindings
	  exports['data-' + attr] = function (value) {
	    var hasInterpolation = util.hasInterpolation(value)
	    var config = util.parseInterpolationConfig(value)
	    var bindings = config.bindings
	    bindings = this.filterBindings(bindings)
	    var func = config.fn
	    var filters = this._reactive.filters
	    return function (el) {
	      var model = this._reactive.model
	      var fn = function () {
	        if (!hasInterpolation) {
	          el.setAttribute(attr, value)
	        } else {
	          // no escape for attribute
	          var str = func(model, filters)
	          el.setAttribute(attr, str)
	        }
	      }
	      this.bindReactive(bindings, fn)
	      fn()
	    }
	  }
	})
	
	/**
	 * Create event bindings
	 *
	 */
	events.forEach(function (name) {
	  exports['on-' + name] = function (value) {
	    var fn = this._reactive.getDelegate(value)
	    return function (el) {
	      var model = this._reactive.model
	      var context = this._reactive.delegate
	      var handler = function (e) {
	        fn.call(context, e, model, el)
	      }
	      if (name === 'tap') {
	        name = 'touchstart'
	        handler = tap(handler)
	      }
	      event.bind(el, name, handler)
	      this._reactive.on('remove', function () {
	        event.unbind(el, name, handler)
	      })
	    }
	  }
	})
	
	/**
	 * Create checked&selected binding
	 *
	 * @api public
	 */
	var arr = ['checked', 'selected']
	arr.forEach(function (name) {
	  exports['data-' + name] = function (val) {
	    return function (el) {
	      var attr = val || el.getAttribute('name')
	      var value = el.getAttribute('value')
	      var model = this._reactive.model
	      var fn = function () {
	        var v = model[attr]
	        // single checkbox
	        if (value == null) {
	          if (v) {
	            el.setAttribute(name, '')
	          } else {
	            el.removeAttribute(name)
	          }
	          return
	        }
	        if (v == null) return el.removeAttribute(name)
	        // checkbox
	        if (Array.isArray(v) && ~v.indexOf(value)) {
	          el.setAttribute(name, '')
	        // radio
	        } else if (v.toString() === value) {
	          el.setAttribute(name, '')
	        } else {
	          el.removeAttribute(name)
	        }
	      }
	      this.bindReactive(attr, fn)
	      fn()
	    }
	  }
	})
	
	exports['data-html'] = function (value) {
	  return function (el) {
	    var model = this._reactive.model
	    var fn = function () {
	      var v = model[value]
	      el.innerHTML = v == null ? '' : v
	    }
	    this.bindReactive(value, fn)
	    fn()
	  }
	}


/***/ },
/* 13 */
/***/ function(module, exports) {

	var cancelEvents = [
	  'touchcancel',
	  'touchstart',
	]
	
	var endEvents = [
	  'touchend',
	]
	
	module.exports = Tap
	
	// default tap timeout in ms
	Tap.timeout = 200
	
	function Tap(callback, options) {
	  options = options || {}
	  // if the user holds his/her finger down for more than 200ms,
	  // then it's not really considered a tap.
	  // however, you can make this configurable.
	  var timeout = options.timeout || Tap.timeout
	
	  // to keep track of the original listener
	  listener.handler = callback
	
	  return listener
	
	  // el.addEventListener('touchstart', listener)
	  function listener(e1) {
	    // tap should only happen with a single finger
	    if (!e1.touches || e1.touches.length > 1) return
	
	    var el = this;
	
	    var timeout_id = setTimeout(cleanup, timeout)
	
	    cancelEvents.forEach(function (event) {
	      document.addEventListener(event, cleanup)
	    })
	    el.addEventListener('touchmove', cleanup);
	
	    endEvents.forEach(function (event) {
	      document.addEventListener(event, done)
	    })
	
	    function done(e2) {
	      // since touchstart is added on the same tick
	      // and because of bubbling,
	      // it'll execute this on the same touchstart.
	      // this filters out the same touchstart event.
	      if (e1 === e2) return
	
	      cleanup()
	
	      // already handled
	      if (e2.defaultPrevented) return
	
	      // overwrite these functions so that they all to both start and events.
	      var preventDefault = e1.preventDefault
	      var stopPropagation = e1.stopPropagation
	
	      e2.stopPropagation = function () {
	        stopPropagation.call(e1)
	        stopPropagation.call(e2)
	      }
	
	      e2.preventDefault = function () {
	        preventDefault.call(e1)
	        preventDefault.call(e2)
	      }
	
	      // calls the handler with the `end` event,
	      // but i don't think it matters.
	      callback.call(el, e2)
	    }
	
	    // cleanup end events
	    // to cancel the tap, just run this early
	    function cleanup(e2) {
	      // if it's the same event as the origin,
	      // then don't actually cleanup.
	      // hit issues with this - don't remember
	      if (e1 === e2) return
	
	      clearTimeout(timeout_id)
	
	      cancelEvents.forEach(function (event) {
	        document.removeEventListener(event, cleanup)
	      })
	      el.removeEventListener('touchmove', cleanup);
	
	      endEvents.forEach(function (event) {
	        document.removeEventListener(event, done)
	      })
	    }
	  }
	}


/***/ },
/* 14 */
/***/ function(module, exports) {

	var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
	    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
	    prefix = bind !== 'addEventListener' ? 'on' : '';
	
	/**
	 * Bind `el` event `type` to `fn`.
	 *
	 * @param {Element} el
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @return {Function}
	 * @api public
	 */
	
	exports.bind = function(el, type, fn, capture){
	  el[bind](prefix + type, fn, capture || false);
	  return fn;
	};
	
	/**
	 * Unbind `el` event `type`'s callback `fn`.
	 *
	 * @param {Element} el
	 * @param {String} type
	 * @param {Function} fn
	 * @param {Boolean} capture
	 * @return {Function}
	 * @api public
	 */
	
	exports.unbind = function(el, type, fn, capture){
	  el[unbind](prefix + type, fn, capture || false);
	  return fn;
	};

/***/ },
/* 15 */
/***/ function(module, exports) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	module.exports = Emitter;
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 16 */
/***/ function(module, exports) {

	/**
	 * Avoid of null and undefined in output
	 *
	 * @param {String} html
	 * @return {String}
	 * @api public
	 */
	exports.nonull = function (str) {
	  if (str == null) return ''
	  return String(str)
	}
	
	/**
	 * Stringify value.
	 *
	 * @param {Number} indent
	 */
	
	exports.json = function (value, indent) {
	  return typeof value === 'string'
	      ? value
	      : JSON.stringify(value, null, Number(indent) || 2)
	}
	
	/**
	 * 'abc' => 'Abc'
	 */
	
	exports.capitalize = function (value) {
	  if (!value && value !== 0) return ''
	  value = value.toString()
	  return value.charAt(0).toUpperCase() + value.slice(1)
	}
	
	/**
	 * 'abc' => 'ABC'
	 */
	
	exports.uppercase = function (value) {
	  return (value || value === 0)
	    ? value.toString().toUpperCase()
	    : ''
	}
	
	/**
	 * 'AbC' => 'abc'
	 */
	
	exports.lowercase = function (value) {
	  return (value || value === 0)
	    ? value.toString().toLowerCase()
	    : ''
	}
	
	/**
	 * 12345 => 12,345.00
	 *
	 * @param {Mixed} value
	 * @param {Number} precision
	 */
	
	var digitsRE = /(\d)(?=(?:\d{3})+$)/g
	exports.currency = function (value, precision) {
	  value = parseFloat(value)
	  if (!isFinite(value) || (!value && value !== 0)) return ''
	  precision = precision == null ? 2 : precision
	  value = Number(value)
	  value = value.toFixed(precision)
	  var parts = value.split('.'),
	  fnum = parts[0],
	  decimal = parts[1] ? '.' + parts[1] : ''
	
	  return fnum.replace(digitsRE, '$1,') + decimal
	}
	
	/**
	 * Reverse string
	 *
	 * @param {string} str
	 * @return {String}
	 * @api public
	 */
	exports.reverse = function (str) {
	  if (!str && str !== 0) return ''
	  return String(str).split(/\s*/).reverse().join('')
	}


/***/ },
/* 17 */
/***/ function(module, exports) {

	/**
	 * Export `uid`
	 */
	
	module.exports = uid;
	
	/**
	 * Create a `uid`
	 *
	 * @param {String} len
	 * @return {String} uid
	 */
	
	function uid(len) {
	  len = len || 7;
	  return Math.random().toString(35).substr(2, len);
	}


/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = [
		{
			"_id": "5639bc8e7fbc8738d0a6a845",
			"isActive": false,
			"age": 20,
			"name": "Jewell Scott",
			"gender": "female",
			"company": "YURTURE",
			"email": "jewellscott@yurture.com",
			"phone": "+1 (873) 568-3672",
			"address": "241 Highland Place, Allison, Delaware, 2810",
			"date": "2015-06-22T12:05:16"
		},
		{
			"_id": "5639bc8e9df82e9e997de05c",
			"isActive": false,
			"age": 26,
			"name": "Jacqueline French",
			"gender": "female",
			"company": "DIGIGEN",
			"email": "jacquelinefrench@digigen.com",
			"phone": "+1 (942) 461-3102",
			"address": "455 Kent Street, Saranap, Illinois, 8315",
			"date": "2015-07-02T09:36:35"
		},
		{
			"_id": "5639bc8eee033a370fc598e6",
			"isActive": false,
			"age": 29,
			"name": "Jana Davis",
			"gender": "female",
			"company": "POLARIA",
			"email": "janadavis@polaria.com",
			"phone": "+1 (902) 499-3779",
			"address": "790 Gunnison Court, Masthope, Alaska, 7549",
			"date": "2014-08-27T05:02:30"
		},
		{
			"_id": "5639bc8ede7faa08a6278008",
			"isActive": false,
			"age": 31,
			"name": "Marjorie Silva",
			"gender": "female",
			"company": "EPLODE",
			"email": "marjoriesilva@eplode.com",
			"phone": "+1 (885) 588-3544",
			"address": "413 Sackman Street, Bluffview, Minnesota, 1447",
			"date": "2014-09-30T05:15:14"
		},
		{
			"_id": "5639bc8ed76f4c96da6ac876",
			"isActive": true,
			"age": 21,
			"name": "Grimes Bonner",
			"gender": "male",
			"company": "BUNGA",
			"email": "grimesbonner@bunga.com",
			"phone": "+1 (936) 514-2255",
			"address": "618 Batchelder Street, Cornfields, Nebraska, 7183",
			"date": "2014-10-10T07:27:40"
		},
		{
			"_id": "5639bc8e7d3a6b586c76ba20",
			"isActive": false,
			"age": 22,
			"name": "Park Graves",
			"gender": "male",
			"company": "INSURITY",
			"email": "parkgraves@insurity.com",
			"phone": "+1 (841) 473-2677",
			"address": "660 Visitation Place, Fivepointville, North Carolina, 1086",
			"date": "2015-10-04T12:05:15"
		},
		{
			"_id": "5639bc8e814a50d548ebb437",
			"isActive": false,
			"age": 38,
			"name": "Hallie Woodard",
			"gender": "female",
			"company": "QNEKT",
			"email": "halliewoodard@qnekt.com",
			"phone": "+1 (806) 559-3485",
			"address": "220 Tompkins Place, Hackneyville, Washington, 7512",
			"date": "2014-08-08T06:16:09"
		},
		{
			"_id": "5639bc8e7d9c69ac0dc4eab9",
			"isActive": false,
			"age": 34,
			"name": "Lopez Gutierrez",
			"gender": "male",
			"company": "BALOOBA",
			"email": "lopezgutierrez@balooba.com",
			"phone": "+1 (821) 599-3278",
			"address": "126 Nassau Street, Tolu, Marshall Islands, 3096",
			"date": "2014-09-15T06:10:45"
		},
		{
			"_id": "5639bc8ec524eec56a0bc534",
			"isActive": false,
			"age": 35,
			"name": "Duran Ball",
			"gender": "male",
			"company": "ESCENTA",
			"email": "duranball@escenta.com",
			"phone": "+1 (881) 581-3511",
			"address": "540 Heath Place, Malott, New Jersey, 336",
			"date": "2015-08-06T07:29:51"
		},
		{
			"_id": "5639bc8ee2bcc557dcd40637",
			"isActive": true,
			"age": 37,
			"name": "Hardy Cash",
			"gender": "male",
			"company": "JETSILK",
			"email": "hardycash@jetsilk.com",
			"phone": "+1 (925) 427-2862",
			"address": "696 Baycliff Terrace, Woodburn, North Dakota, 3849",
			"date": "2015-05-10T01:26:31"
		},
		{
			"_id": "5639bc8e014fb73364446601",
			"isActive": false,
			"age": 39,
			"name": "Bowman Fowler",
			"gender": "male",
			"company": "COMBOGENE",
			"email": "bowmanfowler@combogene.com",
			"phone": "+1 (835) 463-2222",
			"address": "781 Mermaid Avenue, Trona, Michigan, 4389",
			"date": "2014-01-18T06:08:57"
		},
		{
			"_id": "5639bc8e9f5845807bda5de4",
			"isActive": true,
			"age": 26,
			"name": "Lesa Swanson",
			"gender": "female",
			"company": "OCEANICA",
			"email": "lesaswanson@oceanica.com",
			"phone": "+1 (836) 575-2082",
			"address": "667 Hyman Court, Toftrees, Louisiana, 8266",
			"date": "2015-05-14T08:01:34"
		},
		{
			"_id": "5639bc8e9a3dba6c8f4e2a4e",
			"isActive": true,
			"age": 34,
			"name": "Hilda Copeland",
			"gender": "female",
			"company": "FREAKIN",
			"email": "hildacopeland@freakin.com",
			"phone": "+1 (977) 502-3364",
			"address": "503 Grove Place, Greenbush, Puerto Rico, 9990",
			"date": "2014-07-31T11:35:27"
		},
		{
			"_id": "5639bc8efc9215deefe6b734",
			"isActive": true,
			"age": 23,
			"name": "Savage Hampton",
			"gender": "male",
			"company": "AQUASURE",
			"email": "savagehampton@aquasure.com",
			"phone": "+1 (884) 494-3396",
			"address": "940 Wilson Street, Trail, West Virginia, 2228",
			"date": "2014-09-04T01:41:46"
		},
		{
			"_id": "5639bc8e661eebd396c96aca",
			"isActive": true,
			"age": 34,
			"name": "Tiffany Clarke",
			"gender": "female",
			"company": "COGENTRY",
			"email": "tiffanyclarke@cogentry.com",
			"phone": "+1 (860) 576-3158",
			"address": "384 Brigham Street, Cecilia, American Samoa, 8863",
			"date": "2015-05-12T11:16:04"
		},
		{
			"_id": "5639bc8e8fd76f371c6bce58",
			"isActive": false,
			"age": 29,
			"name": "Wilcox Owen",
			"gender": "male",
			"company": "CINCYR",
			"email": "wilcoxowen@cincyr.com",
			"phone": "+1 (938) 431-3344",
			"address": "550 Dewey Place, Yettem, Connecticut, 6643",
			"date": "2015-10-08T11:57:33"
		},
		{
			"_id": "5639bc8e2581172d86a2b82d",
			"isActive": true,
			"age": 26,
			"name": "Paul Mccullough",
			"gender": "male",
			"company": "ESCHOIR",
			"email": "paulmccullough@eschoir.com",
			"phone": "+1 (908) 437-2113",
			"address": "105 Menahan Street, Brogan, Ohio, 9145",
			"date": "2014-01-14T11:08:46"
		},
		{
			"_id": "5639bc8ee930e35e122958d2",
			"isActive": false,
			"age": 39,
			"name": "Reba Collins",
			"gender": "female",
			"company": "DEEPENDS",
			"email": "rebacollins@deepends.com",
			"phone": "+1 (934) 464-3355",
			"address": "761 Hanson Place, Wikieup, District Of Columbia, 5272",
			"date": "2014-08-22T07:21:55"
		},
		{
			"_id": "5639bc8eb0c0a186fa568db7",
			"isActive": false,
			"age": 39,
			"name": "Moreno Kramer",
			"gender": "male",
			"company": "FLUM",
			"email": "morenokramer@flum.com",
			"phone": "+1 (826) 577-2074",
			"address": "597 Ovington Court, Mansfield, Colorado, 5406",
			"date": "2014-08-07T07:17:45"
		},
		{
			"_id": "5639bc8ec1d8a9cd55d98983",
			"isActive": false,
			"age": 35,
			"name": "Janis Keith",
			"gender": "female",
			"company": "EMERGENT",
			"email": "janiskeith@emergent.com",
			"phone": "+1 (948) 434-2158",
			"address": "166 Sands Street, Allentown, South Dakota, 9071",
			"date": "2015-04-04T09:44:16"
		}
	];

/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = [
		{
			"_id": "5639bcb904a9e2784b0421fd",
			"isActive": true,
			"age": 28,
			"name": "Head Nielsen",
			"gender": "male",
			"company": "ZILLACOM",
			"email": "headnielsen@zillacom.com",
			"phone": "+1 (808) 522-2540",
			"address": "724 Fountain Avenue, Draper, New Jersey, 9992",
			"date": "2014-06-07T01:07:23"
		},
		{
			"_id": "5639bcb90390095dbf0bc02d",
			"isActive": false,
			"age": 33,
			"name": "Juliana Richards",
			"gender": "female",
			"company": "ELITA",
			"email": "julianarichards@elita.com",
			"phone": "+1 (843) 580-2231",
			"address": "192 Cox Place, Windsor, Alabama, 9600",
			"date": "2014-10-10T10:10:03"
		},
		{
			"_id": "5639bcb98a9a7e5019e2fd48",
			"isActive": false,
			"age": 27,
			"name": "Cohen Rutledge",
			"gender": "male",
			"company": "LUXURIA",
			"email": "cohenrutledge@luxuria.com",
			"phone": "+1 (924) 461-2283",
			"address": "648 Lyme Avenue, Loomis, Virginia, 9747",
			"date": "2015-10-17T11:44:24"
		},
		{
			"_id": "5639bcb9c3d0065b9e75d5f2",
			"isActive": true,
			"age": 20,
			"name": "Tucker Moreno",
			"gender": "male",
			"company": "GEEKNET",
			"email": "tuckermoreno@geeknet.com",
			"phone": "+1 (936) 484-3332",
			"address": "529 Emerald Street, Why, New Hampshire, 9855",
			"date": "2015-05-17T12:50:05"
		},
		{
			"_id": "5639bcb9c6d9e68220de0c2a",
			"isActive": true,
			"age": 22,
			"name": "Wyatt Benson",
			"gender": "male",
			"company": "OPPORTECH",
			"email": "wyattbenson@opportech.com",
			"phone": "+1 (818) 450-2815",
			"address": "903 Hart Street, Ilchester, Louisiana, 304",
			"date": "2014-05-17T02:48:54"
		},
		{
			"_id": "5639bcb95d4b3491b54a3ecb",
			"isActive": true,
			"age": 31,
			"name": "Claudette Marks",
			"gender": "female",
			"company": "IDEGO",
			"email": "claudettemarks@idego.com",
			"phone": "+1 (908) 408-3508",
			"address": "723 Hazel Court, Faxon, Indiana, 7500",
			"date": "2015-05-17T11:00:22"
		},
		{
			"_id": "5639bcb972c3e9216215c915",
			"isActive": false,
			"age": 25,
			"name": "Ray Burke",
			"gender": "male",
			"company": "ZENTHALL",
			"email": "rayburke@zenthall.com",
			"phone": "+1 (835) 534-3856",
			"address": "582 Liberty Avenue, Yonah, Connecticut, 2613",
			"date": "2015-10-19T11:47:01"
		},
		{
			"_id": "5639bcb9b5f466182d493637",
			"isActive": true,
			"age": 26,
			"name": "Rowena Joyce",
			"gender": "female",
			"company": "XYQAG",
			"email": "rowenajoyce@xyqag.com",
			"phone": "+1 (886) 432-3341",
			"address": "452 Broome Street, Norvelt, Mississippi, 7845",
			"date": "2014-01-19T09:56:38"
		},
		{
			"_id": "5639bcb9f6a030b86313ed45",
			"isActive": true,
			"age": 24,
			"name": "Lourdes Rosales",
			"gender": "female",
			"company": "ACCUPHARM",
			"email": "lourdesrosales@accupharm.com",
			"phone": "+1 (841) 517-2921",
			"address": "110 Maujer Street, Baker, District Of Columbia, 758",
			"date": "2014-06-07T05:53:56"
		},
		{
			"_id": "5639bcb98e972ea07dc86dc4",
			"isActive": true,
			"age": 31,
			"name": "Lelia Mcmahon",
			"gender": "female",
			"company": "GEOFARM",
			"email": "leliamcmahon@geofarm.com",
			"phone": "+1 (922) 552-2155",
			"address": "189 Cypress Court, Munjor, North Dakota, 9741",
			"date": "2014-03-11T04:59:12"
		},
		{
			"_id": "5639bcb917b0fde7a28704ed",
			"isActive": true,
			"age": 35,
			"name": "Kerr Larsen",
			"gender": "male",
			"company": "MAGNINA",
			"email": "kerrlarsen@magnina.com",
			"phone": "+1 (988) 535-3782",
			"address": "623 Linden Street, Gilmore, Kentucky, 4962",
			"date": "2014-08-02T04:25:15"
		},
		{
			"_id": "5639bcb97b6ed8e856d03458",
			"isActive": true,
			"age": 20,
			"name": "Sara Edwards",
			"gender": "female",
			"company": "ISOTERNIA",
			"email": "saraedwards@isoternia.com",
			"phone": "+1 (822) 475-3654",
			"address": "606 Joval Court, Cobbtown, Pennsylvania, 166",
			"date": "2015-03-18T01:43:04"
		},
		{
			"_id": "5639bcb948e67663f13eb67e",
			"isActive": false,
			"age": 30,
			"name": "Wong Lowery",
			"gender": "male",
			"company": "DANCITY",
			"email": "wonglowery@dancity.com",
			"phone": "+1 (999) 446-3888",
			"address": "201 Haring Street, Logan, New Mexico, 5934",
			"date": "2014-11-05T11:46:51"
		},
		{
			"_id": "5639bcb9f85f0e10b5e4fea2",
			"isActive": false,
			"age": 38,
			"name": "Keith Duke",
			"gender": "male",
			"company": "SHOPABOUT",
			"email": "keithduke@shopabout.com",
			"phone": "+1 (945) 501-2554",
			"address": "411 Bethel Loop, Caspar, South Carolina, 1385",
			"date": "2015-02-13T10:02:11"
		},
		{
			"_id": "5639bcb9ee8abd5f3edb8304",
			"isActive": true,
			"age": 29,
			"name": "Hines Crosby",
			"gender": "male",
			"company": "THREDZ",
			"email": "hinescrosby@thredz.com",
			"phone": "+1 (922) 530-2926",
			"address": "187 Seeley Street, Biehle, Vermont, 9397",
			"date": "2015-05-29T05:40:51"
		},
		{
			"_id": "5639bcb91a53a5e82a09ef39",
			"isActive": false,
			"age": 20,
			"name": "Trujillo Ross",
			"gender": "male",
			"company": "NEOCENT",
			"email": "trujilloross@neocent.com",
			"phone": "+1 (870) 564-3456",
			"address": "826 Tapscott Street, Gratton, West Virginia, 9621",
			"date": "2014-07-25T11:37:20"
		},
		{
			"_id": "5639bcb9c22beac024fe90f0",
			"isActive": false,
			"age": 36,
			"name": "Katina Best",
			"gender": "female",
			"company": "COMVEY",
			"email": "katinabest@comvey.com",
			"phone": "+1 (900) 539-2458",
			"address": "284 Glendale Court, Gordon, Arkansas, 1066",
			"date": "2015-10-17T05:01:58"
		},
		{
			"_id": "5639bcb99acdd948f2cb6c00",
			"isActive": true,
			"age": 39,
			"name": "Ophelia Mclaughlin",
			"gender": "female",
			"company": "HAWKSTER",
			"email": "opheliamclaughlin@hawkster.com",
			"phone": "+1 (981) 440-3580",
			"address": "242 Milford Street, Bayview, Maine, 6020",
			"date": "2014-03-18T08:25:34"
		},
		{
			"_id": "5639bcb97c0b2cdf4aee9191",
			"isActive": false,
			"age": 33,
			"name": "Brandi Sexton",
			"gender": "female",
			"company": "ECRAZE",
			"email": "brandisexton@ecraze.com",
			"phone": "+1 (855) 572-2661",
			"address": "974 Holly Street, Keyport, Georgia, 5590",
			"date": "2015-10-23T08:45:28"
		},
		{
			"_id": "5639bcb9088974164378ba38",
			"isActive": true,
			"age": 29,
			"name": "Thelma Freeman",
			"gender": "female",
			"company": "ECRATIC",
			"email": "thelmafreeman@ecratic.com",
			"phone": "+1 (810) 519-3879",
			"address": "101 Wyckoff Street, Ypsilanti, Massachusetts, 6468",
			"date": "2014-12-12T05:12:52"
		}
	];

/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = [
		{
			"_id": "5639bcdeda8bdbce57cbe412",
			"isActive": true,
			"age": 3,
			"name": "Wagner Gates",
			"gender": "male",
			"company": "SEQUITUR",
			"email": "wagnergates@sequitur.com",
			"phone": "+1 (859) 481-2805",
			"address": "794 Bergen Court, Walton, Arkansas, 6545",
			"date": "2015-05-27T04:14:24"
		},
		{
			"_id": "5639bcde8d668ec87bf57f01",
			"isActive": true,
			"age": 2,
			"name": "Leticia Peters",
			"gender": "female",
			"company": "ISOPLEX",
			"email": "leticiapeters@isoplex.com",
			"phone": "+1 (891) 499-3915",
			"address": "963 Beadel Street, Stockwell, New York, 5858",
			"date": "2015-05-26T11:04:15"
		},
		{
			"_id": "5639bcde38ff31b3b6114ef3",
			"isActive": false,
			"age": 39,
			"name": "Beulah Chapman",
			"gender": "female",
			"company": "VOIPA",
			"email": "beulahchapman@voipa.com",
			"phone": "+1 (840) 437-3196",
			"address": "656 Hale Avenue, Wollochet, Louisiana, 2252",
			"date": "2015-09-13T06:14:23"
		},
		{
			"_id": "5639bcde0431e57d5ee94f1a",
			"isActive": true,
			"age": 4,
			"name": "Elba Mathis",
			"gender": "female",
			"company": "SURELOGIC",
			"email": "elbamathis@surelogic.com",
			"phone": "+1 (950) 484-3629",
			"address": "330 Gold Street, Matheny, New Mexico, 8723",
			"date": "2015-08-05T12:51:00"
		},
		{
			"_id": "5639bcde3163e36a162d57fe",
			"isActive": true,
			"age": 32,
			"name": "Therese Avila",
			"gender": "female",
			"company": "ROTODYNE",
			"email": "thereseavila@rotodyne.com",
			"phone": "+1 (978) 435-3250",
			"address": "885 Bergen Street, Drummond, Pennsylvania, 7291",
			"date": "2015-08-02T07:27:25"
		},
		{
			"_id": "5639bcde4cfab18ecc732b40",
			"isActive": false,
			"age": 25,
			"name": "Cross Callahan",
			"gender": "male",
			"company": "MOREGANIC",
			"email": "crosscallahan@moreganic.com",
			"phone": "+1 (912) 408-3490",
			"address": "141 Stillwell Place, Succasunna, Oregon, 7088",
			"date": "2014-12-04T12:17:23"
		},
		{
			"_id": "5639bcde8de958784d25a796",
			"isActive": false,
			"age": 24,
			"name": "Singleton Sexton",
			"gender": "male",
			"company": "VISUALIX",
			"email": "singletonsexton@visualix.com",
			"phone": "+1 (822) 537-2156",
			"address": "713 Reed Street, Riegelwood, Iowa, 8765",
			"date": "2014-01-10T09:26:35"
		},
		{
			"_id": "5639bcdef366cecb712892a2",
			"isActive": false,
			"age": 20,
			"name": "Santana Vang",
			"gender": "male",
			"company": "QUADEEBO",
			"email": "santanavang@quadeebo.com",
			"phone": "+1 (945) 562-3612",
			"address": "163 Cambridge Place, Takilma, New Jersey, 6627",
			"date": "2015-04-03T08:43:25"
		},
		{
			"_id": "5639bcde18ce29b75b675455",
			"isActive": true,
			"age": 22,
			"name": "Lowe Maddox",
			"gender": "male",
			"company": "PLASMOX",
			"email": "lowemaddox@plasmox.com",
			"phone": "+1 (885) 424-3236",
			"address": "440 Victor Road, Blackgum, Michigan, 4273",
			"date": "2015-09-03T12:23:21"
		},
		{
			"_id": "5639bcde07126dbe18326b4b",
			"isActive": true,
			"age": 27,
			"name": "Howell Lynch",
			"gender": "male",
			"company": "GEEKMOSIS",
			"email": "howelllynch@geekmosis.com",
			"phone": "+1 (927) 548-3611",
			"address": "908 Doscher Street, Dale, North Carolina, 4998",
			"date": "2014-04-16T08:12:14"
		},
		{
			"_id": "5639bcded2a355ce64d20e88",
			"isActive": true,
			"age": 37,
			"name": "Angela Obrien",
			"gender": "female",
			"company": "NETBOOK",
			"email": "angelaobrien@netbook.com",
			"phone": "+1 (822) 565-2064",
			"address": "254 Seeley Street, Orviston, Virginia, 7905",
			"date": "2014-05-07T11:17:57"
		},
		{
			"_id": "5639bcde6480dbd802b16a4b",
			"isActive": true,
			"age": 30,
			"name": "Chen Murray",
			"gender": "male",
			"company": "VIDTO",
			"email": "chenmurray@vidto.com",
			"phone": "+1 (834) 451-2855",
			"address": "475 Greenwood Avenue, Orick, Indiana, 3709",
			"date": "2015-05-10T09:53:13"
		},
		{
			"_id": "5639bcde5d542cbba4cfb756",
			"isActive": false,
			"age": 33,
			"name": "Viola Booth",
			"gender": "female",
			"company": "MAGNINA",
			"email": "violabooth@magnina.com",
			"phone": "+1 (813) 460-2342",
			"address": "153 Chester Court, Century, Kansas, 4026",
			"date": "2014-07-08T12:29:43"
		},
		{
			"_id": "5639bcdeec385d77bd2574d3",
			"isActive": false,
			"age": 24,
			"name": "Lela Monroe",
			"gender": "female",
			"company": "OMATOM",
			"email": "lelamonroe@omatom.com",
			"phone": "+1 (858) 596-2167",
			"address": "285 Baycliff Terrace, Coalmont, Hawaii, 2446",
			"date": "2015-08-17T06:17:34"
		},
		{
			"_id": "5639bcdefd6a2a03c760c0bb",
			"isActive": true,
			"age": 36,
			"name": "Mcdonald Summers",
			"gender": "male",
			"company": "CIRCUM",
			"email": "mcdonaldsummers@circum.com",
			"phone": "+1 (930) 539-3787",
			"address": "735 Beach Place, Harborton, Virgin Islands, 8416",
			"date": "2015-06-08T09:48:54"
		},
		{
			"_id": "5639bcde32f9f920f104c11e",
			"isActive": false,
			"age": 25,
			"name": "Hilary Cummings",
			"gender": "female",
			"company": "DYNO",
			"email": "hilarycummings@dyno.com",
			"phone": "+1 (928) 543-2255",
			"address": "587 Elmwood Avenue, Yorklyn, South Dakota, 846",
			"date": "2014-02-01T05:58:00"
		},
		{
			"_id": "5639bcdef8342a74486b0db4",
			"isActive": true,
			"age": 25,
			"name": "Tammy Cline",
			"gender": "female",
			"company": "NETILITY",
			"email": "tammycline@netility.com",
			"phone": "+1 (991) 425-3626",
			"address": "492 Cumberland Street, Fedora, Massachusetts, 5142",
			"date": "2015-09-25T04:56:48"
		},
		{
			"_id": "5639bcdedf752e900c9c50ac",
			"isActive": true,
			"age": 37,
			"name": "Holt Mack",
			"gender": "male",
			"company": "AEORA",
			"email": "holtmack@aeora.com",
			"phone": "+1 (866) 529-3674",
			"address": "178 Metrotech Courtr, Neibert, Montana, 7692",
			"date": "2015-04-18T12:58:04"
		},
		{
			"_id": "5639bcde87bddfe8efcbc53b",
			"isActive": false,
			"age": 32,
			"name": "Sheena Drake",
			"gender": "female",
			"company": "DEMINIMUM",
			"email": "sheenadrake@deminimum.com",
			"phone": "+1 (856) 420-2768",
			"address": "364 Dooley Street, Broadlands, Palau, 2011",
			"date": "2015-07-25T01:38:51"
		},
		{
			"_id": "5639bcde38624b54fb691ff1",
			"isActive": false,
			"age": 35,
			"name": "Vonda Oneal",
			"gender": "female",
			"company": "NIXELT",
			"email": "vondaoneal@nixelt.com",
			"phone": "+1 (951) 519-3232",
			"address": "973 Richards Street, Lumberton, Ohio, 6230",
			"date": "2015-03-12T02:02:53"
		}
	];

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map