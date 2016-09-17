/**
 * @author Chathura Widanage
 */
function TrendController($location, appService, teiService, $routeParams, toastService,
                         programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var tctrl = this;

    tctrl.trendDataElement = undefined;
    tctrl.date = new Date();
    tctrl.dataElementName = "";

    tctrl.widgetVisible = false;

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
            this.data = [];
            this.labels = [];
            this.loading = true;
            this.options.title.text = "Loading..";
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
        console.log("Trend de triggered", trendDataElement);
        tctrl.trendDataElement = trendDataElement;
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
        tctrl.widgetVisible = false;
    }


    tctrl.loadData = function () {

        tctrl.mainChart.reset();
        if (!tctrl.readyness.isReady()) {
            return;
        }
        tctrl.widgetVisible = true;

        console.log("loading trends");
        tctrl.mainChart.loading = true;

        var month = 1000 * 60 * 60 * 24 * 30;
        var dates = [];
        for (var i = 0; i < 6; i++) {//6 months back
            dates.push(new Date(tctrl.date.getTime() - (month) * (6 - i)));
        }
        dates.push(tctrl.date);

        var requestCount = 0;
        var responseCount = 0;
        for (var i = 0; i < dates.length; i++) {
            requestCount++;
            var d = dates[i];
            tctrl.mainChart.labels.push(d.toDateString());
            //todo use a better approach
            if (tctrl.trendDataElement.de) {//height weight analysis
                var deId = tctrl.trendDataElement.de;
                var sqlView = tctrl.trendDataElement.sqlView;
                eventService.getHeightWeightAnalytics(sqlView.id, new Date(0).toDateString(), d.toDateString(), $scope.ctrl.currentOuSelection.id, deId, i).then(function (data) {
                    //console.log(data);
                    if (data.data && data.data.rows.length > 0) {
                        var tableRow = data.data.rows[0];
                        if (tableRow.length > 0) {
                            tctrl.mainChart.data[data.index] = (tableRow[0]);

                            console.log("Chart", tctrl.mainChart);
                            responseCount++;
                            if (requestCount == responseCount) {
                                dataElementService.getDataElementNameById(deId).then(function (name) {
                                    tctrl.mainChart.options.title.text = "Trend analysis of " + name + " - " + sqlView.name;
                                    tctrl.mainChart.loading = false;
                                })
                            }
                        }
                    }
                })
            } else {
                eventService.getAnalyticsForDeCustom(new Date(0).toDateString(), d.toDateString(), $scope.ctrl.currentOuSelection.id, tctrl.trendDataElement, i).then(function (data) {
                    if (data.data && data.data.rows.length > 0) {
                        var tableRow = data.data.rows[0];
                        if (tableRow.length > 0) {
                            tctrl.mainChart.data[data.index] = (tableRow[0]);

                            responseCount++;
                            if (requestCount == responseCount) {
                                dataElementService.getDataElementNameById(tctrl.trendDataElement).then(function (name) {
                                    tctrl.mainChart.options.title.text = "Trend analysis of " + name;
                                    tctrl.mainChart.loading = false;
                                })
                            }
                        }
                    }
                });
            }
        }


    }


}