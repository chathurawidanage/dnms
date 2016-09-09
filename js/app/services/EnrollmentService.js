/**
 * Created by chath on 9/9/2016.
 */
function EnrollmentService($http, $q) {
    return {
        unenrollTei: function (teiId, program) {
            var defer = $q.defer();
            this.getEnrollmentForTei(teiId, program).then(function (enrollments) {
                var enrollment = enrollments[0];//todo handle multiple
                console.log(enrollment);
                enrollment.status = "COMPLETED";
                $http.put(serverRoot + 'enrollments/' + enrollment.enrollment, angular.toJson(enrollment)).then(function (response) {
                    defer.resolve(response);
                }, function (response) {
                    defer.reject(response);
                });
            });
            return defer.promise;
        },

        getEnrollmentForTei: function (teiId, programId) {
            var defer = $q.defer();
            $http.get(serverRoot + 'enrollments.json?ouMode=ACCESSIBLE&trackedEntityInstance=' + teiId + '&program=' + programId).then(function (response) {
                defer.resolve(response.data.enrollments);
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        }
    }
}