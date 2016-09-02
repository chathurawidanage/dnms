/**
 * Created by chath on 9/2/2016.
 */
onmessage = function (e) {
    var params = e.data;
    console.log(params);

    var results = params.teiDb.find({
        $or: [
            {
                fName: params.tis.regex
            },
            {
                lName: params.tis.regex
            }
        ]
    }, {
        $page: prams.currentPage,
        $limit: params.limit
    })

    postMessage(results);
}