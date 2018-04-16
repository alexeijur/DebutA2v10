let currentPriceKindId = 0;

module.exports = {
    properties: {
        "TEntity.Price": getEntityPrice,
        "TEntity.PriceScale": getEntityPriceScale,
        "TEntity.$HasPrices"() {return this.Prices && this.Prices.length;}
    },
    events: {
        "Model.load": onload,
        "Entities[].Qty.change": qtyChange
    }
};

function getEntityPrice() {
    const ent = this;
    const prices = ent.Prices;
    if (!prices.length)
        return undefined;
    if (prices.$selected)
        return ent.Prices.$selected.Price;
    let currPrice = prices.find((val) => val.PriceKind.Id === currentPriceKindId);
    if (!currPrice)
        currPrice = prices[0];
    currPrice.$select();
    return prices.$selected.Price;
}

function getEntityPriceScale() {
    const ent = this;
    const prices = ent.Prices;
    if (!prices.length)
        return undefined;
    return prices[prices.length - 1].Price.toFixed(2) + ' ↔ ' + prices[0].Price.toFixed(2);
}

function qtyChange(ent) {
    const caller = ent.$vm.$caller;
    let row;
    let pos = -1;
    const trg = caller.Document.Rows;
    // находим объект учёта в документе
    for (let i = 0; i < trg.length; i++) {
        if (trg[i].Entity.Id === ent.Id) {
            pos = i;
            break;
        }
    }
    if (ent.Qty > 0) {
        // добавляем в документ
        if (pos >= 0) {
            // Такой объект учёта уже есть в документе
            row = trg[pos];
        } else {
            // Такого объекта учёта нет - добавляем
            row = trg.$append();
            row.Entity = ent;
            row.FUnits = ent.FUnits;
            rowsAdded(trg, row);
        }
        row.BasePrice = ent.Price;
        row.Qty = ent.Qty;
        row.QtyRem = ent.Rem;
        if (!ent.Warehouse.$isEmpty) {
            row.Warehouse = ent.Warehouse;
        }
    } else {
        // удаляем из документа
        if (pos >= 0) {
            row = trg[pos];
            vm.$remove(row);
        }
    }
}

function rowsAdded(array, row) {
    var ix = array.indexOf(row);
    if (ix === 0)
        return;
    /* наследуем значения из предыдущей строки */
    var prevRow = array[ix - 1];
    row.DeliveryOn = prevRow.DeliveryOn;
    if (row.Warehouse.$isEmpty && !prevRow.Warehouse.$isEmpty)
        row.Warehouse = prevRow.Warehouse;
}

function onload(root) {
    const caller = root.$vm.$caller;
    if (!caller)
        return;
    if (!caller.Document)
        return;
    const contract = caller.Document.Contract;
    currentPriceKindId = contract.PriceKind.Id || 0;
}

