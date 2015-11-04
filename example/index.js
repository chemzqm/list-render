var List = require('..')
var Reactive = require('reactive-lite')
var Model = require('model')

var users = require('./users.json')
var append_users = require('./append_users.json')
var prepend_users = require('./prepend_users.json')

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
