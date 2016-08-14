/**
 * @author Chathura Widanage
 */
function ProfileController($location, appService, teiService, $routeParams, toastService,
                           programService, dataElementService, programIndicatorsService, $q, $scope) {
    var ctrl = this;
    this.tei = $routeParams.tei;
    this.programId = $routeParams.program;
    this.program = {};
    this.teiAttributes = [];
    this.attributes = [];
    this.events = [];

    this.dataElemets = [];

    this.childProfile = {
        firstName: {key: "izuwkaOUgFg", value: null},
        lastName: {key: "C8DBAo2wEYN", value: null},
        chdrNumber: {key: "WqdldQpOIxm", value: null}
    }

    teiService.getAllTeiAttributes().then(function (teiAttributes) {
        console.log("tei all attributes loaded");
        ctrl.teiAttributes = teiAttributes;
    }).then(function () {
        console.log("Loading attributes of ", ctrl.tei);
        teiService.getAllAttributesForTei(ctrl.tei).then(function (attributes) {
            console.log(attributes);
            ctrl.attributes = [];
            ctrl.attributes = attributes;

            //filling known attributes
            var knownAtts = Object.keys(ctrl.childProfile);
            console.log(knownAtts);
            ctrl.attributes.forEach(function (attr) {
                knownAtts.forEach(function (knownAtt) {
                    if (!ctrl.childProfile[knownAtt].value && ctrl.childProfile[knownAtt].key == attr.attribute) {
                        ctrl.childProfile[knownAtt].value = attr.value;
                    }
                })
            });
            console.log(ctrl.childProfile);
        });
    }).then(function () {
        console.log("loading program data");
        programService.getProgramById(ctrl.programId).then(function (program) {
            ctrl.program = program;
            console.log("loaded program", program);
            //Mapping data elements
            ctrl.program.programStages.forEach(function (programStage) {
                programStage.programStageDataElements.forEach(function (pStateDataElement) {
                    ctrl.dataElemets[pStateDataElement.dataElement.id] = pStateDataElement.dataElement;
                })
            });

            console.log("data elements",ctrl.dataElemets);
        }).then(function () {
            console.log("loading events for tei");
            teiService.getEventData(ctrl.tei, ctrl.programId).then(function (events) {
                var count = 0;
                events.forEach(function (event) {
                    event.badgeIcon = "insert_chart";
                    event.badgeClass = "success";
                    event.title = ctrl.getProgramStageById(event.programStage).displayName;
                    event.content = new Date(event.eventDate).toDateString();
                })
                ctrl.events = events.reverse();
                console.log("events loaded", events);
            });
        })
    });


    ctrl.getProgramStageById = function (programStageId) {
        var programStage = {
            displayName: "Unknown Program Stage"
        };
        ctrl.program.programStages.forEach(function (ps) {
            if (ps.id == programStageId) {
                programStage = ps;
            }
        });
        return programStage;
    };

    ctrl.navBack = function () {
        $location.path("/");
    }

    /*
     this.events = [
     {
     title: "test",
     content: "content",
     badgeIcon: "insert_chart",
     badgeClass: "success",
     side: "left"
     }, {
     title: "test",
     content: "content content content",
     badgeIcon: "add_alert",
     badgeClass: "warning",
     side: "right"
     }
     ]*/


}