/**
 * @author Chathura Widanage
 */
function DashboardController($location, $scope, toastService, programService, userService,
                             chartService, appService, $mdDialog, $timeout, teiService, eventService,
                             $fdb, $window, orgUnitsService, $mdSidenav) {
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

    ctrl.orgTree = {};
    ctrl.currentOuSelection = {};

    ctrl.teiDb = null;
    ctrl.eventsDb = null;

    ctrl.malNutReasons = [
        {
            title: "Low birth weight",
            dataElementId: "Sf3lPKs8oLs",
            records: null,
            visibleRecords: null
        },
        {
            title: "Under five with underweight",
            dataElementId: "gaZGnRTcR7T",
            records: null,
            visibleRecords: null
        },
        {
            title: "Under five with wasting",
            dataElementId: "oTLBvqfHCxz",
            records: null,
            visibleRecords: null
        }, {
            title: "Under five with stunting",
            dataElementId: "hUxgdSCMiNy",
            records: null,
            visibleRecords: null
        }, {
            title: "Anemia",
            dataElementId: "kerTmzDMqUB",
            records: null,
            visibleRecords: null
        }, {
            title: "Overweight",
            dataElementId: "l0WWFNEMoQZ",
            records: null,
            visibleRecords: null
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

    //side nav
    ctrl.toggleRightNav = function () {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('right')
            .toggle();
    }

    //end of side nav

    //load orgUnits
    ctrl.fetchOrgUnits = function (callback) {
        var ouDb = $fdb.db('dnms').collection("ous");
        ouDb.load(function (err, tableStats, metaStats) {
            if (!err && tableStats.foundData && tableStats.rowCount > 0) {
                console.log("loaded cached org tree successfully");
                debugDb = ouDb;
                callback(ouDb.find());
            } else {
                orgUnitsService.getOrgTree().then(function (orgUnits) {
                    callback(orgUnits);
                    ouDb.insert(orgUnits);
                    ouDb.save(function (err) {
                        if (!err) {
                            console.info("org tree saved to the cache");
                        } else {
                            console.error("error saving org tree to the cache");
                        }
                    })
                });
            }
        });

    }

    ctrl.fetchOrgUnits(function (orgUnits) {
        var tis = this;
        this.recursiveCollapse = function (node) {
            node.collapsed = true;
            if (node.children) {
                node.children.forEach(function (child) {
                    tis.recursiveCollapse(child);
                })

                //remove children temporary to avoid ng-repeat lag
                node.childrenTemp = node.children;
                node.children = undefined;
            }
        }

        ctrl.orgTree = orgUnits;
        this.recursiveCollapse(ctrl.orgTree[0]);

        var orgTreeObj = $scope["orgTree"];
        orgTreeObj.selectNodeHead = function (selectedNode) {
            //Collapse or Expand
            selectedNode.collapsed = !selectedNode.collapsed;

            if (!selectedNode.collapsed && selectedNode.childrenTemp) {
                selectedNode.children = selectedNode.childrenTemp;
            }
        };

        orgTreeObj.selectNodeLabel = function (selectedNode) {

            //remove highlight from previous node
            if (orgTreeObj.currentNode && orgTreeObj.currentNode.selected) {
                orgTreeObj.currentNode.selected = undefined;
            }

            //set highlight to selected node
            selectedNode.selected = 'selected';

            //set currentNode
            orgTreeObj.currentNode = selectedNode;
            ctrl.currentOuSelection = selectedNode;

            ctrl.refreshMalNulStats(selectedNode);
        };

        //init selection
        orgTreeObj.selectNodeLabel(ctrl.orgTree[0]);
    });

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
                    //event id is the only thing that matter
                    data.rows.forEach(function (row) {
                        malNut.records.push({
                            eventId: row[0],
                            ou: row[7]
                        });
                    });
                    malNut.selectedRecords = malNut.records;
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

    ctrl.refreshMalNulStats = function (selectedNode) {
        if (ctrl.caches.malNut != CAHCE_STATUS.loaded) {//do only if cache is ready, else ignore
            return;
        }
        //filtering data
        console.log("Selected node", selectedNode);
        var worker = new Worker("js/app/workers/childou.js");
        worker.postMessage([ctrl.malNutReasons, selectedNode]);
        worker.onmessage = function (e) {
            ctrl.malNutReasons = e.data;
            $scope.$apply();
            console.log(ctrl.malNutReasons);
        }
    }

    ctrl.showMalNutTeis = function (malNutReason) {
        ctrl.selectedMalNul = malNutReason;
        ctrl.malNutInfiniteItems.reset();
    };

    ctrl.malNutInfiniteItems = {
        teis: [],
        numLoaded_: 0,
        toLoad_: 0,
        // Required.
        reset: function () {
            this.teis = [];
            this.numLoaded_ = 0;
            this.toLoad_ = ctrl.selectedMalNul.selectedRecords.length;
        },

        getItemAtIndex: function (index) {
            if (index >= this.numLoaded_ || !ctrl.doneInitLoading) {
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
            if (this.toLoad_ - 1 >= index) {
                var loadCount = 0;
                while (loadCount < 25 && index < ctrl.selectedMalNul.selectedRecords.length) {
                    console.log(index);
                    var eventId = ctrl.selectedMalNul.selectedRecords[index].eventId;
                    var event = ctrl.eventsDb.find({event: eventId});
                    if (event.length > 0) {
                        var teiId = event[0].trackedEntityInstance;
                        var teiArr = ctrl.teiDb.find({_id: teiId});
                        if (teiArr.length > 0) {
                            tis.teis.push(teiArr[0]);
                        }
                    } else {
                        console.log("Unexpecetd events length");
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