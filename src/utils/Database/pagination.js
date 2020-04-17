'use strict'

module.exports = {
  paginationResult (skip, limit, data, total, filters = {}) {
    return {
      skip: skip,
      limit: limit,
      filters: filters,
      count: data.length,
      list_data: data,
      total: total || data.length
    }
  }
}
