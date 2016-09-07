/**
 * @author Chathura Widanage
 */
function TrendController($location, appService, teiService, $routeParams, toastService,
                         programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var tctrl = this;

    tctrl.trendDataElementId = undefined;
    tctrl.date = new Date();
    tctrl.dataElementName = "";

    tctrl.mainChart = {
        loading: false,
        visible: false,
        data: [],
        labels: [],
        colors: [],
        options: {
            legend: {
                display: false,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Chart Title'
            }
        },
        reset: function () {
            this.visible = false;
            this.data = [];
            this.labels = [];
            this.loading = false;
        }
    }

    tctrl.readyness = {
        dataElement: false,
        ou: false,
        isReady: function () {
            return this.ou && this.dataElement;
        }
    }

    $scope.$watch('ctrl.trendDataElement', function (trendDataElement) {
        tctrl.trendDataElementId = trendDataElement;
        if (trendDataElement) {
            tctrl.readyness.dataElement = trendDataElement;
            tctrl.loadData();
        }
    });

    $scope.$watch('ctrl.currentOuSelection', function (ouSelection) {
        if (ouSelection) {
            tctrl.readyness.ou = true;
            tctrl.loadData();
        }
    });

    $scope.$watch('ctrl.date', function (date) {
        tctrl.date = date;
        if (tctrl.date) {
            tctrl.loadData();
        }
    });

    tctrl.hideChart = function () {
        tctrl.mainChart.visible = false;
    }


    tctrl.loadData = function () {

        if (!tctrl.readyness.isReady()) {
            return;
        }

        tctrl.mainChart.reset();
        console.log("loading trends");
        tctrl.mainChart.loading = true;

        var month = 1000 * 60 * 60 * 24 * 30;
        var dates = [];
        for (var i = 0; i < 6; i++) {//6 months back
            dates.push(new Date(tctrl.date.getTime() - (month) * (6 - i)));
        }
        dates.push(tctrl.date);


        for (var i = 0; i < dates.length; i++) {
            var d = dates[i];
            tctrl.mainChart.labels.push(d.toDateString());
            eventService.getAnalyticsForDeCustom(new Date(0).toDateString(), d.toDateString(), $scope.ctrl.currentOuSelection.id, tctrl.trendDataElementId, i).then(function (data) {
                if (data.data && data.data.rows.length > 0) {
                    var tableRow = data.data.rows[0];
                    if (tableRow.length > 0) {
                        tctrl.mainChart.data[data.index] = (tableRow[0]);
                        dataElementService.getDataElementNameById(tctrl.trendDataElementId).then(function (name) {
                            tctrl.mainChart.options.title.text = "Trend analysis of " + name;
                        })
                        console.log("Chart", tctrl.mainChart);
                        tctrl.mainChart.visible = true;
                        tctrl.mainChart.loading = false;
                    }
                }
            });
        }


    }


}