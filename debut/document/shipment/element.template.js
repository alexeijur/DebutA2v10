// Отгрузка - шаблон документа

const utils = require('std:utils');

const template = {
    properties: {
        "TRow.$Price"() { return this.Price + this.VPrice; },
        "TRow.$Sum"() { return this.TPriceUnround * this.Qty; },
        "TRow.Sum"() { return +(this.PriceUnround * this.Qty).toFixed(2); },
        "TRow.VSum"() { return +(this.$Sum - this.Sum).toFixed(2); },
        // сколько останется, если отгрузить этот документ
        "TRow.$QtyRem"() { return this.QtyDoc - this.QtyShipped - this.Qty;},
        "TDocument.$Sum"() { return this.Rows.reduce((p, c) => p + c.$Sum, 0); },
        "TDocument.Sum"() { return this.Rows.reduce((p, c) => p + c.Sum, 0); },
        "TDocument.VSum"() { return +(this.$Sum - this.Sum).toFixed(2); },
        "TDocument.$ApplyVisible"() { return !this.Done; },
        "TBaseDoc.$Name": getBaseDocName
    },
    validators: {
        "Document.Rows[].Qty": {valid: validQty}
    },
    commands: {
        deleteMe,
        apply: {
            saveRequired : true,
            canExec: canApply,
            exec: apply,
            confirm: {
                msg: "Подтвердить отгрузку заказа",
                title: "Подтвержнение отгрузки заказа",
                okText: "Подтвердить и провести"
            }
        },
        unapply: {
            canExec: canUnApply,
            exec: unapply,
            confirm: {
                msg: "Отменить отгрузку заказа",
                title: "Отмена проведения отгрузки",
                okText: "Отменить проведение"
            }
        }
    }
};

function validQty(row) {
    let maxQty = row.QtyDoc - row.QtyShipped;
    if (row.Qty <= 0)
        return 'Кол-во не может быть отрицательным и нулевым';
    if (row.Qty <= maxQty)
        return true;
    return `Можно отгрузить не более ${maxQty}`;
}

async function deleteMe(doc) {
    const vm = this.$vm;
    let result = await vm.$invoke('deleteDocument', { Id: doc.Id });
    vm.$close();
}

function canApply(doc) {
    return !doc.Done;
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

function getBaseDocName() {
    return `№ ${this.SNo} ${utils.format(this.Date, 'Date')} Сумма: ${utils.format(this.Sum, 'Currency')}`;
}

module.exports = template;
