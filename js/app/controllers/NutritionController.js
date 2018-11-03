/**
 * @author Chathura Widanage
 */
function NutritionController($location, appService, teiService, $routeParams, toastService,
                             programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var nctrl = this;
    var dateService = new DateService();
    var sqlViews = [{id: "vMzcq7lEtWv", name: "Less than -3SD",value:"Less than -3SD"},
        {id: "UWkVK5iP7c6", name: "Between -2SD and -3SD",value:"Between -2SD to -3SD"},
        {id: "sXrfZU9sHix", name: "Greater than +2SD",value:"More than +2 SD"}];
    /*    var sqlViews=[{id: "Eq5TZZjmiVQ", name: "Less than -3SD"},
     {id: "iHDzKAWHtK1", name: "Between -2SD and -3SD"},
     {id: "nTGbJDnaqiU", name: "Greater than +2SD"}];*/
    nctrl.heightChart = {
        loading: false,
        visible: true,
        data: [],
        dataElementId: "bYTh3TBpAFF",
        sqlViews: sqlViews,
        labels: [],
        colors: [],
        options: {
            legend: {
                display: false,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Height for Age Category'
            }
        },
        reset: function () {
            this.visible = true;
            this.data = [];
            this.labels = [];
            this.loading = false;
        }
    }
    nctrl.weightChart = {
        loading: false,
        visible: true,
        data: [],
        dataElementId: "qh8ptEnFWmp",
        sqlViews: sqlViews,
        labels: [],
        colors: [],
        options: {
            legend: {
                display: false,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Weight for Age Category'
            }
        },
        reset: function () {
            this.visible = true;
            this.data = [];
            this.labels = [];
            this.loading = false;
        }
    }
    nctrl.weightForHeightChart = {
        loading: false,
        visible: true,
        data: [],
        dataElementId: "RGmYXRckjv0",
        sqlViews: sqlViews,
        labels: [],
        colors: [],
        options: {
            legend: {
                display: false,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Weight for Height Category'
            }
        },
        reset: function () {
            this.visible = true;
            this.data = [];
            this.labels = [];
            this.loading = false;
        }
    }

    nctrl.date = new Date();

    nctrl.charts = [nctrl.heightChart, nctrl.weightChart, nctrl.weightForHeightChart];

    nctrl.readyness = {
        program: false,
        ou: false,
        isReady: function () {
            return this.program && this.ou;
        }
    }

    $scope.$watch('ctrl.selectedProgram', function (selectedProgram) {
        if (selectedProgram) {
            nctrl.readyness.program = true;
            nctrl.loadData();
        }
    });

    $scope.$watch('ctrl.date', function (date) {
        nctrl.date = date;
        nctrl.loadData();
    });

    $scope.$watch('ctrl.currentOuSelection', function (ouSelection) {
        if (ouSelection) {
            nctrl.readyness.ou = true;
            nctrl.loadData();
        }
    });

    nctrl.loadData = function () {
        if (!nctrl.readyness.isReady()) {
            return;
        }

        nctrl.charts.forEach(function (chart) {
            chart.reset();
            var i = 0;
            chart.sqlViews.forEach(function (sqlView) {
                //eventService.getHeightWeightAnalytics(sqlView.id, new Date(0).toDateString(), nctrl.date.toDateString(), $scope.ctrl.currentOuSelection.id, chart.dataElementId, i++).then(function (data) {
                eventService.getAnalyticsForDeCustom(STAGE_NUT_MONITOR,dateService.toDateString(new Date(0)), dateService.toDateString(nctrl.date), $scope.ctrl.currentOuSelection.id, chart.dataElementId,sqlView.value, i++).then(function (data) {

                    console.log("DATA", data);
                    if (data.data) {
                        var rows = data.data.rows;
                        if (rows.length > 0) {
                            var row = rows[0];
                            if (row.length > 0) {
                                var dataValue = row[0];
                                chart.data[data.index] = (dataValue);
                                chart.labels[data.index] = (sqlView.name + " [" + dataValue + "]");
                            }
                        }
                    }
                });
            })
        })

    }

    nctrl.chartClick = function (points, evt) {
        var index = points[0]._index;
        console.log("Event", evt);
        var target = evt.srcElement || evt.target;
        var chartIndex = parseInt(target.attributes["data-chartIndex"].nodeValue);
        $scope.$evalAsync(function () {
            $scope.ctrl.trendDataElement = {
                de: nctrl.charts[chartIndex].dataElementId,
                sqlView: sqlViews[index]
            };
        });
    }


}