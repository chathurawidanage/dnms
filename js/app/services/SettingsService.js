/**
 * Created by chath on 9/11/2016.
 */
function SettingsService($http, $q) {
    var settingsRoot = serverRoot + 'dataStore/dnms-settings/';
    var eventService = {
        teiAttributes: {
            get: function () {
                var defer = $q.defer();
                var url = settingsRoot + 'teiAttOrder';
                $http.get(url).then(function (response) {
                    defer.resolve(response.data);
                }, function (response) {
                    defer.reject(response);
                });
                return defer.promise;
            },
            save: function (teiAtts) {
                var defer = $q.defer();
                var url = settingsRoot + 'teiAttOrder';
                var post = function () {
                    $http.post(url, angular.toJson(teiAtts)).then(function (response) {
                        defer.resolve(response.data);
                    }, function (response) {
                        defer.reject(response);
                    })
                }
                $http.delete(url).then(function (response) {
                    post();
                }, function (response) {
                    if (response.status == 404) {
                        post();
                    }
                });
                return defer.promise;
            }
        },

    }

    return eventService;
}