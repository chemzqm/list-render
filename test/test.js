/*global describe, it, beforeEach, afterEach*/
var assert = require('assert')
var Model = require('model')
var List = require('..')
var USERS = require('./users.json')
var APPEND_USERS = require('./append_users.json')
var PREPEND_USERS = require('./prepend_users.json')

var template = '<li data-id="{_id}"><span data-text="name">{name}</span><span data-text="age">{age}</span></li>'

function getUserById(id) {
  for (var i = 0, l = USERS.length; i < l ; i++) {
    if (USERS[i]._id == id) {
      return USERS[i]
    }
  }
}

function getValue(el, field) {
  if (field === 'id') return el.id
  var s = '[data-text="' + field + '"]'
  return el.querySelector(s).textContent
}

function getRenderedCount() {
  var lis = parentNode.querySelectorAll('li')
  return lis.length
}

var parentNode
var list
beforeEach(function () {
  parentNode = document.createElement('ul')
  document.body.appendChild(parentNode)
})

afterEach(function () {
  document.body.removeChild(parentNode)
  list.remove()
})

describe('ListRender()', function () {
  it('should create List', function () {
    list = new List(template, parentNode)
    assert(list instanceof List)
  })

  it('should init with element', function () {
    var el = document.createElement('div')
    el.textContent = '{name}'
    list = new List(el, parentNode)
    assert(list instanceof List)
  })

  it('should init with empty element', function () {
    var el = document.createElement('div')
    el.className = 'empty'
    list = new List(el, parentNode, {
      empty: el
    })
    assert(list.emptyEl.className === 'empty')
  })

  it('should create List with out new', function () {
    list = List(template, parentNode)
    assert(list instanceof List)
  })

})

describe('.setData(arr)', function () {
  it('should set data', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    assert.equal(list.data.length, USERS.length)
  })

  it('should generate id if not', function () {
    list = List('<li>{name}</li>', parentNode)
    list.setData([{name: 'tobi'}])
    var r = list.reactives[0]
    assert(!!r.id)
  })

  it('should render data when set', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    assert.equal(list.data.length, USERS.length)
    assert.equal(getRenderedCount(), USERS.length)
  })
})

describe('.more(max)', function () {
  it('should render more data', function () {
    list = List(template, parentNode, {
      limit: 5
    })
    list.setData(USERS)
    assert.equal(getRenderedCount(), 5)
    var m = list.more(5)
    assert.equal(getRenderedCount(), 10)
    assert.equal(m, true)
  })

  it('should return false when no more data rendered', function () {
    list = List(template, parentNode, {
      limit: USERS.length - 2
    })
    list.setData(USERS)
    var m = list.more(5)
    assert.equal(m, true)
    m = list.more(5)
    assert.equal(m, false)
  })
})

describe('.appendData(arr)', function() {
  it('should append more data', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.appendData(APPEND_USERS)
    assert.equal(getRenderedCount(), APPEND_USERS.length + USERS.length)
    var l = APPEND_USERS.length
    var li = parentNode.querySelector('li:last-child')
    var id = getValue(li, 'id')
    assert.equal(id, APPEND_USERS[l - 1]._id)
  })

  it('should change data list and curr pointer', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.appendData(APPEND_USERS)
    assert.equal(list.data.length, APPEND_USERS.length + USERS.length)
    assert.equal(list.curr,  APPEND_USERS.length + USERS.length)
  })
})

describe('.prependData(arr)', function() {
  it('should prepend data', function () {
    list = List(template, parentNode)
    list.prependData(PREPEND_USERS)
    assert.equal(getRenderedCount(), PREPEND_USERS.length)
  })

  it('should prepend more data', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.prependData(PREPEND_USERS)
    assert.equal(getRenderedCount(), PREPEND_USERS.length + USERS.length)
    var id = parentNode.querySelector('li:first-child').id
    assert.equal(id, PREPEND_USERS[0]._id)
  })


  it('should change data list and curr pointer', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.prependData(PREPEND_USERS)
    assert.equal(list.data.length, PREPEND_USERS.length + USERS.length)
    assert.equal(list.curr,  PREPEND_USERS.length + USERS.length)
  })
})

