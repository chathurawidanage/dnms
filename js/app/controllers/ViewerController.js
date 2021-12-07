/**
 * Created by chathura on 6/1/16.
 */
function ViewerController($location, appService, teiService, $routeParams, toastService, chartService,
                          programService, dataElementService, programIndicatorsService, $q, $mdDialog, $timeout,$window) {
    var ctrl = this;
    this.tei = $routeParams.tei;
    this.program = PROGRAM_ANTHROPOMETRY;
    this.programName;
    this.teiEventData;
    this.teiDob = new Date("2016-01-01");

    programService.getProgramNameById(ctrl.program).then(function (name) {
        ctrl.programName = name;
        return name;
    });

    this.charts = [];

    this.downloadChart = function (index) {
        $timeout(function () {
            var canvas = document.getElementById("lon-chart-" + index);
            var image = canvas.toDataURL("image/png");//.replace("image/png", "image/octet-stream");
            console.log(image);
            $window.open(image, '_blank');
        })
    }

    this.loadData = function () {
        //load charts
        chartService.getAllCharts().then(function (charts) {
            ctrl.charts = [];
            charts.forEach(function (chart) {
                if (chart.program == ctrl.program) {
                    //make chart loading
                    chart.processing = true;

                    ctrl.charts.push(chart);
                }
            });//todo load dob
            console.log("loading dob");
            teiService.getBirthDay(ctrl.tei).then(function (dob) {
                ctrl.teiDob = dob;
                console.log("don", ctrl.teiDob);
                //loading TEI data
                teiService.getEventData(ctrl.tei, ctrl.program).then(function (events) {
                    ctrl.teiEventData = events;

                    //sort events by event date
                    ctrl.teiEventData.sort(function (a, b) {
                        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                    })
                    //drawing in progress
                    ctrl.refineCharts();//draw the charts first, let's leisurely refine them
                })
            });


        })
    };

    ctrl.getDateDiffInDays = function (date1, date2) {
        return Math.floor(Math.abs(date1 - date2) / (1000 * 60 * 60 * 24 ));
    }

    this.refineCharts = function () {
        this.charts.forEach(function (chart) {
            chart.options.legend = {
                display: true
            }
            chart.options.tooltips = {
                enabled: false
            };

            //chart.options.pointBackgroundColor="white";

            //axis labeling
            var chartDependantDataType = parseInt(chart.dependantDataType);

            //Y axis labeling
            chart.options.scales.yAxes = [
                {
                    scaleLabel: {
                        display: true,
                        labelString: ""
                    }
                }
            ];
            if (chartDependantDataType == 2) {//y is a program indicator
                var yProgramIndicatorId = chart.yAxisVariable1;
                programIndicatorsService.getProgramIndicatorNameById(yProgramIndicatorId).then(function (dataElementName) {
                    chart.options.scales.yAxes[0].scaleLabel.labelString = dataElementName;
                });
            } else {//y is a data element
                var yDataElementId = chart.yAxisVariable1;
                dataElementService.getDataElementNameById(yDataElementId).then(function (dataElementName) {
                    chart.options.scales.yAxes[0].scaleLabel.labelString = dataElementName;
                });
            }

            //X axis labeling
            chart.options.scales.xAxes[0].scaleLabel = {
                display: true,
                labelString: ""
            };


            //setting x label
            if (chartDependantDataType == 0 || chartDependantDataType == 2) {//x axis is time
                var xAxisPeriod = parseInt(chart.xAxisPeriod);
                chart.options.scales.xAxes[0].scaleLabel.labelString = "Age (" + intervalNoun[xAxisPeriod] + ")";
            } else {
                var xDataElementId = chart.yAxisVariable2;
                dataElementService.getDataElementNameById(xDataElementId).then(function (dataElementName) {
                    chart.options.scales.xAxes[0].scaleLabel.labelString = dataElementName;
                });
            }
            /**END LABELLING**/


            //plotting reference data
            var yAxisVariable1 = chart.yAxisVariable1;
            var yAxisVariable2 = chart.yAxisVariable2;

            var maxTimeSpanInDays = 0;//the largest distance between the DOB and the data points available. The graph will be chosen depending on this
            var dataValues1 = [];
            var dataValues2 = [];
            var dataValue2MaxMin = {
                max: Number.MIN_VALUE,
                min: Number.MAX_VALUE
            }
            ctrl.teiEventData.forEach(function (event) {
                if (chartDependantDataType == 0 || chartDependantDataType == 2) {//time span is important only in these two types
                    //var updatedDate = new Date(dataValue.lastUpdated);
                    var updatedDate = new Date(event.eventDate);
                    var timeFromBirth = ctrl.getDateDiffInDays(updatedDate, ctrl.teiDob);
                    console.log("time from birth", timeFromBirth);
                    if (maxTimeSpanInDays < timeFromBirth) {
                        maxTimeSpanInDays = timeFromBirth;
                    }
                }
                event.dataValues.forEach(function (dataValue) {
                    dataValue.event = event;
                    //
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
                    } else if (chartDependantDataType == 1 && dataValue.dataElement == yAxisVariable2) {
                        if (dataValue2MaxMin.max < dataValue.value) {
                            dataValue2MaxMin.max = dataValue.value;
                        }

                        if (dataValue2MaxMin.min > dataValue.value) {
                            dataValue2MaxMin.min = dataValue.value;
                        }
                        dataValues2.push(dataValue);
                    }
                })
            });


            var defer = $q.defer();//lot's of async tasks inside
            if (chartDependantDataType == 0 || chartDependantDataType == 2) {//x axis is time
                teiService.getBirthDay(ctrl.tei).then(function (dob) {
                    var notOverflowingRefDataObjects = [];//store temp refData objects with coverage values
                    var overflowingRefDataObjects = [];
                    console.log("ref data", chart.refData);
                    chart.refData.forEach(function (refData, index) {
                        var xAxisPeriod = parseInt(refData.xAxisPeriod);
                        var daysPerThisPeriod = intervalInDays[xAxisPeriod];//how many days in this period, ie: 7 days for a week
                        console.log("days per period", daysPerThisPeriod);

                        /**Calculating points in a single centile**/
                        var middlePoint = Math.floor(refData.centiles.length / 2);//considering middle centile to minimize edge errors (some times centiles[0] is errornous)
                        var dataInCentile = refData.centiles[middlePoint].data.length;
                        var totalDaysCoveredByChart = daysPerThisPeriod * (dataInCentile);
                        var refDataCovergaeObj = {
                            index: index,
                            coverage: totalDaysCoveredByChart
                        }
                        console.log("coverage", totalDaysCoveredByChart, maxTimeSpanInDays);
                        if (totalDaysCoveredByChart >= maxTimeSpanInDays) {//we don't care about charts that can't cover the data
                            notOverflowingRefDataObjects.push(refDataCovergaeObj);
                        } else {
                            overflowingRefDataObjects.push(refDataCovergaeObj);
                        }
                    });
                    console.log("not overflow", notOverflowingRefDataObjects);
                    //sort by coverage, we have to select the graph with lowest coverage that can cover all the TEI data
                    notOverflowingRefDataObjects.sort(function (a, b) {
                        a.coverage - b.coverage;
                    });
                    console.log("not overflow sorted", notOverflowingRefDataObjects);

                    var selectedRefData;
                    if (notOverflowingRefDataObjects.length > 0) {
                        selectedRefData = chart.refData[notOverflowingRefDataObjects[0].index];
                    } else {
                        //backup plane, sort overflowing ref data in descending order and select first

                        console.log("overflow", overflowingRefDataObjects);
                        overflowingRefDataObjects.sort(function (a, b) {
                            b.coverage - a.coverage;//desc
                        })
                        console.log("overflow sort", overflowingRefDataObjects);
                        selectedRefData = chart.refData[overflowingRefDataObjects[0].index];
                    }
                    //
                    var chartData = chartService.generateChartDataFromRefData(selectedRefData);
                    chart.series = chartData.series;
                    chart.data = chartData.data;
                    chart.dataColors = chartData.dataColors;

                    //data to plot
                    var intervalDays = intervalInDays[selectedRefData.xAxisPeriod];
                    var dataToPlot = [];
                    dataValues1.forEach(function (dataValue) {
                        //var updatedDate = new Date(dataValue.lastUpdated);
                        var updatedDate = new Date(dataValue.event.eventDate);
                        console.log(updatedDate, dob, intervalDays);
                        var timePlot = Math.floor((updatedDate - dob) / (1000 * 60 * 60 * 24 * intervalDays));
                        var plotObject = {
                            x: timePlot,
                            y: dataValue.value
                        }
                        dataToPlot.push(plotObject);
                    });
                    defer.resolve(dataToPlot);
                }, function (error) {//todo handle error, can't draw this chart type without dob
                    defer.reject(error)
                })
            } else {
                var notOverFlowingRefData = [];
                var overFlowingRefData = [];
                /**
                 * in this case, priority is given to the latest data. RefData is chosen such that it will cover latest data
                 */
                chart.refData.forEach(function (refData, index) {
                    var centile = refData.centiles[Math.floor(refData.centiles.length / 2)];
                    var lowestX = centile.data[0].x;
                    var highestX = centile.data[centile.data.length - 1].x;
                    var refDataObj = {
                        xLow: lowestX,
                        xHigh: highestX,
                        index: index
                    }
                    if (lowestX < dataValue2MaxMin.min && highestX > dataValue2MaxMin.max) {
                        notOverFlowingRefData.push(refDataObj);
                    } else {
                        overFlowingRefData.push(refDataObj);
                    }
                });

                var selectedRefData;
                notOverFlowingRefData.sort(function (a, b) {
                    return (a.xHigh - a.xLow) - (b.xHigh - b.xLow);
                });
                if (notOverFlowingRefData.length > 0) {
                    selectedRefData = chart.refData[notOverFlowingRefData[0].index];
                } else {
                    console.log("Choosing from overflowed reference data");
                    //todo implementation
                    selectedRefData = chart.refData[overFlowingRefData[0].index];
                }

                var chartData = chartService.generateChartDataFromRefData(selectedRefData);
                chart.series = chartData.series;
                chart.data = chartData.data;
                chart.dataColors = chartData.dataColors;

                //data to plot
                var dataToPlot = [];
                dataValues2.forEach(function (dvX) {
                    var createdDateX = new Date(dvX.created);
                    dataValues1.forEach(function (dvY) {
                        var createdDateY = new Date(dvY.created);
                        var diff = ctrl.getDateDiffInDays(createdDateY, createdDateX);
                        if (diff < 7) {
                            var plotObject = {
                                x: dvX.value,
                                y: dvY.value
                            }
                            dataToPlot.push(plotObject);
                            //todo break
                        }
                    })
                });
                defer.resolve(dataToPlot);
            }

            defer.promise.then(function (data) {
                //adding patient data
                chart.series.unshift("test");
                chart.dataColors.unshift("#000000");
                chart.data.unshift([]);

                chart.dso = [{
                    type: 'line',
                    fill: false,
                    label: 'Recorded Data',
                    borderWidth: 2,
                    pointBackgroundColor: "black",//hide points
                    pointHoverBackgroundColor: "black",
                    borderColor: "black",
                    //borderDash: [5, 15],
                    skipNullValues: true,
                    showLines: false
                }];

                for (var i = 0; i < chart.data.length - 1; i++) {
                    chart.dso.push({
                        pointBackgroundColor: "rgba(0,0,0,0)"
                    });
                }

                chart.dso[0].data = data;

                //flood fill sd3
                var sd3 = chart.data.splice(chart.data.length - 1, 1);
                var first = sd3[0][0];
                var last = sd3[0][sd3[0].length - 1];
                first.y = Math.ceil((last.y + 1) / 10) * 10;
                last.y = first.y;
                chart.data.push([first, last]);

                console.log(chart);
                chart.processing = false;
            }, function (error) {
                toastService.showToast(error);
            })


        });
    }

    this.loadData();

    this.enlargeChart = function (chart, ev) {
        console.log(chart, ev);
        $mdDialog.show({
            controller: ChartController,
            templateUrl: 'templates/chart.dialog.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            locals: {
                chart: chart
            }
        })
    }

}