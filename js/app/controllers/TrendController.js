/**
 * @author Chathura Widanage
 */
function TrendController($location, appService, teiService, $routeParams, toastService,
                             programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var nctrl = this;
    nctrl.heightChart = {
        loading: false,
        visible: true,
        data: [],
        dataElementId: "bYTh3TBpAFF",
        sqlViews: [{id: "Eq5TZZjmiVQ", name: "Less than -3SD"},
            {id: "iHDzKAWHtK1", name: "Between -2SD and -3SD"},
            {id: "nTGbJDnaqiU", name: "Greater than +2SD"}],
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
        sqlViews: [{id: "Eq5TZZjmiVQ", name: "Less than -3SD"},
            {id: "iHDzKAWHtK1", name: "Between -2SD and -3SD"},
            {id: "nTGbJDnaqiU", name: "Greater than +2SD"}],
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
        sqlViews: [{id: "Eq5TZZjmiVQ", name: "Less than -3SD"},
            {id: "iHDzKAWHtK1", name: "Between -2SD and -3SD"},
            {id: "nTGbJDnaqiU", name: "Greater than +2SD"}],
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

    nctrl.charts=[nctrl.heightChart,nctrl.weightChart,nctrl.weightForHeightChart];

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
            chart.sqlViews.forEach(function (sqlView) {
                eventService.getHeightWeightAnalytics(sqlView.id, "2015-06-05", "2016-09-07", $scope.ctrl.currentOuSelection.id, chart.dataElementId).then(function (data) {
                    var rows = data.rows;
                    if (rows.length > 0) {
                        var row = rows[0];
                        if (row.length > 0) {
                            var dataValue=row[0];
                            chart.data.push(dataValue);
                            chart.labels.push(sqlView.name+" ["+dataValue+"]");
                        }
                    }
                });
            })
        })

    }


}