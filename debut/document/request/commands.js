/* команды */

module.exports = {
    clearBonusEPerson: clearBonusEPerson,
    browseBonusEPerson: browseBonusEPerson,
    showEntityInfo,
    fillARows : {
        exec: doFillARows,
        confirm: {
            message: "Заполнить (заново!) счёт-фактуру списком заказанного товара?",
            title: "Заполнение счёта-фактуры",
            okText: "Заполнить"
        }
    },
    fillEXRows: {
        exec: doFillEXRows,
        confirm: {
            message: "Заполнить списком заказанного товара?",
            title: "Заполнение перышения",
            okText: "Заполнить"
        }
    },
    sendToLogist,
    sortRows,
    createShipment,
//    setState,
    apply: {
        canExec: canApply,
        exec: apply,
        saveRequired: true,
        validRequired: true,
        /* Подтверждение. Строка или объект {msg: 'message', title: 'title', okText:"Ok", cancelText:"" } */
        confirm: {
            msg: "Подтвердить выполнение заказа",
            title: "Подтвержнение проведения заказа",
            okText: "Подтвердить и провести"
        }
    },
    unapply: {
        canExec: canUnApply,
        exec: unapply,
        confirm: {
            msg: "Отменить выполнение заказа",
            title: "Отмена проведения заказа",
            okText: "Отменить проведение"
        }
    },
    CopySelDoc: {
        canExec: canCopyDoc,
        exec: copyDoc,
        saveRequired: true,
        validRequired: true,
        /* Подтверждение. Строка или объект {msg: 'message', title: 'title', okText:"Ok", cancelText:"" } */
        confirm: {
            msg: "Подтвердить копирование выбранного документа?",
            title: "Подтвержнение копирования документа",
            okText: "Подтвердить и копировать"
        }
    },
    addComment: {
        canExec: canComment,
        exec: addToComments,
        saveRequired: false,
        validRequired: true,
        /* Подтверждение. Строка или объект {msg: 'message', title: 'title', okText:"Ok", cancelText:"" } */
        confirm: {
            msg: "Подтвердить добавление коментария?",
            title: "Подтвержнение",
            okText: "Подтвердить и добавить"
        }
    }
};


function canComment(doc) {
    /*debugger;*/
    let root = doc.$root;
    //if (doc.Id > 0 && root.$$newComment !== '')
    if (root.$$newComment !== '')
        return true;
    //return true;
}

async function addToComments(doc) {
    const vm = this.$vm;
    const root = doc.$root;
    //let docDate = format.parse(s);
    //alert(root.$$newComment);
    if (doc.Id>0) {
        let result = await vm.$invoke('addToComments', { ElId: doc.Id, ElKind: doc.Kind, Text: root.$$newComment });
        root.Comments.$append(result.Comment);// будет $prepend
        root.$$newComment = '';
    }
    else {
        vm.$alertUi('Документ ещё не сохранён, коментирование невозможно!');
    }
}

function canCopyDoc(doc) {
    return !doc.Done;
}

function copyDoc(docs) {
    //debugger;
    const vm = docs.$vm;
    var i = 0;
    docs.forEach((source) => {
        if (source.$selected) {
            i = i + 1;
            vm.$invoke('CopyDoc', { Id: source.Id });
            vm.$requery();
        }
    });
}

function sortRows(rows) {
    //var by = function (name) {
    //    return function (o, p) {
    //        var a, b;
    //        if (typeof о === 'object' && typeof p === 'object' && о && p) {
    //            a = о[name];
    //            b = p[name];
    //            if (a === b) {return 0;}
    //            if (typeof a === typeof b) { return a < b ? -1 : 1;}
    //            return typeof a < typeof b ? -1 : 1;
    //        } else {
    //        throw {
    //            name: 'Error',
    //            message: 'Expected an object when sorting by ' + name,
    //        };
    //        }
    //    };
    //}; 

    var s = [
        { first: 'Doe', last: 'Besser' },
        { first: 'Moe', last: 'Howard' },
        { first: 'Doe', last: 'DeRita' },
        { first: 'Shemp', last: 'Howard' },
        { first: 'Larry', last: 'Fine' },
        { first: 'Curly', last: 'Howard' }
    ]; 
    console.log('Без сортировки:', s);

    s.sort(function (a, b) {
        if (a.first > b.first) {
            return 1;
        }
        if (a.first < b.first) {
            return -1;
        }
        // a должно быть равным b
        return 0;
    });

    //s.sort(by('last'));
    //s.sort(function (a, b) {return (a.first < b.first) - (b.first < a.first);})
    console.log('Сортировка:', s);
    //rows.
    //rows.sort(by('EntName'));
}

