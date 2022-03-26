/**
 * Created by chath on 9/9/2016.
 */
function UserService($http, $q) {
    if (manualAuth) {
        $http.defaults.headers.common['Authorization'] = 'Basic ' + btoa(authUsername + ':' + authPassword);
    }
    var cachedUser = undefined;
    var us = {
        //constants
        SUPER_USER: 0,
        MOH_USER: 3,
        SISTER_USER: 4,
        PHM_USER: 5,
        DEO_USER:6,
        //functions
        getCurrentUser: function () {
            var defer = $q.defer();
            var userRoleMap = {//todo remove this temp fix
                yrB6vc5Ip3r: 0,//super user
                w4qpnx1NFyr: 3,//moh
                uCBJBr2plYV: 4,//sister
                to1ek38ykKC: 5,//mid wife
                gtkJ4RBqfNS: 6 // DEO
            }
            if (!cachedUser) {
                $http.get(serverRoot + 'me.json?fields=:all,organisationUnits[level,id,displayName,,parent[id,displayName,level],children[level,id,displayName,children[level,id,displayName,children[level,id,displayName,children[level,id,displayName]]]]&paging=false').then(function (response) {
                    console.log("User response", response)
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