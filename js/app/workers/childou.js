/**
 * Created by chath on 8/20/2016.
 */
var levelFiveOrgs = [];
onmessage = function (e) {
    var malNulRecords = e.data[0];
    var selectedOrgUnit = e.data[1];
    console.log(selectedOrgUnit);
    getAllLevelFiveOrgUnits(selectedOrgUnit);
    malNulRecords.forEach(function (malNul) {
        malNul.selectedRecords=[];
        malNul.records && malNul.records.forEach(function (record) {
            if(levelFiveOrgs.indexOf(record.ou)>=0){
                malNul.selectedRecords.push(record);
            }
        })
    })
    postMessage(malNulRecords);
}

getAllLevelFiveOrgUnits = function (orgUnit) {
    if (orgUnit.level < 5) {
        if (orgUnit.childrenTemp) {
            orgUnit.childrenTemp.forEach(function (child) {
                getAllLevelFiveOrgUnits(child);
            })
        }
    } else {
        levelFiveOrgs.push(orgUnit.id);
    }
}