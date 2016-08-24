/**
 * Created by chath on 8/22/2016.
 */
onmessage = function (e) {
    var orgTree = e.data[0];
    recursiveCollapse(orgTree);
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