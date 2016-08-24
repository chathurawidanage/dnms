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
            this.data = [];
            this.labels = [];
        }
    }

    rctrl.subChart = {
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
            this.data = [];
            this.labels = [];
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
        rctrl.risks.forEach(function (mainRisk) {
            eventService.getAnalyticsForDe($scope.ctrl.selectedProgram.id,
                rctrl.riskIdentificationProgStage,
                $scope.ctrl.currentOuSelection.id, mainRisk.id).then(function (data) {
                mainRisk.data = data;//saving for future

                //creating data for main chart
                rctrl.mainChart.labels.push(data.metaData.names[mainRisk.id]);
                var total = 0;
                data.rows.forEach(function (row) {
                    total += parseInt(row[2]);
                })
                rctrl.mainChart.data.push(total);
                rctrl.mainChart.colors.push("#" + ((1 << 24) * Math.random() | 0).toString(16));
                console.log("Chart", rctrl.mainChart);
            });
        });

        rctrl.mainChart.options.title.text = "Major Risks - " + $scope.ctrl.currentOuSelection.displayName;

    }

    rctrl.chartClick = function (points, evt) {
        var index = points[0]._index;
        console.log(index);
        rctrl.generateSubChart(index);

    }

    rctrl.generateSubChart=function (mainRiskIndex) {
        rctrl.subChart.reset();
        var majorRisk=rctrl.risks[mainRiskIndex];
        majorRisk.children.forEach(function (subRisk) {
            eventService.getAnalyticsForDe($scope.ctrl.selectedProgram.id,
                rctrl.riskIdentificationProgStage,
                $scope.ctrl.currentOuSelection.id, subRisk.id).then(function (data) {
                subRisk.data = data;//saving for future

                //creating data for main chart
                rctrl.subChart.labels.push(data.metaData.names[subRisk.id]);
                var total = 0;
                data.rows.forEach(function (row) {
                    total += parseInt(row[2]);
                })
                rctrl.subChart.data.push(total);
                rctrl.subChart.colors.push("#" + ((1 << 24) * Math.random() | 0).toString(16));
                console.log("Chart", rctrl.mainChart);
            });
        });
        rctrl.subChart.options.title.text = majorRisk.data.metaData.names[majorRisk.id];
    }


}