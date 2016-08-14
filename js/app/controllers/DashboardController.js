/**
 * @author Chathura Widanage
 */
function DashboardController($location, $scope, toastService, programService, userService,
                             chartService, appService, $mdDialog, $timeout, teiService, eventService, $fdb, $window) {
    var ctrl = this;
    ctrl.programs = [];
    ctrl.mohUserRole = "Ej7USJV1ccn";
    ctrl.phmUserRole = "jpsN0Kh6KTr";//todo make as a setting

    ctrl.selectedProgram = null;
    ctrl.user;

    ctrl.queryOrgUnits = [];
    ctrl.keyword = null;

    ctrl.loadingData = false;

    ctrl.teis = [];

    ctrl.teiDb = null;
    ctrl.eventsDb = null;

    ctrl.malNutReasons = [
        {
            title: "Low birth weight",
            dataElementId: "Sf3lPKs8oLs",
            records: null
        },
        {
            title: "Under five with underweight",
            dataElementId: "gaZGnRTcR7T",
            records: null
        },
        {
            title: "Under five with wasting",
            dataElementId: "oTLBvqfHCxz",
            records: null
        }, {
            title: "Under five with stunting",
            dataElementId: "hUxgdSCMiNy",
            records: null
        }, {
            title: "Anemia",
            dataElementId: "kerTmzDMqUB",
            records: null
        }, {
            title: "Overweight",
            dataElementId: "l0WWFNEMoQZ",
            records: null
        }
    ];

    const CAHCE_STATUS = {
        undefined: 0,
        loading: 1,
        loaded: 2
    }

    ctrl.caches = {//status 0:not loaded, 1: loading , 2:loaded
        profile: CAHCE_STATUS.undefined,
        tei: CAHCE_STATUS.undefined,
        events: CAHCE_STATUS.undefined,
        malNut: CAHCE_STATUS.undefined
    };

    ctrl.selectedMalNul = null;//mal nutirtion teis view list
    ctrl.selectedMalNutRows = null;//mal nutirtion teis view list

    ctrl.doneInitLoading = false;

    userService.getCurrentUser().then(function (user) {//stage 1
        ctrl.caches.profile = CAHCE_STATUS.loading;
        ctrl.user = user;
        //loading databases
        ctrl.teiDb = $fdb.db('dnms').collection("teis-" + ctrl.user.id);
        ctrl.eventsDb = $fdb.db('dnms').collection("events-" + ctrl.user.id);

        var orgUnits = ctrl.user.organisationUnits;
        console.log(orgUnits);
        //finding highest orgUnit
        var lowestLevel = Number.MAX_VALUE;
        orgUnits.forEach(function (orgUnit) {
            if (orgUnit.level < lowestLevel) {
                lowestLevel = orgUnit.level;
            }
        });

        ctrl.queryOrgUnits = [];
        orgUnits.forEach(function (orgUnit) {
            if (orgUnit.level == lowestLevel) {
                ctrl.queryOrgUnits.push(orgUnit.id);
            }
        });
        console.log(ctrl.queryOrgUnits);
        //loading full list
        ctrl.infiniteItems.reset();

        ctrl.caches.profile = CAHCE_STATUS.loaded;
        ctrl.checkProgress();
        //ctrl.doneInitLoading = true;
    }).then(function () {//stage 2
        programService.getPrograms().then(function (programs) {
            ctrl.programs = programs;
            ctrl.selectedProgram = ctrl.programs[0];//todo change
            console.log("Selected program", ctrl.selectedProgram);
        }).then(function () {//symul
            console.log(ctrl.queryOrgUnits[0]);

            //loading mal nut data
            ctrl.caches.malNut = CAHCE_STATUS.loading;
            var malNutLoadCount = 0;
            ctrl.malNutReasons.forEach(function (malNut) {
                malNut.records = [];
                eventService.getEventAnalytics(ctrl.selectedProgram.id, ctrl.queryOrgUnits[0], malNut.dataElementId, 1).then(function (data) {
                    //event id is the only thing that matters
                    data.rows.forEach(function (row) {
                        malNut.records.push(row);
                    })
                    malNutLoadCount++;
                    if (malNutLoadCount == ctrl.malNutReasons.length) {
                        ctrl.caches.malNut = CAHCE_STATUS.loaded;
                        ctrl.checkProgress();
                    }
                })
            });
        }).then(function () {//symul
            //loading tracked entity instances and events
            ctrl.cacheTeis();
            ctrl.buildEventTeiMap();
        });
    });

    ctrl.buildEventTeiMap = function () {
        ctrl.caches.events = CAHCE_STATUS.loading;
        eventService.getEventTeiMap(ctrl.selectedProgram.id).then(function (events) {
            ctrl.eventsDb.insert(events);
            ctrl.caches.events = CAHCE_STATUS.loaded;
            ctrl.checkProgress();
        });
    }

    ctrl.cacheTeis = function () {
        ctrl.caches.tei = CAHCE_STATUS.loading;
        debugDb = ctrl.teiDb;
        //todo firstname and last name attributes are hard coded
        teiService.queryForAllTeis(["izuwkaOUgFg", "C8DBAo2wEYN", "BZEpuufLyDE", "WqdldQpOIxm"]).then(function (data) {
            var rows = data.rows;
            ctrl.loadingText = "Saving children data...";
            rows.forEach(function (row) {
                ctrl.teiDb.insert({
                    _id: row[0],
                    ou: row[3],
                    ouName: row[4],
                    fName: row[7],
                    lName: row[8],
                    gender: row[9],
                    chdrNumber: row[10]
                })
            });
            ctrl.caches.tei = CAHCE_STATUS.loaded;
            ctrl.checkProgress();
        });
    };

    ctrl.progressCount = 0;
    ctrl.checkProgress = function () {
        //ctrl.doneInitLoading = true;
        ctrl.progressCount++;
        console.log(ctrl.progressCount);
        if (ctrl.progressCount == Object.keys(ctrl.caches).length) {
            ctrl.doneInitLoading = true;
        }
    }

    ctrl.showMalNutTeis = function (malNutReason) {
        ctrl.selectedMalNul = malNutReason;
        ctrl.malNutInfiniteItems.reset();
    };

    ctrl.malNutInfiniteItems = {
        teis: [],
        currentPage: 1,
        totalPages: 1,
        numLoaded_: 0,
        toLoad_: 0,
        // Required.
        reset: function () {
            this.teis = [];
            this.currentPage = 1;
            this.totalPages = ctrl.selectedMalNul.records.length;
            this.numLoaded_ = 0;
            this.toLoad_ = 0;
        },

        getItemAtIndex: function (index) {
            if (index > this.numLoaded_ || !ctrl.doneInitLoading) {
                this.fetchMoreItems_(index);
                return null;
            }
            return this.teis[index];
        },
        // Required.
        // For infinite scroll behavior, we always return a slightly higher
        // number than the previously loaded items.
        getLength: function () {
            return this.numLoaded_ + 5;
        },
        fetchMoreItems_: function (index) {
            // For demo purposes, we simulate loading more items with a timed
            // promise. In real code, this function would likely contain an
            // $http request.
            var tis = this;
            if (this.toLoad_ < index) {
                this.toLoad_ += 20;
                var loadCount = 0;
                while (loadCount < 25 && index < ctrl.selectedMalNul.records.length) {
                    var eventId = ctrl.selectedMalNul.records[index];
                    var event = ctrl.eventsDb.find({event: eventId});
                    if (event.length > 0) {
                        var teiId = event[0].trackedEntityInstance;
                        console.log("searching for", teiId);
                        var teiArr = ctrl.teiDb.find({_id: teiId});
                        console.log("searched", teiArr);
                        if (teiArr.length > 0) {
                            tis.teis.push(teiArr[0]);
                        }
                    }
                    index++;
                    loadCount++;
                }
                tis.numLoaded_ = tis.teis.length;
            }
        }
    };


    ctrl.refreshList = function (event) {
        if (ctrl.keyword != null && ctrl.keyword.trim() == "") {
            ctrl.keyword = null;
        } else if (event.keyCode == 13) {
            ctrl.infiniteItems.reset();
        }
    };

    ctrl.openChildProfile = function (teiId) {
        console.log("Opening child profile", teiId);
        $window.open(location.href + 'profile?tei=' + teiId + "&program=" + ctrl.selectedProgram.id);
    }

    ctrl.infiniteItems = {
        teis: [],
        currentPage: 1,
        totalPages: 1,
        numLoaded_: 0,
        toLoad_: 0,
        // Required.
        reset: function () {
            this.teis = [];
            this.currentPage = 1;
            this.totalPages = 1;
            this.numLoaded_ = 0;
            this.toLoad_ = 0;
        },

        getItemAtIndex: function (index) {
            if (index > this.numLoaded_ || !ctrl.doneInitLoading) {
                this.fetchMoreItems_(index);
                return null;
            }
            return this.teis[index];
        },
        // Required.
        // For infinite scroll behavior, we always return a slightly higher
        // number than the previously loaded items.
        getLength: function () {
            return this.numLoaded_ + 5;
        },
        fetchMoreItems_: function (index) {
            // For demo purposes, we simulate loading more items with a timed
            // promise. In real code, this function would likely contain an
            // $http request.
            var tis = this;
            if (this.toLoad_ < index) {

                if (ctrl.queryOrgUnits.length > 0 && ctrl.selectedProgram) {
                    this.toLoad_ += 20;
                    console.log("selected program inside load", ctrl.selectedProgram);
                    teiService.queryForTeis(ctrl.queryOrgUnits, ctrl.selectedProgram.id, ctrl.keyword, this.currentPage).then(function (data) {
                        tis.teis = tis.teis.concat(data.rows);
                        tis.currentPage = data.metaData.pager.page;
                        tis.totalPages = data.metaData.pager.pageCount;
                        tis.numLoaded_ = tis.teis.length;
                    });
                }

                /*$timeout(angular.noop, 300).then(angular.bind(this, function () {
                 this.numLoaded_ = this.toLoad_;
                 }));*/
            }
        }
    };


}