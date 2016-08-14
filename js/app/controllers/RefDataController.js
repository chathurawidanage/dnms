/**
 * Created by chathura on 7/26/16.
 */
function RefDataController($scope, $mdDialog, toastService) {
    $scope.refData = new ReferenceData();
    $scope.xAxisPeriods = intervals;

    $scope.close = function () {
        $mdDialog.cancel();
    }

    $scope.submit = function () {
        if (!$scope.refData.gender) {
            toastService.showToast("Invalid gender selection.");
            return;
        }

        if (!$scope.refData.xAxisPeriod) {
            toastService.showToast("Invalid time interval selection.")
            return;
        }

        if ($scope.refData.centiles.length == 0) {
            toastService.showToast("Invalid reference data.");
            return;
        }

        $mdDialog.hide($scope.refData);
    }

    /*Drop zone*/
    $scope.dropzoneConfig = {
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
                    $scope.loadDataFromCSV(csvData);
                };
                reader.readAsText(file);
            }
        },
    };

    $scope.loadDataFromCSV = function (csvData) {
        $scope.refData.centiles = [];

        var rows = csvData.split('\r\n');

        //first row is centile names, remove it
        var centileNames = rows.splice(0, 1).toString().split(",");
        centileNames.forEach(function (centileName, i) {
            if (i != 0) {//first on is the time interval
                var c = new Centile();
                c.name = centileName;
                $scope.refData.centiles.push(c);
            } else {//trying to smart fill the referenceData interval
                //todo better algo
                var char = centileName.toLowerCase().charAt(0);
                intervals.forEach(function (name, index) {
                    if (name.toLowerCase().charAt(0) == char) {
                        $scope.refData.xAxisPeriod = index;
                    }
                })
            }
        });

        rows.forEach(function (row, i) {
            var separatedValues = row.split(",");
            var xVal = separatedValues[0];

            separatedValues.forEach(function (value, j) {
                if (j != 0) {//skip dependant variable value
                    //ctrl.lc.centiles[j - 1].data[i] = value;
                    $scope.refData.centiles[j - 1].data.push({
                        x: xVal,
                        y: value
                    });
                }
            });
        });
        $scope.$apply();
    };
}