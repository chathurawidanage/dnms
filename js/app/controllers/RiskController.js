/**
 * @author Chathura Widanage
 */
function RiskController($location, appService, teiService, $routeParams, toastService,
                        programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var rctrl = this;
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
        isReady: function () {
            return this.program && this.ou;
        }
    }

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
        rctrl.risks.forEach(function (mainRisk) {
            eventService.getAnalyticsForDe($scope.ctrl.selectedProgram.id,
                rctrl.riskIdentificationProgStage,
                $scope.ctrl.currentOuSelection.id, mainRisk.id).then(function (data) {
                mainRisk.data = data;//saving for future

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
            });
        });

        rctrl.mainChart.options.title.text = "Major Risks - " + $scope.ctrl.currentOuSelection.displayName;

    }

    rctrl.chartClick = function (points, evt) {
        var index = points[0]._index;
        console.log(index);
        rctrl.generateSubChart(index, true);
    }

    rctrl.generateSubChart = function (mainRiskIndex, keepVisibility) {
        rctrl.subChart.reset(keepVisibility);
        var majorRisk = rctrl.risks[mainRiskIndex];
        var grandTotal = 0;
        var count = 0;
        rctrl.subChart.loading = true;
        rctrl.subChart.visible = true;
        majorRisk.children.forEach(function (subRisk) {
            eventService.getAnalyticsForDe($scope.ctrl.selectedProgram.id,
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
            });
        });
        rctrl.subChart.options.title.text = majorRisk.data.metaData.names[majorRisk.id];
    }


}