describe('.renderRange(start, [end])', function() {
  it('should render range data', function () {
    list = List(template, parentNode)
    var start = 2
    var end = 5
    list.setData(USERS)
    list.renderRange(start, end)
    assert.equal(getRenderedCount(), end - start)
    var id = parentNode.querySelector('li:first-child').id
    assert.equal(id, USERS[2]._id)
  })

  it('should not limit the count', function () {
    list = List(template, parentNode, {limit: 5})
    list.setData(USERS)
    list.renderRange(0, 10)
    assert.equal(getRenderedCount(), 10)
  })

  it('should render empty when no data to render', function () {
    list = List(template, parentNode, {empty: '<div class="list-empty"></div>'})
    list.setData([])
    assert.equal(parentNode.firstChild.className, 'list-empty')
    list.setData(USERS)
    var el = parentNode.querySelector('.list-empty')
    assert.equal(el, null)
  })

  it('should able to paging items', function () {
    list = List(template, parentNode, {empty: '<div class="list-empty"></div>'})
    list.setData(USERS)
    var l = USERS.length
    for (var i = 0; i < l; i = i + 5) {
      var j = i + 5
      var count = j > l ? l - i : 5
      list.renderRange(i, j)
      assert.equal(getRenderedCount(), count)
      var id = parentNode.firstChild.id
      assert.equal(id, USERS[i]._id)
    }
  })
})

describe('.filterData(field, val|fn)', function() {
  it('should filter data by string', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.filterData('name', 'sa')
    var arr = USERS.filter(function (u) {
      return /s.*a/i.test(u.name)
    })
    var id = parentNode.firstChild.id
    assert.equal(id, arr[0]._id)
    assert.equal(getRenderedCount(), arr.length)
  })

  it('should not filter data when val  not exist', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.filterData('name', 'sa')
    list.filterData('name', '')
    assert.equal(getRenderedCount(), USERS.length)
  })

  it('should filter data by boolean', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.filterData('isActive', false)
    var arr = USERS.filter(function (u) {
      return u.isActive === false
    })
    var id = parentNode.firstChild.id
    assert.equal(id, arr[0]._id)
    assert.equal(getRenderedCount(), arr.length)
  })

  it('should filter data by use function', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    function filter(u) {
      return u.age > 30 && u.age < 40
    }
    list.filterData('name', filter)
    var arr = USERS.filter(filter)
    var id = parentNode.firstChild.id
    assert.equal(id, arr[0]._id)
    assert.equal(getRenderedCount(), arr.length)
  })

  it('should filter data by use function as val', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    function filter(u) {
      return u.age > 30 && u.age < 40
    }
    list.filterData('age', filter)
    var arr = USERS.filter(filter)
    var id = parentNode.firstChild.id
    assert.equal(id, arr[0]._id)
    assert.equal(getRenderedCount(), arr.length)
  })

  it('should render limited result on filter', function () {
    list = List(template, parentNode, {
      limit: 5
    })
    list.setData(USERS)
    function filter(u) {
      return u.age > 0 && u.age < 30
    }
    list.filterData('age', filter)
    assert.equal(getRenderedCount(), 5)
  })

  it('should works with more', function () {
    list = List(template, parentNode, {
      limit: 1
    })
    list.setData(USERS)
    function filter(u) {
      return u.age > 20 && u.age < 30
    }
    var arr = USERS.filter(filter)
    list.filterData(filter)
    for (var i = 0 ; i < arr.length; i++) {
      assert.equal(getRenderedCount(), i + 1)
      var id = parentNode.children[i].id
      assert.equal(id, arr[i]._id)
      list.more(1)
    }
  })

  it('should works with render range', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    function filter(u) {
      return u.age > 10 && u.age < 30
    }
    var arr = USERS.filter(filter)
    var l = arr.length
    list.filterData(filter)
    for (var i = 0 ; i < l; i = i + 3) {
      var j = i + 3
      list.renderRange(i, j)
      var id = parentNode.firstChild.id
      assert.equal(id, arr[i]._id)
    }
  })
})

describe('.sortData()', function() {
  it('should throw when dir invalid', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    var err
    try {
      list.sortData('name', 'asc', 'number')
    } catch (e) {
      err = e
    }
    assert(!!err.message)
  })

  it('should sort data by number', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.sortData('age', 1, 'number')
    var prev = Infinity
    var lis = parentNode.children
    for (var i = 0, l = lis.length; i < l; i++) {
      var age = getValue(lis[i], 'age')
      age = Number(age)
      assert(age <= prev)
      prev =age
    }
  })

  it('should sort data ascend', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.sortData('age', -1)
    var prev = 0
    var lis = parentNode.children
    for (var i = 0, l = lis.length; i < l; i++) {
      var age = getValue(lis[i], 'age')
      age = Number(age)
      assert(age >= prev)
      prev =age
    }
  })

  it('should sort data by string', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.sortData('name', 1, 'string')
    var lis = parentNode.children
    var prev
    for (var i = 0, l = lis.length; i < l; i++) {
      var name = getValue(lis[i], 'name')
      if (prev) assert(name < prev)
      prev = name
    }
  })

  it('should sort data by function', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.sortData('date', 1, function (a, b) {
      return (new Date(a.date)).getTime() - (new Date(b.date)).getTime()
    })
    var lis = parentNode.children
    var prev
    for (var i = 0, l = lis.length; i < l; i++) {
      var user = getUserById(lis[i].id)
      var date = (new Date(user.date)).getTime()
      if (prev) assert(date > prev)
      prev = date
    }
  })

  it('should works with filtered data', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.filterData('name', 'ja')
    list.sortData('name', 1)
    var lis = parentNode.children
    var prev
    for (var i = 0, l = lis.length; i < l; i++) {
      var li = lis[i]
      var user = getUserById(li.id)
      assert(/j.*a/i.test(user.name))
      if (prev) assert(user.name < prev)
    }
  })
})

