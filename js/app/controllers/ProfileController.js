/**
 * @author Chathura Widanage
 */
function ProfileController($location, appService, teiService, $routeParams, toastService,
                           programService, dataElementService, programIndicatorsService, $q, $scope, $mdSidenav, eventService) {
    var ctrl = this;
    this.tei = $routeParams.tei;
    this.programId = $routeParams.program;
    this.program = {};
    this.teiAttributes = [];
    this.attributes = [];
    this.events = [];

    this.dataElemets = [];

    this.selectedEvent = {};

    this.knownProgramStages = {
        riskMonitoring: "vTWcDsFE1rf"
    }

    this.childProfile = {
        firstName: {key: "izuwkaOUgFg", value: null},
        lastName: {key: "C8DBAo2wEYN", value: null},
        chdrNumber: {key: "WqdldQpOIxm", value: null}
    }

    ctrl.openNav = function () {
        $mdSidenav('left').open();
    }
    ctrl.closeNav = function () {
        $mdSidenav('left').close();
    }

    ctrl.showEvent = function (event) {
        ctrl.openNav();
        ctrl.selectedEvent = event;
        console.log(event);
    }

    ctrl.getDataElement = function (dataElementId) {
        return ctrl.dataElemets[dataElementId];
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

            console.log("data elements", ctrl.dataElemets);
        }).then(function () {
            console.log("loading events for tei");
            var romanToHindu = function (roman) {
                switch (roman.trim()) {
                    case "i":
                        return 1;
                    case "ii":
                        return 2;
                    case "iii":
                        return 3;
                    case "iv":
                        return 4;
                    case "v":
                        return 5;
                    case "vi":
                        return 6;
                    case "vii":
                        return 7;
                    case "viii":
                        return 8;
                    case "ix":
                        return 9;
                    case "x":
                        return 10;
                    default:
                        return -1;
                }
            }
            teiService.getEventData(ctrl.tei, ctrl.programId).then(function (events) {
                events.forEach(function (event) {
                    event.badgeIcon = "insert_chart";
                    event.badgeClass = "success";
                    event.title = ctrl.getProgramStageById(event.programStage).displayName;
                    event.content = new Date(event.eventDate).toDateString();


                    //soring riskMonitoring Program Stage
                    if (event.programStage == ctrl.knownProgramStages.riskMonitoring) {
                        event.dataValues.sort(function (risk1, risk2) {
                            var risk1DE = ctrl.dataElemets[risk1.dataElement].displayName;
                            var risk2DE = ctrl.dataElemets[risk2.dataElement].displayName;
                            var risk1DESplit = risk1DE.split(".");
                            var risk2DESplit = risk2DE.split(".");

                            if (risk1DESplit[0].trim().localeCompare(risk2DESplit[0].trim()) == 0) {
                                return romanToHindu(risk1DESplit[1]) - romanToHindu(risk2DESplit[1]);
                            } else {
                                return risk1DESplit[0].trim().localeCompare(risk2DESplit[0].trim());
                            }

                        });
                    }
                })
                ctrl.events = events.reverse();
                console.log("events loaded", events);
            });
        })
    });

    ctrl.updateDataValue = function (dataValue) {
        eventService.updateEventData(ctrl.selectedEvent, dataValue).then(function (data) {
            if (data.httpStatusCode == 200) {
                console.log(dataValue,ctrl.getDataElement(dataValue.dataElement));
                toastService.showToast(ctrl.getDataElement(dataValue.dataElement).displayName + " updated to " + dataValue.value);
            }else{
                console.log(dataValue,ctrl.getDataElement(dataValue.dataElement));
                toastService.showToast(ctrl.getDataElement("Something went wrong when updating "+dataValue.dataElement).displayName);
            }
        })
    }


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
        window.close();
    }

    ctrl.debug=function (print) {
        console.log(print);
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