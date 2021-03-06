# list-render

[![Build Status](https://secure.travis-ci.org/chemzqm/list-render.svg)](http://travis-ci.org/chemzqm/list-render)
[![Dependency Status](https://david-dm.org/chemzqm/list-render.svg)](https://david-dm.org/chemzqm/list-render)
[![Coverage Status](https://coveralls.io/repos/chemzqm/list-render/badge.svg?branch=master&service=github)](https://coveralls.io/github/chemzqm/list-render?branch=master)

  Basic list view that use [chemzqm/model](https://github.com/chemzqm/model) and [chemzqm/reactive-lite](https://github.com/chemzqm/reactive-lite)
  for high level component use,(eg: [mobile-list](https://github.com/chemzqm/mobile-list), [exgrid](https://github.com/chemzqm/exgrid)),😀

  This component does not contain any event or loading method, but limited for dom operation.

## Usage

``` js
var List =require('list-render')
var list = new List(template, parentNode, {
  limit: 10,
  delegate: {}, // for reactive
  bindings: {},// for reactive
  filters: {} // for reactive
})
var users = [{first: 'tobi', last: 'bear'}]
list.setData(users)
```

## API

### ListRender(template, parentNode, [option])

* `template` repeat element or (template string) for rendering
* `parentNode` element for list element to append to
* `option` optional config
* `option.delegate` delegate object for [reactive]()
* `option.bindings` bindings object for [reactive]()
* `option.filters` filters object for [reactive]()
* `option.model` [model]() class used for generate model
* `option.limit` the limit number for render when `setData()` (default Infinite)
* `option.perpage` used for paging should >= option.limit
* `option.empty` String or Element rendered in parentNode when internal data list is empty

### .setData(array)

  Set internal data array, and render them limit by `option.limit`

### .more(max)

  Render more internal data limit by max, return `false` if no more data to render

### .react(attrs)

  React model change with `attrs`, `attrs` must contain primaryKey.

### .appendData(array)

  Append more data and render them, no refresh

### .prependData(array)

  Append more data and render them, no refresh

### .renderRange(start, [end])

  Empty the exist list, and render the specific range of internal data array (no option.limit restrict, end is exclude)

### .filterData(field, val | function)

  Filter the with `field` and `val` (or function used for array.filter), and render them limit by `option.limit`
  When val is false, render all with limit by `option.limit`
  return filter array length

### .sortData(field, direction, [method])

  Sort the data with `field` `direction` ( 1 or -1 for ascend and descend)
  and method (`string` or `number`, or a sort function for javascript array),
  if no method, it guess the method by field value, render them limit by `option.limit`

### .findModel(el)

  Find a specific [model instance](https://github.com/chemzqm/model) related by element, useful for event delegate

### .remove()

  Remove the list elements, unbind all reactives and models created inside.

### .select(n)

  Render page `n`, expect perpage option specified.

### model.remove()

  Each created model would have `remove()` method, which remove associate `reactive` (including remove node, unbind change events).
  If remove exist on model, this function would append to origin remove and replace it.
  If exist remove method return promise(eg: ajax request), this function would not be called when rejected or resolved as false.

### onchange(isRemove)

Interface that called when dom change, isRemove is true when called after model remove
