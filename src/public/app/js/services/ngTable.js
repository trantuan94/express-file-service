'use strict';

angular.module('pisignage.services')
  .factory('piNgTable', function (NgTableParams) {

    return {

      arrFieldDate: ['insert.when'],
      arrFieldBoolean: ['isConnected'],

      setConditions(params) {
        return {
          currentPage: params.page() -1,
          pageSize: params.count(),
          'filters[]': this.setFilter(params.filter()),
          'sorting[]': this.setSorts(params.orderBy())
        }
      },

      setFilter(filters = {}) {
        let conditions = []
        for (let [columnName, value] of Object.entries(filters)) {
          if (!value) continue;

          let dataType = "text";
          let operation = "contains"
          if (this.arrFieldDate.includes(columnName)) {
            dataType = "date";
            value = {"key": "dateRange", "startDate": value, "endDate": value}
            operation = "daterange"
          } else if (this.arrFieldBoolean.includes(columnName)) {
            operation = "equal"
            dataType= "boolean"
            value = value === 'true';
          }
          conditions.push({columnName, value, operation, dataType})
        }
        return conditions
      },

      setSorts(sorts = []) {
        return sorts.map(condition => ({
          columnName: condition.slice(1),
          direction: condition[0] === '-' ? 'desc' : 'asc'
        }))
      },

      default: {
        option: {page: 1, count: 10},
        counts: [10, 25, 50, 100]
      },

      init(fetchData, option, counts) {
        return new NgTableParams(
          {...option},
          {
            counts: counts,
            total: 0,
            getData: (params => fetchData(params))
          }
        )
      }
    }
  });
