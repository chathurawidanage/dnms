//var serverRoot = 'http://lankanets.info:8080/nss/api/';
//var serverRoot = 'http://dhis.pgim.cmb.ac.lk/nss/api/';
//var serverRoot = 'http://148.251.224.242/nss1/api/';
var serverRoot = '../../';
var app = angular.module('long-charts', ['ngMaterial', 'ngRoute', 'longitudinalChartControllers', 'dropzone', 'chart.js'
    , 'mdColorPicker', 'lfNgMdFileInput', 'angular-timeline', 'forerunnerdb', 'angularTreeview', 'ngMap']);
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'templates/dashboard.html'
    }).when('/profile', {
        templateUrl: 'templates/profile.html'
    }).when('/chart/:id', {
        templateUrl: 'templates/new-chart.html'
    }).when('/trackerEndPoint', {
        templateUrl: 'templates/view.html'
    }).otherwise({
        redirectTo: '/'
    });
}]).run(function ($rootScope, $fdb, $http) {
    $rootScope.$db = $fdb.db('dnms');
    debugDb = $rootScope.$db;
});
//temp config
app.config(['$httpProvider', function ($httpProvider) {
    console.log($httpProvider);
}]);

app.run(function (userService) {
    userService.getCurrentUser();
})


var controllers = angular.module('longitudinalChartControllers', []);

controllers.controller('DashboardController', DashboardController);
controllers.controller('TeiListController', TeiListController);
controllers.controller('RiskController', RiskController);
controllers.controller('NutritionController', NutritionController);
controllers.controller('TrendController', TrendController);
controllers.controller('ChartController', ChartController);
controllers.controller('ProfileController', ProfileController);
controllers.controller('ViewerController', ViewerController);
controllers.controller('OptionsController', OptionsController);
controllers.controller('RefDataController', RefDataController);

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

app.factory('enrollmentService', EnrollmentService);

app.factory('eventService', EventService);