describe('paging', function() {
  it('should select page by page number', function () {
    list = List(template, parentNode, {
      perpage: 5,
      limit: 5
    })
    list.setData(USERS)
    list.select(1)
    var lis = parentNode.children
    assert.equal(lis.length, 5)
    for (var i = 0, l = lis.length; i < l; i++) {
      var li = lis[i]
      var id = getValue(li, 'id')
      assert.equal(id, USERS[5 + i]._id)
    }
  })

  it('should select prev page', function () {
    list = List(template, parentNode, {
      perpage: 5,
      limit: 5
    })
    list.setData(USERS)
    list.select(2)
    list.prev()
    var lis = parentNode.children
    assert.equal(lis.length, 5)
    for (var i = 0, l = lis.length; i < l; i++) {
      var li = lis[i]
      var id = getValue(li, 'id')
      assert.equal(id, USERS[5 + i]._id)
    }
  })

  it('should select next page', function () {
    list = List(template, parentNode, {
      perpage: 5,
      limit: 5
    })
    list.setData(USERS)
    list.next()
    var lis = parentNode.children
    assert.equal(lis.length, 5)
    for (var i = 0, l = lis.length; i < l; i++) {
      var li = lis[i]
      var id = getValue(li, 'id')
      assert.equal(id, USERS[5 + i]._id)
    }
  })
})

describe('.findModel(el)', function() {
  it('should return null when can\'t find', function () {
    list = List(template, parentNode)
    var r = list.findModel(parentNode)
    list.setData(USERS)
    assert.equal(r, null)
  })

  it('should return null when can\'t find in parentNode', function () {
    list = List(template, parentNode)
    var div = document.createElement('div')
    parentNode.appendChild(div)
    var r = list.findModel(div)
    list.setData(USERS)
    assert.equal(r, null)
  })

  it('should get the model by element inside', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    var el = parentNode.firstChild.firstChild
    var user = getUserById(parentNode.firstChild.id)
    var model = list.findModel(el)
    assert.equal(model._id, user._id)
  })
})

describe('.remove()', function() {
  it('should remove all internal data', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.remove()
    assert.equal(parentNode.children.length, 0)
    assert.equal(list.reactives, null)
    assert.equal(list.data, null)
    assert.equal(list.filtered, null)
  })

  it('should able to call multiply times', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.remove()
    list.remove()
    list.remove()
  })
})

