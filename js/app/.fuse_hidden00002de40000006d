var app = angular.module('long-charts', ['ngMaterial', 'ngRoute', 'longitudinalChartControllers', 'dropzone', 'chart.js', 'mdColorPicker']);
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'templates/dashboard.html'
    }).when('/new', {
        templateUrl: 'templates/new-chart.html'
    }).when('/chart/:id', {
        templateUrl: 'templates/new-chart.html'
    }).when('/trackerEndPoint', {
        templateUrl: 'templates/view.html'
    }).otherwise({
        redirectTo: '/'
    });
}]);
var controllers = angular.module('longitudinalChartControllers', []);

controllers.controller('DashboardController', DashboardController);
controllers.controller('ChartController', ChartController);
controllers.controller('ViewerController', ViewerController);

/*Drop Zone*/
angular.module('dropzone', []).directive('dropzone', function () {
    return function (scope, element, attrs) {
        var config, dropzone;

        config = scope[attrs.dropzone];

        // create a Dropzone for the element with the given options
        dropzone = new Dropzone(element[0], config.options);

        // bind the given event handlers
        angular.forEach(config.eventHandlers, function (handler, event) {
            dropzone.on(event, handler);
        });
    };
});

/**
 * Chart Service
 **/
app.factory('chartService', function ($http, $q) {
    var chartService = {
        saveChart: function (chart) {
            var defer = $q.defer();
            $http.post('../../dataStore/lc/' + chart.id, angular.toJson(chart)).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        deleteChart: function (chart) {
            var defer = $q.defer();
            $http.delete('../../dataStore/lc/' + chart.id).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        generateId: function () {
            var defer = $q.defer();
            $http.get('../../system/id?limit=1').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getAllIds: function () {
            var defer = $q.defer();
            $http.get('../../dataStore/lc/').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getChart: function (chartId) {
            var defer = $q.defer();
            $http.get('../../dataStore/lc/' + chartId).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getAllCharts:function () {
            var defer = $q.defer();
            this.getAllIds().then(function (ids) {
                var charts=[];
                var chartCount=ids.length;
                var resolvedCharts=0;
                ids.forEach(function (id) {//sending simultaneous requests
                    chartService.getChart(id).then(function (chart) {
                        charts.push(chart);
                        resolvedCharts++;
                        if(resolvedCharts==chartCount){
                            defer.resolve(charts);
                        }
                    })
                })
            });
            return defer.promise;
        }
    }
    return chartService;
});

app.factory('validationService', function () {
    return {
        validateString: function (str) {
            if (str == undefined || str.toString().trim() == "") {
                return false;
            }
            return true;
        }
    }
});

/**
 * User Service
 **/
app.factory('userService', function ($http, $q) {
    return {
        getCurrentUserId: function () {
            var defer = $q.defer();
            $http.get('../../me.json?fields=id').then(function (response) {
                defer.resolve(response.data.id);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        }
    }
});

/**
 * Toast Service
 **/
app.factory('toastService', function ($mdToast,$mdDialog) {
    return {
        showToast: function (msg) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(msg)
                    .position('bottom left')
                    .hideDelay(3000)
            );
        },
        showConfirm: function (title, description, ok, cancel, callbackSuccess, callbackCancel) {
            var confirm = $mdDialog.confirm()
                .title(title)
                .textContent(description)
                .ok(ok)
                .cancel(cancel);
            $mdDialog.show(confirm).then(function () {
                callbackSuccess();
            }, function () {
                callbackCancel();
            });
        }
    }
});

/**
 * Program Service handles all the request related to DHIS Programs
 **/
app.factory('programService', function ($http, $q) {
    return {
        getPrograms: function () {
            var defer = $q.defer();
            $http.get("../../programs.json?paging=false").then(function (response) {
                defer.resolve(response.data.programs);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramNameById: function (programId) {
            var defer = $q.defer();
            $http.get("../../programs/" + programId + ".json?fields=name").then(function (response) {
                defer.resolve(response.data.name);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramIndicators: function (programId) {
            var defer = $q.defer();
            var url = "../../programs/" + programId + ".json?fields=programIndicators[name,id]";
            $http.get(url).then(function (response) {
                defer.resolve(response.data.programIndicators);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramDataElements: function (programId) {
            var defer = $q.defer();
            var url = "../../programs/" + programId + ".json?fields=programStages[programStageDataElements[dataElement[name,id]]]";
            $http.get(url).then(function (response) {
                var programStages = response.data.programStages;
                var dataElements = [];
                var dataElementIds = [];
                programStages.forEach(function (programStage) {//to avoid duplicates
                    var programStageDataElements = programStage.programStageDataElements;
                    programStageDataElements.forEach(function (programStageDataElement) {
                        var dataElement = programStageDataElement.dataElement;
                        if (dataElementIds.indexOf(dataElement.id) === -1) {
                            dataElements.push(dataElement);
                            dataElementIds.push(dataElement.id);
                        }
                    })
                });
                defer.resolve(dataElements);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        }
    }
});
