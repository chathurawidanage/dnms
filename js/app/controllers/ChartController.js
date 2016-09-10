/**
 * Created by chathura on 6/1/16.
 */
function ChartController($scope, chart, $mdDialog) {
    $scope.chart = new Object();
    angular.copy(chart, $scope.chart);
    //$scope.chart.options.responsive = false;
    $scope.close = function () {
        $mdDialog.cancel();
    }
}