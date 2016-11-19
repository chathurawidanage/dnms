/**
 * Created by chath on 9/9/2016.
 */
function EventService($http, $q, $fdb, userService) {
    var eventDb = $fdb.db('dnms').collection("events");
    var eventService = {
        getEventsDb: function (drop) {
            return eventDb;
        },
        getEventAnalytics: function (programId, orgUnit, dataElementId, expectedValue) {//todo dates are hard coded
            var defer = $q.defer();
            var url = serverRoot + 'analytics/events/query/' + programId + '?dimension=' + dataElementId + ':EQ:' + expectedValue + '&startDate=1992-08-16&endDate=2016-12-12&dimension=ou:' + orgUnit;
            $http.get(url).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        },

        completeEvent: function (event, reverse) {
            var isMohUser = userService.hasRole(userService.MOH_USER);
            var oldStatus = event.status;
            var newStatus = reverse ? "ACTIVE" : (isMohUser ? "COMPLETED" : "SCHEDULE");
            event.status = newStatus;
            var defer = $q.defer();
            $http.put(serverRoot + 'events/' + event.event, angular.toJson(event)).then(function (response) {
                defer.resolve(reverse ? "Successfully reopened event." : "Successfully marked as " + (isMohUser ? "completed." : "reviewed."));
            }, function (response) {
                event.status = oldStatus;
                defer.reject("Failed to change the event status.");
            });
            return defer.promise;
        },

        deleteEvent: function (event) {
            var defer = $q.defer();
            $http.delete(serverRoot + 'events/' + event.event).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        getEventTeiMap: function (programId, ou) {
            var defer = $q.defer();
            $http.get(serverRoot + 'events.json?orgUnit=' + ou + '&ouMode=DESCENDANTS&skipPaging=true&program=' + programId + '&fields=event,trackedEntityInstance,status').then(function (response) {
                defer.resolve(response.data.events);
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        },

        updateEventData: function (event, dataValue) {
            var eventCopy = {
                event: event.event,
                orgUnit: event.orgUnit,
                program: event.program,
                programStage: event.programStage,
                status: event.status,
                trackedEntityInstance: event.trackedEntityInstance,
                dataValues: [{
                    dataElement: dataValue.dataElement,
                    value: dataValue.value,
                    providedElseWhere: dataValue.providedElseWhere
                }]
            };
            var defer = $q.defer();
            $http.put(serverRoot + 'events/' + event.event + '/' + dataValue.dataElement, angular.toJson(eventCopy)).then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                defer.reject(response);
            });
            return defer.promise;
        },

        getAnalyticsForDeCustom: function (psid,date1, date2, ouId, dataElementId, value,index) {
            var defer = $q.defer();
            //lankanets ewmYHyiO0sO
            //main ejUWIpcmgTz
            $http.get(serverRoot + 'sqlViews/XDKErUBFJLQ/data?var=date1:' + date1 + '&var=date2:' + date2 + '&var=ou:' + ouId + '&var=dataElement:' + dataElementId+'&var=psid:'+psid+'&var=val:'+value).then(function (response) {
                if (index==undefined) {//todo remove temp fix
                    defer.resolve(response.data);
                } else {
                    defer.resolve({index: index, data: response.data});
                }
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        },

        getHeightWeightAnalytics: function (sqlViewId, date1, date2, ouId, dataElementId, index) {
            var defer = $q.defer();
            $http.get(serverRoot + 'sqlViews/' + sqlViewId + '/data?var=date1:' + date1 + '&var=date2:' + date2 + '&var=ou:' + ouId + '&var=dataElement:' + dataElementId).then(function (response) {
                if (index == undefined) {
                    defer.resolve(response.data);
                } else {
                    defer.resolve({index: index, data: response.data});
                }
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        },

        getAnalyticsForDe: function (programId, programStageId, ouId, dataElementId) {
            var defer = $q.defer();
            $http.get(serverRoot + 'analytics/events/aggregate/' + programId + '.json?stage=' + programStageId + '&dimension=' + dataElementId + ':IN%3A1&dimension=pe:LAST_3_MONTHS&filter=ou:' + ouId + '&outputType=EVENT&displayProperty=NAME').then(function (response) {
                defer.resolve(response.data);
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        },

        //todo remove this
        getEventData: function (programId) {
            var defer = $q.defer();
            $http.get(serverRoot + 'events.json?ouMode=ACCESSIBLE&skipPaging=true&program=' + programId + '&fields=programStage,id,eventDate,lastUpdated,trackedEntityInstance,dataValues[dataElement,value]').then(function (response) {
                defer.resolve(response.data.events);
            }, function (response) {
                console.log(response);
                defer.reject(response);
            });
            return defer.promise;
        }
    }
    return eventService;
}