/**
 * Created by chath on 9/9/2016.
 */
function UserService($http, $q) {
    const SUPER_USER = 0;
    const MOH_USER = 3;
    const SISTER_USER = 4;
    const PHM_USER = 5;
    var cachedUser = undefined;
    var us = {
        //constants
        SUPER_USER: 0,
        MOH_USER: 3,
        SISTER_USER: 4,
        PHM_USER: 5,
        //functions
        getCurrentUser: function () {
            var defer = $q.defer();
            var userRoleMap = {//todo remove this temp fix
                wC9asSQrYO0: 0,//super user
                Ej7USJV1ccn: 3,//moh
                uCBJBr2plYV: 4,//sister
                jpsN0Kh6KTr: 5//mid wife
            }
            if (!cachedUser) {
                $http.get(serverRoot + 'me.json?fields=:all,organisationUnits[level,id,displayName,,parent[id,displayName,level],children[level,id,displayName,children[level,id,displayName,children[level,id,displayName,children[level,id,displayName]]]]&paging=false').then(function (response) {
                    response.data.level = 5;
                    try {
                        var userRole = response.data.userCredentials.userRoles[0].id;
                        response.data.level = userRoleMap[userRole];
                    } catch (e) {
                        console.error(e);
                    }
                    cachedUser = response.data;
                    defer.resolve(cachedUser);
                }, function (response) {
                    defer.reject(response);
                });
            } else {
                defer.resolve(cachedUser);
            }
            return defer.promise;
        },
        /**
         *
         * @param requiredRole
         * @param exact matches the exact role if true, matches any eligible role if false
         * @returns {boolean}
         */
        hasRole: function (requiredRole, exact) {
            if (cachedUser && ((exact && cachedUser.level == requiredRole) || (!exact && cachedUser.level <= requiredRole))) {
                return true;
            }
            return false;
        }
    }
    return us;
}