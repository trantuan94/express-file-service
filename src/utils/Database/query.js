'use strict'

const Utils = require('../index')
const DateUtil = require('../date')
const { ObjectId } = require('mongodb')

module.exports = {

  /**
   * Hàm để tạo ra conditions search phục vụ cho React Table
   * Dữ liệu vào là 1 mảng các filter.
   * Dữ liệu ra là 1 mảng các condition
   * @param inputs [
   * '{'columnName':'customer.name','value':'1', 'dataType': 'text', 'operation': contains}',
   * ... v.v
   * ]
   * @param relations ['area', 'customer']
   */
  buildFilterForGridTable (inputs, relations) {
    const conditions = {}
    const filters = {}
    try {
      for (let filter of inputs) { // foreach mảng filters
        if (Utils.isString(filter)) filter = JSON.parse(filter) // chuyển filter thành json để lấy columnName và value
        if (filter.columnName) {
          let value = filter.value
          const operation = filter.operation || 'contains'
          const dataType = filter.dataType
          let condition = null

          switch (dataType) {
            case 'text':
              value = String(value).trim()
              break
            case 'date':
              // value = new Date(value)
              break
            case 'number':
              value = Number(value)
              break
            case 'objectId':
              value = Array.isArray(value) ? value.map(val => ObjectId(val)) : ObjectId(value)
              break
            default:
              console.log(`unknown data type: ${dataType} in GridTable's filter.`)
          }

          switch (operation) {
            case 'contains':
              condition = new RegExp(this.escapeRegExp(String(value).trim()), 'i') // không phân biệt hoa thường. search LIKE
              break
            case 'notContains':
              condition = {
                $not: new RegExp(this.escapeRegExp(String(value).trim()), 'i')
              }
              break
            case 'startsWith':
              condition = new RegExp('^' + this.escapeRegExp(String(value).trim()), 'i') // không phân biệt hoa thường. search LIKE
              break
            case 'endsWith':
              condition = new RegExp(this.escapeRegExp(String(value).trim()) + '$', 'i') // không phân biệt hoa thường. search LIKE
              break
            case 'equal':
              if (dataType === 'text' || typeof value === 'string') {
                condition = new RegExp('^' + this.escapeRegExp(String(value).trim()) + '$', 'i') // không phân biệt hoa thường. search LIKE
              } else {
                condition = {
                  $eq: value
                }
              }
              break
            case 'notEqual':
              if (dataType === 'text' || typeof value === 'string') {
                condition = {
                  $not: new RegExp('^' + this.escapeRegExp(String(value).trim()) + '$', 'i') // không phân biệt hoa thường. search LIKE
                }
              } else {
                condition = {
                  $ne: value
                }
              }
              break
            case 'greaterThan':
              condition = {
                $gt: value
              }
              break
            case 'graterThenOrEqual':
              condition = {
                $gte: value
              }
              break
            case 'lessThan':
              condition = {
                $lt: value
              }
              break
            case 'lessThanOrEqual':
              condition = {
                $lte: value
              }
              break
            case 'daterange':
              // condition = {
              //   $gte: DateUtil.getLocalTimeByUTC(value.startDate),
              //   $lte: DateUtil.getLocalTimeByUTC(value.endDate)
              // }
              condition = {
                $gte: DateUtil.getStartOfDate(value.startDate, true),
                $lte: DateUtil.getEndOftDate(value.endDate, true)
              }
              // console.log('condition daterange', condition)
              break
            case 'includes':
              condition = {
                $in: Array.isArray(value) ? value : [value]
              }
              break
            default:
              console.log(`unknown operation: ${operation} in GridTable's filter.`)
          }
          if (condition) {
            let key = filter.columnName
            const arr = key.split('.')
            const path = arr.shift()
            if (Utils.inArray(relations, path)) {
              key = arr.join('.')
              if (!conditions[path]) conditions[path] = {}
              conditions[path][key] = condition
            } else {
              filters[key] = condition
            }
          }
        }
      }
    } catch (e) {
      console.error('condition error: ', e.message, inputs)
    }

    return { conditions, filters }
  },

  buildSortForGridTable (sorts) {
    const sortCondition = {}
    sorts.forEach((sort) => { // foreach mảng sorts
      if (typeof sort === 'string') sort = JSON.parse(sort) // chuyển filter thành json để lấy ID và value
      if (sort.columnName) {
        sortCondition[sort.columnName] = sort.direction === 'desc' ? -1 : 1
      }
    })
    return sortCondition
  },

  escapeRegExp (string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
  },

  setFilters (options, filters = [], relations = []) {
    if (filters.length) {
      const rs = this.buildFilterForGridTable(filters, relations)
      // console.log('setFilters conditions', rs)
      options.conditions = Object.assign({}, rs.conditions)
      options.filters = Object.assign(options.filters, rs.filters)
    }
    return options
  },

  setSortConditions (options, sorts) {
    if (sorts.length) {
      // console.log('setSortConditions', this.buildSortForGridTable(sorts));
      options.sorts = this.buildSortForGridTable(sorts)
    }
    return options
  }
}
