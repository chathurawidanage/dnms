/**
 * @author Chathura Widanage
 */
function ProfileController($location, appService, teiService, $routeParams, toastService,
                           programService, dataElementService, programIndicatorsService, $q, $mdDialog, $mdSidenav,
                           eventService, enrollmentService) {
    var ctrl = this;
    this.tei = $routeParams.tei;
    this.teiObj = null;
    this.programId = $routeParams.program;
    this.program = {};
    this.teiAttributes = [];
    this.attributes = [];
    this.events = [];

    this.dataElemets = [];

    this.selectedEvent = {};

    this.knownProgramStages = {
        riskMonitoring: "vTWcDsFE1rf",
        registration: "FyR0ymIDsoA",
        nutritionMonitoring: "wS2i9c9hXXz"
    }

    this.childProfile = {
        firstName: {key: "izuwkaOUgFg", value: null},
        lastName: {key: "C8DBAo2wEYN", value: null},
        chdrNumber: {key: "WqdldQpOIxm", value: null}
    }

    ctrl.locationCache = null;
    ctrl.getLocation = function () {
        if (ctrl.locationCache) {
            return ctrl.locationCache;
        }
        ctrl.events.forEach(function (ev) {
            if (ev.programStage == ctrl.knownProgramStages.registration && ev.coordinate) {
                ctrl.locationCache = "[" + ev.coordinate.latitude + "," + ev.coordinate.longitude + "]";
                console.log(ctrl.locationCache);
                return ctrl.locationCache;
            }
        });

        return false;
    }

    ctrl.deleteTei = function (ev) {
        toastService.showConfirm(
            'Do you really want to delete this profile?',
            'This action will delete all events and data related to this child.',
            'Please do it!',
            "Don't delete",
            function () {
                teiService.deleteTei(ctrl.tei).then(function (response) {
                    if (response.status == 204) {
                        //ctrl.navBack();
                    } else {
                        toastService.showToast("An error occurred while trying to delete this profile. Please retry.");
                    }
                })
            },
            function () {
                //do nothing
            }
        );
    }

    ctrl.unenrollTei = function () {
        toastService.showConfirm(
            'Do you really want to unenroll this child?',
            'This action will not delete any data, but will exclude this child from report and dashboard.',
            'Please do it!',
            "Don't unenroll",
            function () {
                enrollmentService.unenrollTei(ctrl.tei, ctrl.programId).then(function (response) {
                    if (response.status == 200) {
                        toastService.showToast("Child unenrolled successfully.");
                    } else {
                        console.log(response);
                        toastService.showToast("Failed to unenroll the child. Please retry.");
                    }
                },function (err) {
                    toastService.showToast("Failed to unenroll the child due to a network failure.");
                });
            },
            function () {
                //do nothing
            }
        );
    }

    ctrl.deleteEvent = function (event, index) {
        toastService.showConfirm(
            'Do you really want to delete this event?',
            'This action will delete all data recorded in this event.',
            'Please do it!',
            "Don't delete",
            function () {
                eventService.deleteEvent(event).then(function (response) {
                    console.log(response);
                    if (response.httpStatusCode == 200) {
                        toastService.showToast("Event deleted.");
                        ctrl.events.splice(index, 1);
                        console.log("deleted");
                    } else {
                        toastService.showToast("An error occurred while trying to delete this profile. Please retry.")
                    }
                },function (err) {
                    toastService.showToast("Delete operation was not successful due to a network failure.");
                })
            },
            function () {
                //do nothing
            }
        );
    }

    ctrl.openNav = function () {
        $mdSidenav('left').open();
    }
    ctrl.closeNav = function () {
        $mdSidenav('left').close();
        ctrl.selectedEvent = null;
    }

    /**
     * mark event as compete or active
     * @param reverse true will make event active, false will mark as completed
     */
    ctrl.completeEvent = function (reverse) {
        if (ctrl.selectedEvent) {
            eventService.completeEvent(ctrl.selectedEvent, reverse).then(function (response) {
                if (response.httpStatusCode == 200) {
                    if (reverse) {
                        toastService.showToast("Successfully reopened event.");
                    } else {
                        toastService.showToast("Successfully marked as reviewed.");
                    }
                } else {
                    console.log(response);
                    toastService.showToast("Error occurred. Event status not changed.");
                    ctrl.selectedEvent.status = "ACTIVE";
                    if (reverse) {
                        ctrl.selectedEvent.status = "COMPLETED";
                    }
                }
            },function (err) {
                toastService.showToast("Network failure occurred. Event status not changed.");
            });
        }
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
        ctrl.teiAttributes = [];
        teiAttributes.forEach(function (att) {
            ctrl.teiAttributes[att.id] = att;
        });

        console.log("tei all attributes loaded", ctrl.teiAttributes);
    }).then(function () {
        console.log("Loading attributes of ", ctrl.tei);
        teiService.getTeiById(ctrl.tei).then(function (tei) {
            ctrl.teiObj = tei;

            //filling known attributes
            var knownAtts = Object.keys(ctrl.childProfile);
            console.log("Attributes", ctrl.teiObj.attributes);
            ctrl.teiObj.attributes.forEach(function (attr) {
                knownAtts.forEach(function (knownAtt) {
                    if (!ctrl.childProfile[knownAtt].value && ctrl.childProfile[knownAtt].key == attr.attribute) {
                        ctrl.childProfile[knownAtt].value = attr.value;
                    }
                });

                //convert date strings to date objects to make them editable with dn-datepicker
                if (attr.valueType == "DATE") {
                    attr.value = new Date(attr.value);
                }
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
                    event.badgeIcon = "insert_chart";//nut monitoring
                    if (event.programStage == ctrl.knownProgramStages.registration) {
                        event.badgeIcon = "person_pin";
                    } else if (event.programStage == ctrl.knownProgramStages.riskMonitoring) {
                        event.badgeIcon = "child_care";
                    }

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
                events.sort(function (a, b) {
                    var dateA = new Date(a.eventDate);
                    var dateB = new Date(b.eventDate);
                    //giving priority for registration
                    if (a.programStage == ctrl.knownProgramStages.registration) {
                        return -1;
                    } else if (b.programStage == ctrl.knownProgramStages.registration) {
                        return 1;
                    }
                    //sort normally
                    return dateA.getTime() - dateB.getTime();
                });

                ctrl.events = events;
                console.log("events loaded", events);
            });
        })
    });

    ctrl.updateDataValue = function (dataValue) {
        eventService.updateEventData(ctrl.selectedEvent, dataValue).then(function (data) {
            if (data.httpStatusCode == 200) {
                console.log(dataValue, ctrl.getDataElement(dataValue.dataElement));
                toastService.showToast(ctrl.getDataElement(dataValue.dataElement).displayName + " updated to " + dataValue.value);
            } else {
                console.log(dataValue, ctrl.getDataElement(dataValue.dataElement));
                toastService.showToast(ctrl.getDataElement("Something went wrong when updating " + dataValue.dataElement).displayName);
            }
        })
    }

    ctrl.updateTei = function () {
        //re encoding date objects
        var teiObj = angular.copy(ctrl.teiObj);
        teiObj.attributes.forEach(function (attr) {
            if (attr.valueType == "DATE") {
                attr.value = attr.value.toISOString().substring(0, 10);
            }
        });

        teiService.updateTei(teiObj).then(function (data) {
            if (data.httpStatusCode == 200) {
                toastService.showToast("Changes Saved.");
            } else {
                toastService.showToast(ctrl.getDataElement("Error occurred while saving changes."));
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

    ctrl.debug = function (print) {
        console.log(print);
    }

    /**
     *
     * @param dataElementId
     * @returns {string}
     */
    ctrl.getHeightWeightBackgroundColorClass = function (dataElementId) {
        var heightWeightDe = {
            height: "Bpovp931fOZ",
            weight: "jRceYOPJeCO"
        }
        var height = false;
        if (dataElementId == heightWeightDe.height) {
            height = true;
        } else if (dataElementId != heightWeightDe.weight) {
            console.log("return");
            return "";//no color
        }

        var categoryIds = {
            heightCat: {
                id: "bYTh3TBpAFF"
            },
            weightCat: {
                id: "qh8ptEnFWmp"
            }
        }

        ctrl.selectedEvent.dataValues.forEach(function (dv) {
            if (dv.dataElement == categoryIds.heightCat.id) {
                categoryIds.heightCat.value = dv.value;
            } else if (dv.dataElement == categoryIds.weightCat.id) {
                categoryIds.weightCat.value = dv.value;
            }
        });


        var getColor = function (value) {
            switch (value) {
                case "More than 2 SD":
                    return "purple";
                case "Between -1SD to +2SD" :
                    return "green";
                case "Between -1SD to -2SD":
                    return "light-green";
                case "Between -2SD to -3SD":
                    return "orange";
                case "Less than -3SD":
                    return "red";
            }
        }


        /*< -3 SD : Red
         -2 SD to -3 SD : Orange
         -1 SD to -2 SD : light green
         +2 SD to -1 SD : green
         >+2 SD : Purple*/

        if (height) {
            return getColor(categoryIds.heightCat.value);
        } else {
            return getColor(categoryIds.weightCat.value);
        }
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