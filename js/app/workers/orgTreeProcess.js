/**
 * Created by chath on 8/22/2016.
 */
onmessage = function (e) {
    //console.log("Data", e.data);
    var orgTree = e.data;
    if (orgTree.length > 1) {
        var parent = orgTree[0].parent;
        parent.children = orgTree;
        orgTree = [parent];
    }

    orgTree.forEach(function (node) {
        recursiveCollapse(node);
    });

    postMessage(orgTree);
}

recursiveCollapse = function (node) {
    if (!node) {
        return;
    }
    node.collapsed = true;
    if (node.children) {//for a cached orgTree, loop will break here
        node.children.forEach(function (child) {
            recursiveCollapse(child);
        })

        //remove children temporary to avoid ng-repeat lag
        node.childrenTemp = node.children;
        node.children = undefined;
    }
}