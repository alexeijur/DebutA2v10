/*waybillin template*/

// common module
//const cmn = require('document/common');
const localProperties = {
    "TDocument.$Shipment": getShipmentW
}

const template = {
    properties: {
        //'TRow.Sum': cmn.rowSum,
        //'TDocument.Sum': cmn.docTotalSum
        "TDocument.$ApplyVisible"() { return !this.Done; },
    },
    delegates: {
        'FetchAgents': fetchAgents,
        'FetchEntity': fetchEntity
    },
    validators: {
        'Document.Agent': 'Выберите поставщика'
        //'Document.DepTo': 'Выберите склад'
    },
    commands: {
        deleteMe,
        apply: {
            saveRequired: true,
            canExec: canApply,
            exec: apply,
            confirm: {
                msg: "Подтвердить доверенность",
                title: "Подтвержнение доверенности",
                okText: "Подтвердить и провести"
            }
        },
        unapply: {
            canExec: canUnApply,
            exec: unapply,
            confirm: {
                msg: "Отменить доверенность",
                title: "Отмена доверенности",
                okText: "Отменить проведение"
            }
        }
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

async function deleteMe(doc) {
    const vm = this.$vm;
    let result = await vm.$invoke('deleteDocument', { Id: doc.Id });
    vm.$close();
}
async function apply(doc) {
    const vm = doc.$vm;
    await vm.$invoke('apply', { Id: doc.Id });
    vm.$requery();
}

function canUnApply(doc) {
    return doc.Done && !doc.HasLinkDocs;
}

async function unapply(doc) {
    const vm = doc.$vm;
    await vm.$invoke('unapply', { Id: doc.Id });
    vm.$requery();
}

function canApply(doc) {
    return !doc.Done;
}

function getShipmentW() {
    const doc = this;
    // все склады, которые есть в строках документа
    let wars = [];
    doc.Shipment.forEach(row => {
        //const whId = row.Warehouse.Id;
        //if (!whId) return;
        //if (wars.find(w => w.Warehouse.Id === whId)) return;
        //let item = {
        //    Warehouse: row.Warehouse,
        //    // все документы по заданному складу
            LinkedDocuments: doc.Shipment//.filter(d => d.Warehouse.Id === whId)
        //};
        utils.defineProperty(item, "TotalSum", function () {
           return this.LinkedDocuments.reduce((p, c) => p + c.Sum, 0);
        });
        utils.defineProperty(item, "TotalRem", function () {
            let totalSum = doc.Rows
                //.filter(v => v.Warehouse.Id === whId)
                .reduce((p, c) => p + c.Sum + c.VSum, 0);
            return totalSum - this.TotalSum;
        });
        utils.defineProperty(item, "HasRem", function () {
            return this.TotalRem > 1e-4 && doc.Done;
        });
        //console.dir(item.TotalSum);
        wars.push(item);
    });
    return wars;
}