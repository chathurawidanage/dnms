/**
 * Created by chath on 9/1/2016.
 */
function TeiListController(teiService, $controller, $scope, $fdb) {
    var tctrl = this;

    tctrl.cardTitle = "";
    //DashboardController.apply(ctrl);
    teiService.addObserver(function () {
        tctrl.infiniteItems.reset();
        tctrl.cardTitle = teiService.teiListTitle;
    });

    tctrl.keyword = "";

    tctrl.refreshList = function (event) {
        if (event.keyCode == 13) {
            tctrl.infiniteItems.reset();
        }
    }

    tctrl.infiniteItems = {
        teis: [],
        currentPage: 1,
        numLoaded_: 0,
        regex: undefined,
        allLoaded: false,
        // Required.
        reset: function () {
            this.teis = [];
            this.currentPage = 0;
            this.numLoaded_ = -1;
            this.allLoaded=false;
            this.regex = new RegExp(tctrl.keyword, "i");
        },

        getItemAtIndex: function (index) {
            if (!this.allLoaded && index >= this.numLoaded_) {
                this.fetchMoreItems_();
                return null;
            }
            return this.teis[index];
        },

        getLength: function () {
            return this.numLoaded_ + 5;
        },
        fetchMoreItems_: function () {
            var results = teiService.teiSearchFunction(this.regex, this.currentPage, 50);
            if (!results) {
                this.allLoaded = true;
                return;
            }
            this.teis = this.teis.concat(results);
            this.currentPage++;
            this.numLoaded_ = this.teis.length;
        }
    };
}