function browseBonusEPerson(doc) {
    if (doc.Contract.Id === 0) return;
    var vm = doc.$vm;
    vm.$showDialog('/Document/request/browseBonusPers', 0, { ContractId: doc.Contract.Id })
        .then(function (result) {
            var pr = doc.ERows[0].Person;
            pr.Id = result.Id;
            pr.Name = result.Name;
            doc.ERows[0].Percent = result.Percent;
        });
}

function clearBonusEPerson(doc) {
    if (!doc.ERows.length) return;
    let excess = doc.ERows[0];
    excess.Person.$empty();
    excess.Percent = 0;
    excess.Comission = 0;
    //excess.CashSum = 0; ??? getter only
}

function doFillARows(doc) {
    if (doc.$root.$readOnly)
        return;
    doc.ARows.$empty(); // empty rows
    doc.Rows.forEach((source) => {
        let newRow = doc.ARows.$append(source);
        newRow.$Price = source.$EXPrice;
        newRow.Id = 0; // новая строка!
    });
    // добавляем превышение
    //if (!doc.ERows.length)
    //    doc.ERows.$append();
}

function doFillEXRows(doc) {
    if (doc.$root.$readOnly)
        return;
    doc.EXRows.$empty(); // empty rows
    doc.Rows.forEach((source) => {
        let newRow = doc.EXRows.$append(source);
        newRow.$Price = source.$Price;
        newRow.Id = 0; // новая строка!
    });
    // добавляем превышение построчное
    //if (!doc.ERows.length)
    //    doc.ERows.$append();
    doc.ERows[0].Sum = 0;
}

async function showEntityInfo(elem) {
    if (!elem.Entity.Id)
        return;
    const vm = elem.$vm;
    const doc = elem.$root.Document;
    /*закупка С НДС*/
    const docVat = !doc.VatPurchases;
    const vatPercent = doc.$Taxes.Vat;
    const id = elem.Entity.Id;
    let result = await vm.$showDialog('/Document/request/entityInfo', 0, { EntityId: id });
    if (result.Vat === docVat) {
        // НДС в документе и выборке совпадают
        elem.PurchasePrice = result.Price;
    }
    else {
        if (docVat && !result.Vat) {
            // в документе есть, а в цене нет - добавим
            elem.PurchasePrice = +(result.Price * (100.0 + vatPercent) / 100.0).toFixed(2);
        } else if (!docVat && result.Vat) {
            // в документе нет, а в цене есть - вычтем
            elem.PurchasePrice = +(result.Price * 100.0 / (100.0 + vatPercent)).toFixed(2);
        }
    }
}

async function sendToLogist(doc) {
    const vm = this.$vm;
    let result = await vm.$invoke('sendToLogist', { Id: doc.Id });
    vm.$close();
}

async function createShipment(ware) {
    const vm = this.$vm;
    // создается дочерний документ и возвращает его ID
    let result = await vm.$invoke('createShipment', { Id: vm.Document.Id, WarehouseId: ware.Id});
    let docId = result.Result.DocumentId;
    // перейдем к вновь созданному документу
    vm.$navigate('/document/shipment/edit', docId);
}

//async function setState(transition) {
//    const vm = this.$vm;
//    await vm.$invoke('setState', { Id: vm.Document.Id, State: transition.State });
//    vm.$requery();
//}

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
