/**
 * Created by chath on 9/11/2016.
 */
function SettingsController(teiService, settingsService, toastService) {
    var sctrl = this;
    this.settings = {};

    sctrl.teiAttributes = [];
    sctrl.selectedAttribute = undefined;

    sctrl.loadTeiAttributes = function () {
        teiService.getAllTeiAttributes().then(function (teiAttributes) {
            sctrl.teiAttributes = teiAttributes;
            if (sctrl.settings.teiAttributesOrder) {
                sctrl.teiAttributes.sort(function (a, b) {
                    return sctrl.settings.teiAttributesOrder.indexOf(a.id) - sctrl.settings.teiAttributesOrder.indexOf(b.id);
                });
            }
        });
    }

    settingsService.teiAttributes.get().then(function (teiAtts) {
        console.log(teiAtts);
        sctrl.settings.teiAttributesOrder = teiAtts;
        sctrl.loadTeiAttributes();
    }, function (response) {
        sctrl.loadTeiAttributes();
    });

    sctrl.saveTeiAttOrder = function () {
        var teiOrder = [];
        sctrl.teiAttributes.forEach(function (teiAtt) {
            teiOrder.push(teiAtt.id);
        });

        settingsService.teiAttributes.save(teiOrder).then(function () {
            toastService.showToast("Attributes order saved.")
        });
    }

}