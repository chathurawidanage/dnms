/**
 * @author Chathura Widanage
 */
function RiskController($location, appService, teiService, $routeParams, toastService,
                        programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var rctrl = this;
    var dateService = new DateService();
    rctrl.risks = [
        {
            "id": "BTwe8lvhr4b",
            "children": [
                {
                    "id": "SG5bELDIJMt"
                },
                {
                    "id": "cmK5179Zq0d"
                },
                {
                    "id": "AHRXmsMNbIu"
                },
                {
                    "id": "JRCCfrYDoQM"
                },
                {
                    "id": "mOjDNEJdCPF"
                }
            ]
        },
        {
            "id": "FXW7KOfmfV3",
            "children": [
                {
                    "id": "wzmgGGAZM6j"
                },
                {
                    "id": "S1lA6BjQk92"
                },
                {
                    "id": "Ajc3gRLHGk0"
                },
                {
                    "id": "WdqQ4jyUAp8"
                },
                {
                    "id": "M9VsyFW0FgJ"
                }
            ]
        },
        {
            "id": "eQj4eOiKezp",
            "children": [
                {
                    "id": "ZFcx2jmd6dc"
                },
                {
                    "id": "ukgrWYgOTx5"
                },
                {
                    "id": "fvKRRFvlOYf"
                },
                {
                    "id": "Kmtx2Q8YeXj"
                },
                {
                    "id": "fvAkZTDHkej"
                },
                {
                    "id": "X4OHuFSgp7k"
                },
                {
                    "id": "UEqkoYxSDZL"
                }
            ]
        },
        {
            "id": "wwGpJEEij1j",
            "children": [
                {
                    "id": "uOGHqGmu1r9"
                },
                {
                    "id": "GpMuvVmikqg"
                },
                {
                    "id": "xfJrzclMRA0"
                }
            ]
        },
        {
            "id": "SQGnjhiUiR5",
            "children": [
                {
                    "id": "hIdYoGmOnxT"
                },
                {
                    "id": "FF76DMCZaau"
                },
                {
                    "id": "SwXTE98GiT2"
                },
                {
                    "id": "jlSG1VMi5w7"
                },
                {
                    "id": "zw73eoN7nx0"
                },
                {
                    "id": "gjoFV1B8t2J"
                },
                {
                    "id": "I9pT7vgZZ2B"
                },
                {
                    "id": "JM11BX22G0V"
                },
                {
                    "id": "iThNT73AUNV"
                }
            ]
        },
        {
            "id": "ipRAwsU9ZWQ",
            "children": [
                {
                    "id": "T74FRikzd5j"
                },
                {
                    "id": "IZ9U9POhBPL"
                }
            ]
        },
        {
            "id": "jY98YpVPefN",
            "children": [
                {
                    "id": "tWCk3b5WbAH"
                },
                {
                    "id": "nDEWSHmLiEl"
                },
                {
                    "id": "jDnvVHoZHEt"
                }
            ]
        }

    ];
    rctrl.riskIdentificationProgStage = "vTWcDsFE1rf";
    rctrl.date2 = new Date();


    rctrl.mainChart = {
        loading: false,
        visible: true,
        data: [],
        labels: [],
        colors: [],
        options: {
            legend: {
                display: true,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Chart Title'
            }
        },
        reset: function () {
            this.visible = true;
            this.data = [];
            this.labels = [];
            this.loading = false;
        }
    }

    rctrl.subChart = {
        loading: false,
        visible: false,
        data: [],
        labels: [],
        colors: [],
        options: {
            legend: {
                display: true,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Chart Title'
            }
        },
        reset: function (keepVisiblity) {//keep visibility to avoid page jumping issue
            this.data = [];
            this.labels = [];
            if (!keepVisiblity) {
                this.visible = false;
            }
            this.loading = false;
        }
    }

    rctrl.readyness = {
        program: false,
        ou: false,
        namesLoad: false,
        isReady: function () {
            return this.program && this.ou && this.namesLoad;
        }
    }

    rctrl.nameRequests = 0;
    rctrl.nameRequestsDone = 0;
    rctrl.fetchNameOfRisk = function (risk) {
        dataElementService.getDataElementNameById(risk.id).then(function (name) {
            risk.name = name;
            rctrl.nameRequestsDone++;
            if (rctrl.nameRequests == rctrl.nameRequestsDone) {
                rctrl.readyness.namesLoad = true;
                rctrl.loadData();
            }
        })
    }

    rctrl.risks.forEach(function (risk) {
        rctrl.nameRequests++;
        rctrl.fetchNameOfRisk(risk);
        risk.children.forEach(function (childRisk) {
            rctrl.nameRequests++;
            rctrl.fetchNameOfRisk(childRisk);
        })
    });

    $scope.$watch('ctrl.date', function (date) {
        rctrl.date2 = date;
        rctrl.loadData();
    });

    $scope.$watch('ctrl.selectedProgram', function (selectedProgram) {
        if (selectedProgram) {
            rctrl.readyness.program = true;
            rctrl.loadData();
        }
    });

    $scope.$watch('ctrl.currentOuSelection', function (ouSelection) {
        if (ouSelection) {
            rctrl.readyness.ou = true;
            rctrl.loadData();
        }
    });

    rctrl.loadData = function () {
        if (!rctrl.readyness.isReady()) {
            return;
        }
        rctrl.mainChart.reset();
        rctrl.subChart.reset();
        rctrl.mainChart.loading = true;
        var grandTotal = 0;
        var count = 0;
        var index = 0;
        rctrl.risks.forEach(function (mainRisk) {
            eventService.getAnalyticsForDeCustom(STAGE_RISK_MONITOR, dateService.toDateString(new Date(0)), dateService.toDateString(rctrl.date2), $scope.ctrl.currentOuSelection.id, mainRisk.id, 'true', index++).then(function (response) {
                var data = response.data;
                var idx = response.index;
                var total = 0;
                if (data.rows.length > 0) {
                    var tableRow = data.rows[0];
                    if (tableRow.length > 0) {
                        total = tableRow[0];
                    }
                }
                //
                mainRisk.total = parseInt(total);
                rctrl.mainChart.data[idx] = (mainRisk.total);
                grandTotal += mainRisk.total;
                count++;
                if (count == rctrl.risks.length) {
                    if (grandTotal == 0) {
                        rctrl.mainChart.visible = false;
                    }
                    rctrl.risks.forEach(function (mR) {
                        console.log(mR);
                        rctrl.mainChart.labels.push(mR.name + " [" + (mR.total * 100 / grandTotal).toFixed(2) + "%]");
                    });
                    rctrl.mainChart.loading = false;
                }
            });
            /* eventService.getAnalyticsForDe($scope.ctrl.selectedProgram.id,
             rctrl.riskIdentificationProgStage,
             $scope.ctrl.currentOuSelection.id, mainRisk.id).then(function (data) {
             mainRisk.data = data;//saving for future
             console.log(data);

             //creating data for main chart

             var total = 0;
             data.rows.forEach(function (row) {
             total += parseInt(row[2]);
             })
             mainRisk.total = total;
             rctrl.mainChart.data.push(total);
             grandTotal += total;
             count++;
             if (count == rctrl.risks.length) {
             if (grandTotal == 0) {
             rctrl.mainChart.visible = false;
             }
             rctrl.risks.forEach(function (mR) {
             try {
             rctrl.mainChart.labels.push(mR.data.metaData.names[mR.id] + " [" + (mR.total * 100 / grandTotal).toFixed(2) + "%]");
             } catch (e) {
             //todo remove this, this is just in case for demo
             }
             });
             rctrl.mainChart.loading = false;
             }
             }
             );*/
        });

        rctrl.mainChart.options.title.text = "Major Risks - " + $scope.ctrl.currentOuSelection.displayName;

    }

    rctrl.currentMainRisk = undefined;
    rctrl.chartClick = function (points, evt) {
        var index = points[0]._index;
        $scope.ctrl.trendDataElement = rctrl.risks[index].id;
        rctrl.currentMainRisk = rctrl.risks[index];
        rctrl.generateSubChart(index, true);
    }

    rctrl.subChartClick = function (points, evt) {
        var index = points[0]._index;
        if (rctrl.currentMainRisk) {
            $scope.$evalAsync(function () {
                $scope.ctrl.trendDataElement = rctrl.currentMainRisk.children[index].id;
            });
        }
    }

    rctrl.generateSubChart = function (mainRiskIndex, keepVisibility) {
        rctrl.subChart.reset(keepVisibility);
        var majorRisk = rctrl.risks[mainRiskIndex];
        var grandTotal = 0;
        var count = 0;
        rctrl.subChart.loading = true;
        rctrl.subChart.visible = true;
        rctrl.subChart.options.title.text = majorRisk.name;
        var index = 0;
        majorRisk.children.forEach(function (subRisk) {
            eventService.getAnalyticsForDeCustom(STAGE_RISK_MONITOR, dateService.toDateString(new Date(0)), dateService.toDateString(rctrl.date2), $scope.ctrl.currentOuSelection.id, subRisk.id, 'true', index++).then(function (resp) {
                var data = resp.data;
                var idx = resp.index;
                var total = 0;
                if (data.rows.length > 0) {
                    var tableRow = data.rows[0];
                    if (tableRow.length > 0) {
                        total = tableRow[0];
                    }
                }
                //
                subRisk.total = parseInt(total);
                rctrl.subChart.data[idx] = (subRisk.total);
                grandTotal += subRisk.total;
                count++;
                if (count == majorRisk.children.length) {
                    if (grandTotal == 0) {
                        rctrl.subChart.visible = false;
                    }
                    majorRisk.children.forEach(function (sR) {
                        rctrl.subChart.labels.push(sR.name + " [" + (sR.total * 100 / grandTotal).toFixed(2) + "%]");
                    });
                    rctrl.subChart.loading = false;
                }
            });

            /*eventService.getAnalyticsForDe($scope.ctrl.selectedProgram.id,
             rctrl.riskIdentificationProgStage,
             $scope.ctrl.currentOuSelection.id, subRisk.id).then(function (data) {
             subRisk.data = data;//saving for future

             //creating data for main chart

             var total = 0;
             data.rows.forEach(function (row) {
             total += parseInt(row[2]);
             });
             subRisk.total = total;
             grandTotal += total;
             count++;
             rctrl.subChart.data.push(total);
             if (count == majorRisk.children.length) {
             majorRisk.children.forEach(function (sR) {
             rctrl.subChart.labels.push(sR.data.metaData.names[sR.id] + " [" + (sR.total * 100 / grandTotal).toFixed(2) + "%]");
             });
             rctrl.subChart.loading = false;
             }
             });*/
        });
    }

    rctrl.generateTrendLine = function (dataElementId) {

    }
}