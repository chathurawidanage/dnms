/**
 * Created by chathura on 6/1/16.
 */
function ChartController($location, $routeParams, $scope, $mdDialog, programService, chartService, toastService, validationService) {
    var ctrl = this;

    this.lc = new LongitudinalChart();
    if ($routeParams.id) {
        var chartId = $routeParams.id;
        chartService.getChart(chartId).then(function (chart) {
            ctrl.lc = chart;
            ctrl.refreshDependants();
            ctrl.previewDataOnGraph();
        })
    }
    this.refDataPreviewIndex = 0;

    this.programs = [];
    this.dataElements = [];
    this.programIndicators = [];
    this.xAxisPeriods = intervals;

    this.navBack = function () {
        $location.path("/");
    }

    this.previewAvailable = function () {
        return this.lc.data.length > 0;
    }

    this.getDependantLabel = function () {
        switch (ctrl.lc.dependantDataType) {
            case 0:
                return "Dependant Data Element";
            case 1:
                return "Dependant Data Element II";
            case 2:
                return "Dependant Program Indicator";
        }
    }

    this.snap = function () {
        var canvas = document.getElementById('chart-preview');
        var img = canvas.toDataURL("png");
        return img;
    }

    this.saveChart = function () {
        this.validateChart(function () {
            chartService.saveChart(ctrl.lc).then(function (resp) {
                if (resp.httpStatusCode == 201) {
                    ctrl.navBack();
                    toastService.showToast("Chart saved!");
                }
            }, function (error) {
                //handle updates
                if (error.status == 409) {
                    chartService.deleteChart(ctrl.lc).then(function () {
                        console.info("Chart deleted");
                        ctrl.saveChart();
                    })
                }
            });
        });
    }

    this.validateChart = function (callback) {
        //other validations

        ctrl.lc.img = this.snap();
        if (ctrl.lc.id == undefined) {
            chartService.generateId().then(function (resp) {
                ctrl.lc.id = resp.codes[0];
                callback();
            });
        } else {
            callback();
        }
    }

    this.refreshDependants = function () {
        this.refreshDataElements();
        this.refreshProgramIndicators();
    }

    this.refreshProgramIndicators = function () {
        programService.getProgramIndicators(ctrl.lc.program).then(function (programIndicators) {
            ctrl.programIndicators = programIndicators;
            console.log(ctrl.programIndicators);
        }).catch(function () {
            console.log("Error in fetching data elements for " + ctrl.program)
        })
    }

    this.refreshDataElements = function () {
        programService.getProgramDataElements(ctrl.lc.program).then(function (dataElements) {
            ctrl.dataElements = dataElements;
        }).catch(function () {
            console.log("Error in fetching data elements for " + ctrl.program)
        })
    }

    /*Drop zone*/
    /*$scope.dropzoneConfig = {
     'options': { // passed into the Dropzone constructor
     'url': '#',
     'dictDefaultMessage': 'Drop CSV file here'
     },
     'eventHandlers': {
     'sending': function (file, xhr, formData) {
     },
     'success': function (file, response) {
     console.log(response);
     },
     'addedfile': function (file) {
     var reader = new FileReader();
     reader.onload = function () {
     var csvData = reader.result;
     ctrl.loadDataFromCSV(csvData);
     };
     reader.readAsText(file);
     }
     },
     };*/

    ctrl.deleteRefData = function (ev, index) {
        var confirm = $mdDialog.confirm()
            .title('Do you really want to delete this data set?')
            .textContent('Deleting this data set will permanently delete all the centile data of that set including ' +
                'their color values. There is no other' +
                'way of rolling back this operation, other than re uploading and re configuring data.')
            .ariaLabel('delete confirmation')
            .targetEvent(ev)
            .ok('Please delete it!')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function () {
            if (index == ctrl.refDataPreviewIndex) {//if deleting currently visible one
                ctrl.refDataPreviewIndex = 0;
            }
            ctrl.lc.refData.splice(index, 1);
            if (index < ctrl.refDataPreviewIndex) {//if previous index is deleted, pointer should be moved up
                ctrl.refDataPreviewIndex--;
            }
        }, function () {
            //do nothing for now, may be not even later. :-P
        });

    }


    ctrl.loadDataFromCSV = function (csvData) {
        ctrl.lc.centiles = [];

        var rows = csvData.split('\r\n');

        //first row is centile names, remove it
        var centileNames = rows.splice(0, 1).toString().split(",");
        centileNames.forEach(function (centileName, i) {
            if (i != 0) {//first on is the time interval
                var c = new Centile();
                c.name = centileName;
                ctrl.lc.centiles.push(c);
            } else {//trying to smart fill the referenceData interval
                //todo better algo
                var char = centileName.toLowerCase().charAt(0);
                intervals.forEach(function (name, index) {
                    if (name.toLowerCase().charAt(0) == char) {
                        ctrl.lc.xAxisPeriod = index;
                    }
                })
            }
        });

        rows.forEach(function (row, i) {
            var separatedValues = row.split(",");

            separatedValues.forEach(function (value, j) {
                if (j != 0) {//skip dependant variable value
                    //ctrl.lc.centiles[j - 1].data[i] = value;
                    ctrl.lc.centiles[j - 1].data.push({
                        x: i,
                        y: value
                    });
                }//todo starting point is not always zero
            });
        });
        ctrl.previewDataOnGraph();
    };

    /**
     * will be called by UI inputs
     */
    ctrl.applyData = function () {
        //do stuff
        ctrl.previewDataOnGraph();
    }

    ctrl.getPreviewData = function () {
        return ctrl.lc.refData[ctrl.refDataPreviewIndex];
    }

    /**
     * Will be called by UI, when user switch the preview data set.
     * @param index
     */
    ctrl.setPreviewDataIndex = function (index) {
        ctrl.refDataPreviewIndex = index;
        ctrl.previewDataOnGraph();
    }

    /**
     * Previews data on the graph
     */
    ctrl.previewDataOnGraph = function () {
        var refData = ctrl.getPreviewData();
        if (!refData) {
            console.error("No refData defined");
            return;
        }
        console.log(refData);

        /*var selectedData = [];
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

         ctrl.lc.labels = [];
         for (var i = 0; i < maxDataLength; i++) {
         ctrl.lc.labels.push(i + 1);
         }
         ctrl.lc.series = selectedSeries;
         ctrl.lc.data = selectedData;
         ctrl.lc.dataColors = selectedDataColors;*/
        var chartData = chartService.generateChartDataFromRefData(refData);
        ctrl.lc.series = chartData.series;
        ctrl.lc.data = chartData.data;
        ctrl.lc.dataColors = chartData.dataColors;

        //$scope.$apply();
    };

    /**
     * Will be called by UI to get the name of the gender by the index
     * @param index
     */
    ctrl.getGenderByIndex = function (index) {
        return gender[parseInt(index)];
    }

    /**
     * Will be called by UI to get the name of the interval by index
     * @param index
     */
    ctrl.getIntervalByIndex = function (index, noun) {
        return noun ? intervalNoun[parseInt(index)] : intervals[parseInt(index)];
    }


    /**
     * Display the dialog to insert new reference data
     * @param ev
     */
    ctrl.showNewRefDataDialog = function (ev) {
        $mdDialog.show({
            controller: RefDataController,
            templateUrl: 'templates/reference.dialog.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false
        })
            .then(function (data) {
                if (!ctrl.lc.refData) {
                    ctrl.lc.refData = [];
                }
                ctrl.lc.refData.push(data);
                ctrl.refDataPreviewIndex = ctrl.lc.refData.length - 1;
                ctrl.previewDataOnGraph();
                console.log(data);
            }, function () {
                console.log("closed");
            });
    }

    /**
     * Loading list of programs
     */
    programService.getPrograms().then(function (programs) {
        ctrl.programs = programs;
    }).catch(function () {
        console.log("error in loading programs");
    });
}