describe('.appendRemove()', function() {
  function assertEmpty() {
    assert.equal(parentNode.children.length, 0)
    assert.equal(list.data.length, 0)
    assert.equal(list.filtered, null)
    assert.equal(list.reactives.length, 0)
  }

  it('should append remove to model if not defined', function () {
    list = List(template, parentNode)
    list.setData(USERS.slice(0, 1))
    list.filterData('name', function () {
      return true
    })
    var model = list.findModel(parentNode.firstChild)
    model.remove()
    assertEmpty()
  })

  it('should works with filtered data', function () {
    list = List(template, parentNode)
    list.setData(USERS)
    list.filterData('isActive', true)
    var l = getRenderedCount()
    var dl = list.data.length
    var fl = list.filtered.length
    var model = list.findModel(parentNode.firstChild)
    model.remove()
    assert.equal(getRenderedCount(), l - 1)
    assert.equal(list.data.length, dl - 1)
    assert.equal(list.filtered.length, fl - 1)
  })

  it('should throw if remove is not function', function () {
    var err
    var User = Model('user').attr('name').attr('_id').attr('age')
    User.prototype.remove = 'bad'
    list = List(template, parentNode, {
      model: User
    })
    try {
      list.setData(USERS)
    } catch (e) {
      err = e
    }
    assert(!!err.message)
  })

  it('should append if remove is function', function () {
    var User = Model('user').attr('name').attr('_id').attr('age')
    var fired
    User.prototype.remove = function () {
      fired = true
      assert.equal(this._id, USERS[0]._id)
    }
    list = List(template, parentNode, {
      model: User
    })
    list.setData(USERS.slice(0, 1))
    var model = list.findModel(parentNode.firstChild)
    model.remove()
    assertEmpty()
    assert.equal(fired, true)
  })

  it('should not remove if resolved value is false', function (done) {
    var User = Model('user').attr('name').attr('_id').attr('age')
    User.prototype.remove = function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          setTimeout(function () {
            assert.equal(parentNode.children.length, 1)
            done()
          }, 10)
          resolve(false)
        }, 20)
      })
    }
    list = List(template, parentNode, {
      model: User
    })
    list.setData(USERS.slice(0, 1))
    var model = list.findModel(parentNode.firstChild)
    model.remove()
    assert.equal(parentNode.children.length, 1)
  })

  it('should append resolved funtion if remove is function return promise', function (done) {
    var User = Model('user').attr('name').attr('_id').attr('age')
    User.prototype.remove = function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          setTimeout(function () {
            assertEmpty()
            done()
          }, 10)
          resolve()
        }, 20)
      })
    }
    list = List(template, parentNode, {
      model: User
    })
    list.setData(USERS.slice(0, 1))
    var model = list.findModel(parentNode.firstChild)
    model.remove()
    assert.equal(parentNode.children.length, 1)
  })

  it('should not call append function if remove function promise rejected', function (done) {
    var User = Model('user').attr('name').attr('_id').attr('age')
    User.prototype.remove = function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          setTimeout(function () {
            assert.equal(parentNode.children.length, 1)
            done()
          }, 10)
          reject()
        }, 20)
      })
    }
    list = List(template, parentNode, {
      model: User
    })
    list.setData(USERS.slice(0, 1))
    var model = list.findModel(parentNode.firstChild)
    model.remove()
    assert.equal(parentNode.children.length, 1)
  })
})

describe('Reactive', function () {
  it('should reactive text-interpolation', function () {
    var temp = '<li>{name}</li>'
    list = List(temp, parentNode)
    list.setData(USERS.slice(0, 2))
    var li = parentNode.children[1]
    assert.equal(li.textContent, USERS[1].name)
  })

  it('should reactive filters', function () {
    var temp = '<li>{date | ymd}</li>'
    function ymd(date) {
      if(!(date instanceof Date)) date = new Date(date)
      if (!date.getTime()) throw new TypeError('Date [' + date + ']is not a valid argument for Date')
      return date.getFullYear() +
        '-' + ('0' + (1 + date.getMonth())).slice(-2) +
        '-' + ('0' + date.getDate()).slice(-2);
    }
    list = List(temp, parentNode, {
      filters: {
        ymd: ymd
      }
    })
    list.setData(USERS.slice(0, 2))
    var li = parentNode.children[1]
    assert.equal(li.textContent, ymd(USERS[1].date))
  })

  it('should able to delegate events', function () {
    var temp = '<li on-click="onclick">{name}</li>'
    var fired
    list = List(temp, parentNode, {
      delegate: {
        onclick: function (e, model, el) {
          fired = true
          assert.equal(model._id, USERS[1]._id)
          assert.equal(el, parentNode.children[1])
        }
      }
    })
    list.setData(USERS.slice(0, 2))
    var li = parentNode.children[1]
    li.click()
    assert.equal(fired, true)
  })

  it('should able to use data-render', function () {
    var temp = '<li data-render="renderName"></li>'
    list = List(temp, parentNode, {
      delegate: {
        renderName: function (model, el) {
          el.innerHTML = 'Hello, ' + model.name
        }
      }
    })
    list.setData(USERS.slice(0, 2))
    var li = parentNode.children[1]
    assert.equal(li.textContent, 'Hello, ' + USERS[1].name)
  })

  it('should reactive binding', function () {
    var temp = '<li data-disable="age">{age}</li>'
    list = List(temp, parentNode, {
      bindings: {
        'data-disable': function (prop) {
          this.bind(prop, function (model, el) {
            if (model[prop] < 18) {
              el.disabled = true
            } else {
              el.disabled = false
            }
          })
        }
      }
    })
    list.setData(USERS.slice(0, 2))
    var li = parentNode.children[1]
    var model = list.findModel(li)
    model.age = 10
    assert.equal(li.disabled, true)
    model.age = 20
    assert.equal(li.disabled, false)
  })

})
