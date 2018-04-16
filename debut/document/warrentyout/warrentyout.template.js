/*warrentyout template*/

// common module
//const cmn = require('document/common');
const localProperties = {
    //"TRow.$EntName": { get: get$EntName, set: set$EntName }
}
const template = {
    properties: {
        //'TRow.Sum': cmn.rowSum,
        //'TDocument.Sum': cmn.docTotalSum
    },
    delegates: {
        'FetchAgents': fetchAgents,
        'FetchEntity': fetchEntity
    },
    validators: {
        'Document.Agent': 'Выберите поставщика'
        //'Document.DepTo': 'Выберите склад'
    },
    events: {
        //'Model.load': modelLoad,
    }
};

module.exports = template;

function fetchAgents(position, text) {
    const vm = position.$vm;
    return vm.$invoke('getAgentSelector', { Text: text }, '/agent');
}

function fetchEntity(position, text) {
    const vm = position.$vm;
    return vm.$invoke('getEntitySelector', { Text: text }, '/entity');
}

//function modelLoad(root) {
//    if (root.Document.$isNew)
//        cmn.documentCreate(root.Document, 'warrentyin');
//    console.dir(root.Document);
//}
function get$EntName() {
    const row = this;
    return row.EntName && row.EntName.length > 0 ? row.EntName : row.Entity.Name;
}
function set$EntName(value) {
    const row = this;
    row.EntName = value;
}