app.factory('orgUnitsService', function ($http, $q) {
    return {
        getOrgTree: function () {
            var defer = $q.defer();
            $http.get(serverRoot + 'organisationUnits.json?fields=level,id,displayName,children[level,id,displayName,children[level,id,displayName,children[level,id,displayName,children[level,id,displayName]]]]&paging=false&filter=level:eq:1').then(function (response) {
                defer.resolve(response.data.organisationUnits);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        }
    }
});

app.factory('appService', function ($http, $q) {
    return {
        getOptions: function () {//determines if this is the first run of the app -> need to show settings
            var defer = $q.defer();
            $http.get(serverRoot + 'dataStore/lc-app/options').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        setOptions: function (options) {//determines if this is the first run of the app -> need to show settings
            var defer = $q.defer();
            $http.post(serverRoot + 'dataStore/lc-app/options', angular.toJson(options)).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        updateOptions: function (options) {
            var defer = $q.defer();
            $http.put(serverRoot + 'dataStore/lc-app/options', angular.toJson(options)).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        }
    }
});

app.factory('teiService', function ($http, $q, appService) {
    var teiService = {
        //TEI LIST
        teiListTitle: "",//title of the currently browsing Tei list
        teiListObservers: [],
        teiSearchFunction: null,
        /**
         *
         * @param list
         * @param title
         * @param searchFunction a callback function which accepts (regexp,page,limit)
         */
        changeTeiList: function (title, searchFunction, global) {
            teiService.teiListTitle = title;
            teiService.teiSearchFunction = searchFunction;
            teiService.teiListObservers.forEach(function (callback) {
                callback(global);
            })
        },

        addObserver: function (observerCallbackFunction) {
            teiService.teiListObservers.push(observerCallbackFunction);
        },
        //END OF TEI LIST
        /**
         * Get all the teiAttributes that will be recorded per tei
         * @returns {*|m.promise|{then, catch, finally}|d}
         */
        getAllTeiAttributes: function () {
            var defer = $q.defer();
            $http.get(serverRoot + 'trackedEntityAttributes?fields=id,displayName,valueType,optionSet[options[:all]]').then(function (response) {
                defer.resolve(response.data.trackedEntityAttributes);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        getTeiById: function (teiId) {
            var defer = $q.defer();
            $http.get(serverRoot + 'trackedEntityInstances/' + teiId + '.json?paging=false').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        deleteTei: function (teiId) {
            var defer = $q.defer();
            $http.delete(serverRoot + 'trackedEntityInstances/' + teiId).then(function (response) {
                defer.resolve(response);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        updateTei: function (tei) {
            console.log(tei);
            var defer = $q.defer();
            $http.put(serverRoot + 'trackedEntityInstances/' + tei.trackedEntityInstance, angular.toJson(tei)).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        /**
         * Get teiAttribute values for a tei
         * @param teiId
         * @returns {*|m.promise|{then, catch, finally}|d}
         */
        getAllAttributesForTei: function (teiId) {
            var defer = $q.defer();
            $http.get(serverRoot + 'trackedEntityInstances/' + teiId + '.json?fields=attributes&paging=false').then(function (response) {
                defer.resolve(response.data.attributes);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        queryForAllTeis: function (attributes, program) {
            var defer = $q.defer();
            var url = serverRoot + 'trackedEntityInstances/query.json?ouMode=ACCESSIBLE&programStatus=ACTIVE&program=' + program;
            if (attributes) {
                attributes.forEach(function (attr) {
                    url += "&attribute=" + attr;
                })
            }
            $http.get(url).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        /**
         * Get attributes that can possibly be a Date of birth. After this filtering, user get a filtered list, so he can
         * chose the correct one
         * @returns {d|*}
         */
        getDobPossibleTeiAttributes: function () {
            var defer = $q.defer();
            $http.get(serverRoot + 'trackedEntityAttributes.json?skipPaging=true&filter=valueType:eq:DATE').then(function (response) {
                defer.resolve(response.data.trackedEntityAttributes);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getGenderPossibleTeiAttributes: function () {
            var defer = $q.defer();
            $http.get(serverRoot + 'trackedEntityAttributes.json?skipPaging=true&filter=valueType:in:[TEXT,BOOLEAN]').then(function (response) {
                defer.resolve(response.data.trackedEntityAttributes);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getBirthDay: function (teiId) {
            var defer = $q.defer();
            appService.getOptions().then(function (options) {
                var dobAttributeId = options.teiAttributes.dob;
                $http.get(serverRoot + 'trackedEntityInstances/' + teiId + '.json?fields=attributes').then(function (response) {
                    var dob = null;
                    response.data.attributes.forEach(function (attributeObj) {
                        if (attributeObj.attribute == dobAttributeId) {
                            dob = attributeObj.value;
                        }
                    });
                    if (dob) {
                        defer.resolve(new Date(dob));
                    } else {
                        //defer.resolve(new Date("2016-07-14"));
                        defer.reject("Date of birth for this tracked entity instance is not specified.");
                    }
                }, function (response) {
                    defer.reject("Error occurred while reading date of birth of the tei.");
                });
            });
            return defer.promise;
        },
        getEventData: function (trackedEntityInstance, program) {
            var defer = $q.defer();
            $http.get(serverRoot + 'events.json?ouMode=ACCESSIBLE&skipPaging=true&trackedEntityInstance='
                + trackedEntityInstance + "&program=" + program).then(function (response) {
                var events = response.data.events;
                defer.resolve(events);
            });
            return defer.promise;
        },
        getDateDiffInDays: function (date1, date2) {
            return Math.floor((date1 - date2) / (1000 * 60 * 60 * 24 ));
        },
        /**
         * @param chart chart object
         * @param trackedEntityInstance id of the tei
         * @return the data to be drawn in the chart as point objects {x:1.0,y:5}
         */
        getChartData: function (chart, trackedEntityInstance) {
            var defer = $q.defer();
            console.log("here");
            this.getBirthDay(trackedEntityInstance).then(function (dob) {
                var dateOfBirth = new Date(dob);
                var intervalDays = intervalInDays[chart.xAxisPeriod];
                var chartType = parseInt(chart.dependantDataType);//0 : one dataElement vs time, 1: dataElement vs dataElement, 3: programIndicator vs time
                var yAxisVariable1 = chart.yAxisVariable1;
                var yAxisVariable2 = chart.yAxisVariable2;
                console.log("Pre req", dateOfBirth, intervalDays);
                $http.get(serverRoot + 'events.json?ouMode=ACCESSIBLE&skipPaging=true&trackedEntityInstance='
                    + trackedEntityInstance + "&program=" + chart.program).then(function (response) {
                    var events = response.data.events;
                    var dataToPlot = [];
                    var maxTimeSpanInDays = 0;//the largest distance between the DOB and the data points available. The graph will be chosen depending on this
                    var dataValues1 = [];
                    var dataValues2 = [];
                    events.forEach(function (event) {
                        event.dataValues.forEach(function (dataValue) {
                            var updatedDate = new Date(dataValue.lastUpdated);
                            var timeFromBirth = teiService.getDateDiffInDays(updatedDate, dob);
                            if (maxTimeSpanInDays < timeFromBirth) {
                                maxTimeSpanInDays = timeFromBirth;
                            }
                            if (dataValue.dataElement == yAxisVariable1) {
                                dataValues1.push(dataValue);
                                /* console.log(dataValue);
                                 var timePlot = Math.floor((updatedDate - dateOfBirth) / (1000 * 60 * 60 * 24 * intervalDays));
                                 var plotObject = {
                                 x: timePlot,
                                 y: dataValue.value
                                 }
                                 dataToPlot.push(plotObject);
                                 console.log(plotObject, updatedDate);*/
                            } else if (chartType == 1 && dataValue.dataElement == yAxisVariable2) {
                                dataValues2.push(dataValue);
                            }
                        })
                    });
                    //iterate over refData of chart to select most suitable chart
                    var refDataCoverage = [];//store temp refData objects with coverage values
                    chart.refData.forEach(function (refData, index) {
                        var xAxisPeriod = parseInt(refData.xAxisPeriod);
                        var daysPerThisPeriod = intervalInDays[xAxisPeriod];//how many days in this period, ie: 7 days for a week
                        var totalDaysCoveredByChart = daysPerThisPeriod * (refData.centiles.length);
                        if (totalDaysCoveredByChart >= maxTimeSpanInDays) {//we don't care about charts that can't cover the data
                            refDataCoverage.push({
                                index: index,
                                coverage: totalDaysCoveredByChart
                            })
                        }
                    });
                    //sort by coverage, we have to select the graph with lowest coverage that can cover all the TEI data
                    refDataCoverage.sort(function (a, b) {
                        a.coverage - b.coverage;
                    });
                    var selectedRefData = chart.refData[refDataCoverage[0].index];


                    defer.resolve(dataToPlot);
                }, function (response) {
                    defer.reject(response);
                });
            }, function (msg) {//no dob set
                defer.reject(msg);
            })
            return defer.promise;
        }
    }
    return teiService;
})

/**
 * Chart Service
 **/
app.factory('chartService', function ($http, $q) {
    var chartService = {
        saveChart: function (chart) {
            var defer = $q.defer();
            $http.post(serverRoot + 'dataStore/lc/' + chart.id, angular.toJson(chart)).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        deleteChart: function (chart) {
            var defer = $q.defer();
            $http.delete(serverRoot + 'dataStore/lc/' + chart.id).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        generateId: function () {
            var defer = $q.defer();
            $http.get(serverRoot + 'system/id?limit=1').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getAllIds: function () {
            var defer = $q.defer();
            $http.get(serverRoot + 'dataStore/lc/').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getChart: function (chartId) {
            var defer = $q.defer();
            $http.get(serverRoot + 'dataStore/lc/' + chartId).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getAllCharts: function () {
            var defer = $q.defer();
            this.getAllIds().then(function (ids) {
                var charts = [];
                var chartCount = ids.length;
                var resolvedCharts = 0;
                ids.forEach(function (id) {//sending simultaneous requests
                    chartService.getChart(id).then(function (chart) {
                        charts.push(chart);
                        resolvedCharts++;
                        if (resolvedCharts == chartCount) {
                            defer.resolve(charts);
                        }
                    })
                })
            });
            return defer.promise;
        },
        /**
         *
         * @param refData ReferenceData object
         */
        generateChartDataFromRefData: function (refData) {
            var selectedData = [];
            var selectedSeries = [];
            var selectedDataColors = [];

            var maxDataLength = 0;
            refData.centiles.forEach(function (centile) {
                if (centile.selected) {
                    selectedData.push(centile.data);
                    //console.log(centile.data);
                    maxDataLength = maxDataLength < centile.data.length ? centile.data.length : maxDataLength;
                    selectedSeries.push(centile.name);
                    selectedDataColors.push(centile.color);
                }
            });
            return {
                series: selectedSeries,
                data: selectedData,
                dataColors: selectedDataColors
            }
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
app.factory('userService', UserService);

/**
 * Toast Service
 **/
app.factory('toastService', function ($mdToast, $mdDialog) {
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
 * DHIS Program Indicators
 */
app.factory('programIndicatorsService', function ($http, $q) {
    return {
        getProgramIndicatorNameById: function (programIndicatorId) {
            var defer = $q.defer();
            $http.get(serverRoot + "programIndicators/" + programIndicatorId + ".json?fields=name").then(function (response) {
                defer.resolve(response.data.name);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        }
    }
})

/**
 * DHIS DataElements
 */
app.factory('dataElementService', function ($http, $q) {
    return {
        getDataElementNameById: function (dataElementId) {
            var defer = $q.defer();
            $http.get(serverRoot + "dataElements/" + dataElementId + ".json?fields=name").then(function (response) {
                defer.resolve(response.data.name);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        }
    }
})

/**
 * Program Service handles all the request related to DHIS Programs
 **/
app.factory('programService', function ($http, $q) {
    return {
        getPrograms: function () {
            var defer = $q.defer();
            $http.get(serverRoot + "programs.json?paging=false").then(function (response) {
                defer.resolve(response.data.programs);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramById: function (programId) {
            var defer = $q.defer();
            $http.get(serverRoot + "programs/" + programId + ".json?fields=:all,programStages[id,displayName,programStageDataElements[id,dataElement[id,displayName,valueType,optionSet[options[:all]]]]]").then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramNameById: function (programId) {
            var defer = $q.defer();
            $http.get(serverRoot + "programs/" + programId + ".json?fields=name").then(function (response) {
                defer.resolve(response.data.name);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramIndicators: function (programId) {
            var defer = $q.defer();
            var url = serverRoot + "programs/" + programId + ".json?fields=programIndicators[name,id]";
            $http.get(url).then(function (response) {
                defer.resolve(response.data.programIndicators);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },
        getProgramDataElements: function (programId) {
            var defer = $q.defer();
            var url = serverRoot + "programs/" + programId + ".json?fields=programStages[programStageDataElements[dataElement[name,id]]]";
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

