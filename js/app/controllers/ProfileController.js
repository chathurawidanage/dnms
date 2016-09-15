/**
 * @author Chathura Widanage
 */
function ProfileController($location, appService, teiService, $routeParams, toastService,
                           programService, dataElementService, programIndicatorsService, $q, $mdDialog, $mdSidenav,
                           eventService, enrollmentService, $fdb, userService, settingsService, sdCategoryService) {
    var ctrl = this;
    this.tei = $routeParams.tei;
    this.teiObj = null;
    this.programId = $routeParams.program;
    this.program = {};
    this.teiAttributes = [];
    this.attributes = [];
    this.events = [];

    this.dataElemets = $fdb.db('dnms').collection("dataelements");

    this.selectedEvent = {};

    this.knownProgramStages = {
        riskMonitoring: "vTWcDsFE1rf",
        registration: "FyR0ymIDsoA",
        nutritionMonitoring: "wS2i9c9hXXz"
    }

    this.childProfile = {
        firstName: {key: "izuwkaOUgFg", value: null},
        lastName: {key: "C8DBAo2wEYN", value: null},
        chdrNumber: {key: "WqdldQpOIxm", value: null},
        dob: {key: "AtK3fDqU8uu", value: null},
        gender: {key: "BZEpuufLyDE", value: null}
    }

    this.knownDataElements = {
        weight: "jRceYOPJeCO",
        height: "Bpovp931fOZ",
        weightCategory: "qh8ptEnFWmp",
        heightCategory: "bYTh3TBpAFF",
        weightHeightCategory: "RGmYXRckjv0",
        ageOfChildInMonths: "GDhOcklahIq"
    }

    this.hidenDataElements=["GDhOcklahIq","RGmYXRckjv0","bYTh3TBpAFF","qh8ptEnFWmp"];

    this.user;

    userService.getCurrentUser().then(function (user) {
        ctrl.user = user;
    })

    ctrl.locationCache = null;
    ctrl.getLocation = function () {
        if (ctrl.locationCache) {
            return ctrl.locationCache;
        }
        ctrl.events.forEach(function (ev) {
            if (ev.programStage == ctrl.knownProgramStages.registration && ev.coordinate) {
                var lat = ev.coordinate.latitude;
                var lon = ev.coordinate.longitude;

                var latUp = 9.88;
                var lonLeft = 79.3;
                var latDown = 5.56;
                var lonRight = 82.4;

                if (lat > latDown && lat < latUp && lon > lonLeft && lon < lonRight) {
                    ctrl.locationCache = ev.coordinate.latitude + "," + ev.coordinate.longitude;
                    console.log("Location", ctrl.locationCache);
                    return ctrl.locationCache;
                } else {
                    return false;
                }
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
                }, function (err) {
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
                }, function (err) {
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
     * User levels above MOH user are considered as elevated in this context
     * @returns {*|boolean}
     */
    ctrl.isElevatedUser = function () {
        return userService.hasRole(userService.MOH_USER);
    }

    /**
     * mark event as compete or active
     * @param reverse true will make event active, false will mark as completed
     */
    ctrl.completeEvent = function (reverse) {
        //todo make changes to local cache as well
        if (ctrl.selectedEvent) {
            eventService.completeEvent(ctrl.selectedEvent, reverse).then(function (response) {
                toastService.showToast(response);
            }, function (msg) {
                toastService.showToast(msg);
            });
        }
    }

    ctrl.showEvent = function (event) {
        //check for known attributes which are used to generate SD categories
        if (ctrl.childProfile.dob.value == null) {
            toastService.showToast("Date of Birth of this child is invalid. Please set it correctly to proceed.");
            return;
        } else if (ctrl.childProfile.gender.value == null) {
            toastService.showToast("Gender of this child is invalid. Please set it correctly to proceed.");
            return;
        }
        ctrl.openNav();
        ctrl.selectedEvent = event;
    }

    ctrl.getDataElement = function (dataElementId) {
        if (dataElementId) {
//            console.log(ctrl.dataElemets.find({id: dataElementId})[0], dataElementId);
            var de = ctrl.dataElemets.find({id: dataElementId})[0];
            return de;
        } else {
            return null;
        }
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
            var teiObjAttributesIds = [];
            ctrl.teiObj.attributes.forEach(function (attr) {
                teiObjAttributesIds.push(attr.attribute);
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
            //fill other attributes
            Object.keys(ctrl.teiAttributes).forEach(function (attId) {
                if (teiObjAttributesIds.indexOf(attId) < 0) {
                    var newAttribute = ctrl.teiAttributes[attId]
                    ctrl.teiObj.attributes.push({
                        attribute: newAttribute.id,
                        displayName: newAttribute.displayName,
                        valueType: newAttribute.valueType,
                        newAttribute: true
                    });
                }
            });

            //ordering attributes
            settingsService.teiAttributes.get().then(function (teiAttOrder) {
                console.log("TEI ATT ORDER", teiAttOrder);
                ctrl.teiObj.attributes.sort(function (a, b) {
                    return teiAttOrder.indexOf(a.attribute) - teiAttOrder.indexOf(b.attribute);
                });
            });

            console.log(ctrl.childProfile);
        });
    }).then(function () {
        console.log("loading program data");
        programService.getProgramById(ctrl.programId).then(function (program) {
            ctrl.program = program;
            console.log("loaded program", program);
            //Mapping data elements & program stages
            console.log("data elements", ctrl.dataElemets);
            ctrl.program.programStages.forEach(function (programStage) {
                programStage.programStageDataElements.forEach(function (pStateDataElement) {
                    var de = pStateDataElement.dataElement;
                    de.programStage = programStage.id;
                    ctrl.dataElemets.insert(de);
                    //ctrl.dataElemets[pStateDataElement.dataElement.id] = pStateDataElement.dataElement;
                })
            });
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

                    //add missing datavalues to event
                    var eventAllDataValues = ctrl.dataElemets.find({programStage: event.programStage});
                    var availableDataValues = [];
                    event.dataValues.forEach(function (dv) {
                        availableDataValues.push(dv.dataElement);
                    });

                    eventAllDataValues.forEach(function (de) {
                        if (availableDataValues.indexOf(de.id) < 0) {
                            event.dataValues.push({
                                dataElement: de.id
                            });
                        }
                    });


                    //soring riskMonitoring Program Stage
                    if (event.programStage == ctrl.knownProgramStages.riskMonitoring) {
                        event.dataValues.sort(function (risk1, risk2) {
                            var risk1DE = ctrl.dataElemets.find({id: risk1.dataElement})[0].displayName;
                            var risk2DE = ctrl.dataElemets.find({id: risk2.dataElement})[0].displayName;
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
        });

        console.log(ctrl.selectedEvent);

        //updating categories in nutrition monitoring
        if (ctrl.selectedEvent.programStage == ctrl.knownProgramStages.nutritionMonitoring) {
            if (ctrl.knownDataElements.height == dataValue.dataElement || ctrl.knownDataElements.weight == dataValue.dataElement) {
                var deIdDataValueMap = [];
                var male = ctrl.childProfile.gender.value != "female";
                var ageInMonths = (new Date(ctrl.selectedEvent.eventDate) - new Date(ctrl.childProfile.dob.value)) / (1000 * 60 * 60 * 24 * 30);
                ctrl.selectedEvent.dataValues.forEach(function (dv) {
                    deIdDataValueMap[dv.dataElement] = dv;
                });
                /*Updating height weight category*/
                var heightWeightCategory = sdCategoryService.getHeightWeightCategory(male, ageInMonths,
                    deIdDataValueMap[ctrl.knownDataElements.height].value,
                    deIdDataValueMap[ctrl.knownDataElements.weight].value);
                //update only if different
                if (deIdDataValueMap[ctrl.knownDataElements.weightHeightCategory].value != heightWeightCategory.code) {
                    deIdDataValueMap[ctrl.knownDataElements.weightHeightCategory].value = heightWeightCategory.code;
                    ctrl.updateDataValue(deIdDataValueMap[ctrl.knownDataElements.weightHeightCategory]);
                }

                /*Updating Height Category*/
                if (ctrl.knownDataElements.height == dataValue.dataElement) {
                    var heightCategory = sdCategoryService.getHeightCategory(male, ageInMonths, deIdDataValueMap[ctrl.knownDataElements.height].value);
                    if (deIdDataValueMap[ctrl.knownDataElements.heightCategory].value != heightCategory.code) {
                        deIdDataValueMap[ctrl.knownDataElements.heightCategory].value = heightCategory.code
                        ctrl.updateDataValue(deIdDataValueMap[ctrl.knownDataElements.heightCategory]);
                    }
                } else if (ctrl.knownDataElements.weight == dataValue.dataElement) {
                    var weightCategory = sdCategoryService.getWeightCategory(male, ageInMonths, deIdDataValueMap[ctrl.knownDataElements.weight].value);
                    if (deIdDataValueMap[ctrl.knownDataElements.weightCategory].value != weightCategory.code) {
                        deIdDataValueMap[ctrl.knownDataElements.weightCategory].value = weightCategory.code
                        ctrl.updateDataValue(deIdDataValueMap[ctrl.knownDataElements.weightCategory]);
                    }
                }
            }
        }

    }

    ctrl.updateTei = function () {
        //re encoding date objects & newAttributes to known format
        var teiObj = angular.copy(ctrl.teiObj);
        teiObj.attributes.forEach(function (attr) {
            if (attr.newAttribute) {
                delete attr.newAttribute;
                delete attr.id;
            }

            if (attr.value && attr.valueType == "DATE") {
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
     * @param dataValue
     * @returns {string}
     */
    ctrl.getHeightWeightBackgroundColorClass = function (dataValue) {
        var male = ctrl.childProfile.gender.value != "female";
        var ageInMonths = (new Date(ctrl.selectedEvent.eventDate).getTime() - new Date(ctrl.childProfile.dob.value).getTime()) / (1000 * 60 * 60 * 24 * 30);


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
        if (dataValue.dataElement == ctrl.knownDataElements.height) {
            return getColor(sdCategoryService.getHeightCategory(male, ageInMonths, dataValue.value).code);
        } else if (dataValue.dataElement == ctrl.knownDataElements.weight) {
            return getColor(sdCategoryService.getWeightCategory(male, ageInMonths, dataValue.value).code);
        } else {
            return "";
        }
        /*< -3 SD : Red
         -2 SD to -3 SD : Orange
         -1 SD to -2 SD : light green
         +2 SD to -1 SD : green
         >+2 SD : Purple*/
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