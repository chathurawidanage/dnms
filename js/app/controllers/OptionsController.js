/**
 * Created by chathura on 7/13/16.
 */
function OptionsController(appService, teiService, $scope, $mdDialog) {
    $scope.options;
    $scope.dobAttributes = [];
    $scope.genAttributes = [];

    $scope.loadOptions = function () {
        appService.getOptions().then(function (options) {
            console.log(options);
            $scope.options = options;
        }, function (error) {
            $scope.options = new Options();
        })
    }

    $scope.loadAttributes = function () {
        teiService.getDobPossibleTeiAttributes().then(function (tAtts) {
            console.log(tAtts);
            $scope.dobAttributes = tAtts;
        });
        teiService.getGenderPossibleTeiAttributes().then(function (tAtts) {
            console.log(tAtts);
            $scope.genAttributes = tAtts;
        })
    }

    $scope.save = function () {
        appService.setOptions($scope.options).then(function (resp) {
            $scope.close();
        }, function (error) {
            if (error.status == 409) {
                appService.updateOptions($scope.options).then(function (resp) {
                    $scope.close();
                })
            }
        })
    }

    $scope.close = function () {
        $mdDialog.cancel();
    }

    $scope.init = function () {
        $scope.loadAttributes();
        $scope.loadOptions();
    }
}