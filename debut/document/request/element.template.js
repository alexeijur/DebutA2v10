/*Заявка на продажу*/

const commands = require('Document/request/commands');
const common = require('Document/request/common');

const utils = require('std:utils');
const url = require('std:url');

const localProperties = {
    //"TComments.$LenComments"() { return this.Comments.length() },
    "TRoot.$$newComment":  String , // Просто переменная для хранения текста
    "TDocument.$HasContract"() { return !!this.Contract.Id; },
    "TDocument.$TotalBonusPSum": getTotalBonusPSum,  // Персоналка сумма
    "TDocument.$TotalBonusPPrc": getTotalBonusPPrc,  // Персоналка процент
    "TDocument.$SelfCost": getSelfCost,

    "TDocument.$HasPRow0"() { return this.PRows.length > 0; },
    "TDocument.$HasPRow1"() { return this.PRows.length > 1; },
    "TDocument.$HasBonus"() { return this.$HasContract && (this.$HasERows || this.$HasPRow0 || this.$HasPRow1); },
    "TDocument.$PRows0Sum"() { return this.PRows.length ? this.PRows[0].Sum : 0; },
    "TDocument.$PRows1Sum"() { return this.PRows.length > 1 ? this.PRows[1].Sum : 0; },
    "TDocument.$PRows0Percent"() { return this.PRows.length ? this.PRows[0].Percent : 0; },
    "TDocument.$PRows1Percent"() { return this.PRows.length > 1 ? this.PRows[1].Percent : 0; },
    "TDocument.$PRows0PersonName"() { return this.PRows.length ? this.PRows[0].Person.Name : ''; },
    "TDocument.$PRows1PersonName"() { return this.PRows.length > 1 ? this.PRows[1].Person.Name : ''; },
    // служебные
    "TDocument.$TotalMargin": getTotalMargin,
    "TDocument.$TotalMarginPrc": getTotalMarginPrc,
    "TDocument.$MarginStyle"() { return this.$TotalMargin > 0 ? 'success' : 'danger'; },
    "TDocument.$BrowseContractData"() { return { AgentId: this.Agent.Id } },

    "TDocument.$VatKoeff": docGetVatKoeff,  // Делитель для выделения суммы НДС и множитель для добавления
    "TDocument.$Taxes": docGetTaxes,
    "TDocument.$DeliveryType": get$DeliveryType,
    "TDocument.$DeliverySum": get$DeliverySum,
    "TDocument.Sum"() { return this.$EXSum - this.VSum; },	 // Итого без НДС
    "TDocument.VSum": getDocVSum,	    // Итого НДС
    "TDocument.TSum": getDocTSum,	    // Всего по документу
    "TDocument.$RSum": getDocRSum,      // Сумма документа в части товара (без выделенной доставки)
    "TDocument.$Sum": getDoc$Sum,       // Сумма документа (с учётом наличия "бухгалтерского варианта")
    "TDocument.$ASum": getDocASum,      // Сумма документа "бухгалтерский вариант"
    
    "TDocument.$TotalDeliverySum": getTotalDeliverySum,
    "TDocument.$HasERows"() { return this.ERows.length > 0; },
    "TDocument.$HasARows"() { return this.ARows.length > 0; },
    "TDocument.$HasNoVat"() { return this.PayForm.Code === '2'; }, // Признак заказа без налоговой 
    "TDocument.$SRows0Sum": { get: get$SRows0Sum, set: set$SRows0Sum },
    "TDocument.$ERows0Sum": { get: get$ERows0Sum, set: set$ERows0Sum },
    "TDocument.$AHandSum": { get: get$AHandSum, set: set$AHandSum },
    //    "TDocument.$ERows0Sum"() { return this.ERows.length ? this.ERows[0].Sum : 0; },
    "TDocument.$DisableLogist": get$DisableLogist,
    "TDocument.$Shipment": getShipment,
    "TDocument.Weight": getDocWeight,	// Вес по документу TODO: удалить после удаления закладки для логистов!!!
    // rows
    "TRow.$HasFUnits": getHasFUnits,
    "TRow.$IsFUnit": getIsFUnit,
    "TRow.FQty": { get: getRowFqty, set: setRowFqty },
    "TRow.Price": getRowPrice,
    
    "TRow.$Rem"() { return 'Остаток: ' + this.QtyRem; this.$Rem = value; },
    "TRow.$Price": getRow$Price,                 // Цена по строке с НДС
    "TRow.$FPrice": getRow$FPrice,              // Цена по строке в производных единицах измерения с НДС
    //"TRow.$BPrice": getRow$BPrice,                 // Цена по строке с превышением с НДС
    //"TRow.$BFPrice": getRow$BFPrice,              // Цена по строке с превышением в производных единицах измерения с НДС
    //"TRow.$BHPrice": Number,                 // Цена по строке с превышением с НДС
    "TRow.Sum": getRowSum,
    "TRow.$Sum": getRow$Sum,           // Сумма по строке с НДС
    "TRow.$PurchasePriceWithoutVAT": getPurchasePriceWithoutVAT, // цена закупки без НДС
    "TRow.$CostPrice": calcCostPrice,           // себестоимость единицы
    "TRow.$CostPricePrime": calcCostPricePrime, // себестоимость единицы первичная (без затрат на обслуживания заёмных средств)
    "TRow.$LoanCostSum": getLoanCostSum,        // сумма обслуживания заёмных средств (процентов по кредиту при продаже с отсрочкой) на единицу товара
    "TRow.$CostTaxSale": getCostTaxSale,        // налог с оборота в себестоимости единицы товара
    "TRow.$DeliveryPrice": getDeliveryPrice,    // cумма доставки, приходящаяся на цену покупателя единицы товара
    "TRow.$DeliverySum": getDeliverySum,        // cумма доставки, приходящаяся на текущую строку
    "TRow.$CostVat": getCostVat,                // НДС в себестоимости единицы товара (невозмещаемый)
    "TRow.$CostDelivery": getCostDelivery,      // доставка в себестоимости единицы товара
    "TRow.$BonusPPrice": getRowBonusPPrice,     // персоналка в себестоимости единицы товара
    "TRow.$BonusPSum": getRowBonusPSum,         // персоналка на строку
    "TRow.$CostCash": getCostCash,              // затраты на обналичивание в себестоимости единицы товара
    "TRow.$FQty1": getFQty1,                    // кол-во реальной отгрузки в производных единицах имерения
    "TRow.$FQty2": getFQty2,                    // кол-во товарного вознаграждения в производных единицах имерения
    "TRow.$Margin": getMargin,
    "TRow.FPrice": getRowFPrice,
    "TRow.VPrice": getRowVPrice,
    "TRow.VSum": getRowVSum,
    "TRow.Qty1": getRowQty1,
    "TRow.$Weight": getRowWeight,       // TODO: удалить после удаления закладки для логистов!!!
    // служебные
    "TRow.$ReserveUrl": getReserveUrl,
    // Превышение построчное
    "TDocument.$EXSum": getDocEXSum,    // Сумма документа с превышением по строкам
    "TRow.EXPrice": getRowEXPrice,
    "TRow.EXSum": getRowEXSum,
    //"TRow.$EXSum": getRow$EXSum, //{ get: getRow$EXSum, set: setRow$EXSum },
    "TRow.$EXSum": { get: getRow$EXSum, set: setRow$EXSum },
    //"TRow.$EXPrice": Number,
    //"TRow.$EXPrice": getRow$EXPrice,                 // Цена по строке с НДС
    "TRow.$CostTaxProfit": getCostTaxProfit,    // налог на прибыль в себестоимости единицы товара
    "TRow.$EntName": { get: get$EntName, set: set$EntName },
    "TRow.$CanDelete"() { return !this.$parent.$parent.Done},

    // SRows
    "TSRow.VSum": getSRowVSum,

    // ARows
    //"TARow.$Price": Number,
    "TARow.$IsFUnit": getIsFUnit,
    "TARow.$HasFUnits": getHasFUnits,
    "TARow.Price": getRowPrice,
    "TARow.Sum": getRowSum,
    "TARow.FQty": { get: getRowFqty, set: setRowFqty },
    "TARow.$Sum": { get: getARowSum, set: setARowSum },
    "TARow.$HasEntity"() { return !!this.Entity.Id; },
    "TARow.FPrice": getRowFPrice,
    "TARow.VPrice": getRowVPrice,
    "TARow.VSum": getRowVSum,
    "TARow.$CanDelete"() { return !this.$parent.$parent.Done },
    // EXRows
    //"TEXRow.$IsFUnit": getIsFUnit,
    //"TEXRow.$HasFUnits": getHasFUnits,
    //"TEXRow.Price": getRowPrice,
    //"TEXRow.Sum": getRowSum,
    //"TEXRow.FQty": { get: getRowFqty, set: setRowFqty },
    //"TEXRow.$Sum": { get: getEXRowSum, set: setEXRowSum },
    //"TEXRow.$HasEntity"() { return !!this.Entity.Id; },
    //"TEXRow.FPrice": getRowFPrice,
    //"TEXRow.VPrice": getRowVPrice,
    //"TEXRow.VSum": getRowVSum,
    //"TEXRow.$CanDelete"() { return !this.$parent.$parent.Done },
    // ERows
    "TERow.CashSum": getBonusECashSum,
    "TERow.Sum": getBonusESum, // Сумма наличного бонуса
    "TERow.Comission": getBonusEComission,
    // PRows
    "TPRow.Sum": getBonusPSum, // Сумма персоналки
    // Entity
    "TEntity.$Article": { get: getArticle, set: setArticle },
    "TEntity.$HasPrices"() { return this.Prices && this.Prices.length > 0; },
    "TEntity.Qty": Number
};

const allProperties = Object.assign({},
    common.Props,
    localProperties
);

//console.warn(allProperties);

const template = {
    properties: allProperties,
    delegates: {
        'FetchAgents': fetchAgents,
        'FetchEntity': fetchEntity
    },
    events: {
        "Model.load": modelLoad,
        //"Document.Company.change": companyChanged,
        "Document.Agent.change": agentChange,
        "Document.Contract.change": contractChange,
        "Document.Rows[].FUnit.change": fUnitChange,
        "Document.Rows[].add": rowAdded,
        "Document.ARows[].FUnit.change": fUnitChange,
        "Document.Rows[].Entity.change": entityChange,
        "Document.Rows[].QtyRem.change" : qtyRemChange,
        "Document.Rows[].Entity.Prices[].select": priceSelected,
        "Document.Rows[].Entity.PricesEX[].select": priceEXSelected,
        "Document.ARows[].Entity.change": entityChangeCommon,
        "Document.ARows[].Entity.Prices[].select": priceASelected,
        //"Document.EXRows[].Entity.Prices[].select": priceASelected,
        "Document.PriceKind.change": priceKindchanged,
        "Document.Rows[].Warehouse.change": warehouseChange,
        "Document.Rows[].BaseMarg.change": BaseMargChange,
        "Document.PayForm.change": setChangePayForm,
        "PriceKindsEX[].select": priceKindEXSelected,
        "PriceKindsA[].select": priceKindASelected,
        "PriceKinds[].select": priceKindSelected
    },
    validators: {
        "Document.Company": 'выберите продавца',
        //"Document.SNo": 'введите номер документа',
        "Document.Agent": 'выберите покупателя',
        "Document.Rows[].Warehouse": 'выберите склад',
        "Document.Rows[].Qty": 'введите кол-во',
        "Document.Rows[].Entity": 'выберите товар'
    },
    commands: commands
};

module.exports = template;

/* document properties */

function fetchAgents (position, text) {
    const vm = position.$vm;
    return vm.$invoke('getAgentSelector', { Text: text }, '/agent');
}

function fetchEntity (position, text) {
    const vm = position.$vm;
    return vm.$invoke('getEntitySelector', { Text: text }, '/entity');
}


function BaseMargChange(row) {
    var k = 100000;
    var rawPrice;
    var i = 0;
    //debugger;
    row.BasePrice = row.PurchasePrice;
    while (row.$Margin <= row.BaseMarg) {
        rawPrice = row.BasePrice;
        row.BasePrice = rawPrice + k;
        if (row.$Margin > row.BaseMarg) {
            k = 10000;
            row.BasePrice = rawPrice + k;
            if (row.$Margin > row.BaseMarg) {
                k = 1000;
                row.BasePrice = rawPrice + k;
                if (row.$Margin > row.BaseMarg) {
                    k = 100;
                    row.BasePrice = rawPrice + k;
                    if (row.$Margin > row.BaseMarg) {
                        k = 10;
                        row.BasePrice = rawPrice + k;
                        if (row.$Margin > row.BaseMarg) {
                            k = 1.0;
                            row.BasePrice = rawPrice + k;
                            if (row.$Margin > row.BaseMarg) {
                                k = 0.1;
                                row.BasePrice = rawPrice + k;
                                if (row.$Margin > row.BaseMarg) {
                                    k = 0.01;
                                    row.BasePrice = rawPrice + k;
                                    if (Math.abs(row.$Margin - row.BaseMarg) < 0.01) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        i = i + 1;
        if (i > 300) {
            console.log(`Кол-во итераций: ${i}, 
            PurchasePrice = ${row.PurchasePrice}, 
            Margin = ${row.$Margin}, 
            k = ${k}, 
            $CostTaxProfit = ${row.$CostTaxProfit}, 
            $CostTaxSale = ${row.$CostTaxSale}, 
            $CostVat = ${row.$CostVat}, 
            $CostDelivery = ${row.$CostDelivery}, 
            $BonusPPrice = ${row.$BonusPPrice}, 
            $CostCash =  ${row.$CostCash} `);
            row.BasePrice = row.PurchasePrice;
            k = 0;
            break;
        }
    }
    row.BasePrice = row.BasePrice - k;
    //row.PurchasePrice + row.$CostTaxProfit + row.$CostTaxSale + row.$CostVat + row.$CostDelivery + row.$BonusPPrice + row.$CostCash;
    console.log('Кол-во итераций:', i);
}
    

function setChangePayForm(doc) {
    //if (doc.PayForm.Code === '2') { doc.ARows.length = 0; }
    if (doc.$HasNoVat ) { doc.ARows.length = 0; }
}

function docGetVatKoeff() {
    return (this.$Taxes.Vat + 100.0) / 100.0;
}

function docGetTaxes() {
    const doc = this;
    let r = { Profit: 0, Sale: 0, Vat: 0 };
    if (!doc.Company)
        return r;
    if (doc.Company.VatPayer)
        r.Vat = 20;
    switch (doc.Company.TaxMode) {
        case '01':	//на общих основаниях
            r.Profit = 18.0;
            break;
        case '02':	//единый налог
            switch (doc.Company.TaxGroup) {
                case '3':	//3-я группа
                    r.Sale = 5.0;
                    break;
                case '4':	//4-я группа
                    r.Sale = 3.0;
                    break;
            }
            break;
        case 'XXX':
            r.Sale = 1.5;
            r.Profit = 20.0;
            break;
        default:
    }
    return r;
}

function get$DeliveryType() {
    const doc = this;
    return doc.SRows.length > 0 ? doc.SRows[0].RelationType : 2; // по умолчанию - В цену покупателя
}

function get$DeliverySum() {
    const doc = this;
    return doc.SRows.length ? doc.SRows[0].Sum : 0;
}

function getDocVSum() {
    const doc = this;
    let docVat = doc.$Taxes.Vat;
    if (docVat > 0)
        return +(doc.$EXSum * docVat / (docVat + 100)).toFixed(2);
    else
        return 0;
}

function getDocTSum() {
    const doc = this;
    let deliverySum = 0.0;

    if (doc.$DeliveryType === 0) {  //стоимость доставки к сумме документа
        //deliverySum = +(doc.$TotalDeliverySum + doc.$TotalDeliverySum / (100 - doc.$TotalBonusPPrc) * doc.$TotalBonusPPrc).toFixed(2);
        deliverySum = doc.$TotalDeliverySum;
    }
    return doc.$RSum + deliverySum;
}

function getDoc$Sum() {
    const doc = this;
    return doc.$HasARows ? doc.$ASum : doc.TSum;
}

function getDocRSum() {
    return this.Rows.reduce((prev, curr) => prev + curr.$Sum, 0);
}

function getTotalDeliverySum() {
    let doc = this;
    //console.warn(`$DeliveryType:${doc.$DeliveryType}, $DeliverySum:${doc.$DeliverySum}, $Taxes.Vat: ${doc.$Taxes.Vat}`);
    if (doc.$DeliveryType !== 1) // не в себестоимость (к документу или к цене покупателя)
        return doc.$DeliverySum * (doc.$Taxes.Vat + 100) / 100;  // Сумма доставки + НДС на неё
    return 0;
}

// общая сумма персоналки
function getTotalBonusPSum() {
    return this.PRows.reduce((prev, curr) => prev + curr.Sum, 0);
}

// общий % персоналки
function getTotalBonusPPrc() {
    return this.PRows.reduce((prev, curr) => prev + curr.Percent, 0);
}

function getSelfCost() {
    return this.Rows.reduce((prev, curr) => prev + curr.Qty * curr.$CostPrice, 0);
}

function getTotalMargin() {
    return this.TSum - this.$TotalDeliverySum - this.$SelfCost;
}

function getTotalMarginPrc() {
    let doc = this;
    let docSum = doc.TSum - doc.$TotalDeliverySum;  // итого по документу в части товара без доставки
    return docSum ? +(doc.$TotalMargin * 100.0 / docSum).toFixed(2) : 0;
}

function getDocASum() {
    return +(this.ARows.reduce((prev, curr) => prev + curr.$Sum, 0)).toFixed(2);
}

function getDocEXSum() {
    return +(this.Rows.reduce((prev, curr) => prev + curr.$EXSum, 0)).toFixed(2);
}

function get$DisableLogist() {
    if (this.SRows.length === 0)
        return true;
    return !this.SRows[0].Memo;
}
/* row properties */

function calcPriceDependsFUnit(row, price) {
    /* считаем цену в производных единицах */
    if (price === 0)
        return 0;
    let fprice = price / row.Factor;
    /* округляем НДС */
    let roundPrice = +(+(fprice / 6.0).toFixed(2) * 6.0).toFixed(2);
    if (roundPrice <= 0)
        roundPrice = 0.01;
    /* возвращаем простую */
    return +(roundPrice * row.Factor).toFixed(4);
}

function getRow$Sum() {
    const row = this;
    const doc = row.$parent.$parent;
    let deliverySum = 0;
    if (!row.Qty) return 0;
    if (doc.$DeliveryType === 2 && row.DeliveryOn) { //стоимость доставки в цене покупателя
        deliverySum = row.$DeliverySum * doc.$VatKoeff;   // сумма доставки, приходящаяся на текущую строку
    }
    let rawSum = row.BasePrice * row.Qty;
    let resultSum = +(rawSum + deliverySum).toFixed(2);
    let resultPrice = +(resultSum / row.Qty).toFixed(2);
    if (doc.$Taxes.Vat === 20) {
        if (row.FUnit.Id !== 0) {
            resultPrice = calcPriceDependsFUnit(row, resultPrice);
        } else {
            // Документ с НДС, цена должна делиться на 6
            resultPrice = +(+(resultPrice / 6.0).toFixed(2) * 6.0).toFixed(2);
        }
    }
    row.EXPrice = resultPrice;
    return +(resultPrice * row.Qty).toFixed(2);
}

// Бонусы
function getRow$EXSum() {
//    //const row = this;
//    //const doc = row.$parent.$parent;
//    //let deliverySum = 0;
//    //if (!row.Qty) return 0;
//    //if (doc.$DeliveryType === 2 && row.DeliveryOn) { //стоимость доставки в цене покупателя
//    //    deliverySum = row.$DeliverySum * doc.$VatKoeff;   // сумма доставки, приходящаяся на текущую строку
//    //}
//    //let rawSum = row.SumOP * row.Qty; //row.BasePrice * row.Qty;
//    //let resultSum = +(rawSum + deliverySum).toFixed(2);
//    //let resultPrice = +(resultSum / row.Qty).toFixed(2);
//    //if (doc.$Taxes.Vat === 20) {
//    //    if (row.FUnit.Id !== 0) {
//    //        resultPrice = calcPriceDependsFUnit(row, resultPrice);
//    //    } else {
//    //        // Документ с НДС, цена должна делиться на 6
//    //        resultPrice = +(+(resultPrice / 6.0).toFixed(2) * 6.0).toFixed(2);
//    //    }
//    //}
//    //return +(resultPrice * row.Qty).toFixed(2);
    const row = this;
    //console.warn(`Qty = ${row.Qty}, $EXPrice = ${row.$EXPrice}`);
    return +(row.Qty * row.$EXPrice).toFixed(2);
}

function getCostTaxProfit() {
    const row = this;
    const doc = row.$parent.$parent;
    let taxProfifSum = 0;
    let DeliveryPrice = 0;
    if (doc.$DeliveryType !== 0)  //стоимость доставки не в итогах документа
        DeliveryPrice = row.$DeliveryPrice;

    // налог на прибыль на единицу: (цена продажи без НДС - цена закупки без НДС - стоимость доставки в цене товара) * % налога
    //console.warn(`Price: ${row.Price}, $PurchasePriceWithoutVAT: ${row.$PurchasePriceWithoutVAT}`);
    if (!doc.$HasNoVat) {
        taxProfifSum = (row.Price - row.$PurchasePriceWithoutVAT - DeliveryPrice) * doc.$Taxes.Profit / 100.0;
    }
    if (taxProfifSum < 0) {
        taxProfifSum = 0.0;
    }
    return taxProfifSum;
}

function get$EntName() {
    const row = this;
    return row.EntName && row.EntName.length > 0 ? row.EntName : row.Entity.Name;
}

function set$EntName(value) {
    const row = this;
    row.EntName = value;
}

function get$SRows0Sum() {
    return this.SRows.length ? this.SRows[0].Sum : 0;
}

function set$SRows0Sum(value) {
    if (this.SRows.$isEmpty) this.SRows.$append();
    this.SRows[0].Sum = value;
}

function get$ERows0Sum() {
    return this.ERows.length && this.Rows.length ? this.ERows[0].Sum : 0;
}

function set$ERows0Sum(value) {
    //debugger;
    var doc = this;
    var bonusSum = value;// - doc.$ERows0Sum;  // приращение суммы бонуса вида "превышение"
    var totalSum = doc.TSum; //doc.$Sum;   // зафиксируем итоговую сумму бухварианта (при обработке строк она будет меняться)
    //console.log('doc.$ERows0Sum: ', doc.$ERows0Sum);
    //console.log('this.ERows[0].Sum: ', this.ERows[0].Sum);
    //doc.$EHandSum = 0;
    // размазываем сумму приращение бонуса по суммам строк бухгалтерского варианта
    doc.Rows.forEach(function (row) {
        let rawSum = row.$Sum + (bonusSum * row.$Sum / totalSum);
        //console.log('bonusSum: ', bonusSum);
        //console.log('row.$Sum: ', row.$Sum);
        //console.log('totalSum: ', totalSum);
        //console.log('doc.$ERows0Sum', doc.$ERows0Sum);
        if (row.Qty != 0) {
            let resultPrice = +(rawSum / row.Qty).toFixed(2);
            if (doc.$Taxes.Vat === 20) {
                if (row.FUnit.Id !== 0) {
                    resultPrice = calcPriceDependsFUnit(row, resultPrice);
                } else {
                    // Документ с НДС, цена должна делиться на 6
                    resultPrice = +(+(resultPrice / 6.0).toFixed(2) * 6.0).toFixed(2);
                }
            }
            row.$EXSum = +(resultPrice * row.Qty).toFixed(2);
            //row.$EXPrice = +(resultPrice).toFixed(2);
        } else {
            row.$EXSum = +(rawSum).toFixed(2);
            //row.$EXPrice = +(rawSum).toFixed(2);
        }
    });

    if (doc.ERows.$isEmpty && !doc.Rows.$isEmpty) doc.ERows.$append();
    this.ERows[0].Sum = value;  //getBonusESum    (return doc.$ASum - doc.$RSum)
    //debugger;
    //this.ERows[0].Sum = doc.$EXSum - doc.$RSum;
}

function get$AHandSum() {
    return this.Rows.length ? this.$EXSum : 0;
}

function set$AHandSum(value) {
    //debugger;
    var doc = this;
    //var totalSum = doc.$EXSum;   // зафиксируем итоговую сумму бухварианта (при обработке строк она будет меняться)
    var newDocsum = value;
    var totalSum = doc.TSum; //doc.$Sum;
    //// размазываем новую сумму по суммам строк бухгалтерского варианта
    //doc.ARows.forEach(function (row) {
    //    let rawSum = row.$Sum / totalSum * newDocsum;
    //    if (row.Qty != 0) {
    //        let resultPrice = +(rawSum / row.Qty).toFixed(2);
    //        if (doc.$Taxes.Vat === 20) {
    //            if (row.FUnit.Id !== 0) {
    //                resultPrice = calcPriceDependsFUnit(row, resultPrice);
    //            } else {
    //                // Документ с НДС, цена должна делиться на 6
    //                resultPrice = +(+(resultPrice / 6.0).toFixed(2) * 6.0).toFixed(2);
    //            }
    //        }
    //        row.$Sum = +(resultPrice * row.Qty).toFixed(2);
    //    } else {
    //        row.$Sum = +(rawSum).toFixed(2);
    //    }
    //});
    //if (doc.ERows.$isEmpty) doc.ERows.$append();


    // размазываем новую сумму по суммам строк бухгалтерского варианта
    doc.Rows.forEach(function (row) {
        let rawSum = row.$Sum / totalSum * newDocsum;
        if (row.Qty != 0) {
            let resultPrice = +(rawSum / row.Qty).toFixed(2);
            if (doc.$Taxes.Vat === 20) {
                if (row.FUnit.Id !== 0) {
                    resultPrice = calcPriceDependsFUnit(row, resultPrice);
                } else {
                    // Документ с НДС, цена должна делиться на 6
                    resultPrice = +(+(resultPrice / 6.0).toFixed(2) * 6.0).toFixed(2);
                }
            }
            row.$EXSum = +(resultPrice * row.Qty).toFixed(2);
            //row.$EXPrice = +(resultPrice).toFixed(2);
        } else {
            row.$EXSum = +(rawSum).toFixed(2);
            //row.$EXPrice = +(rawSum).toFixed(2);
        }
    });
    if (doc.ERows.$isEmpty) doc.ERows.$append();
}

function getRowVSum() {
    const row = this;
    return +(row.$Sum - row.Sum).toFixed(2);
}

function getRowSum() {
    const row = this;
    const doc = row.$parent.$parent;
    return +(row.$Sum / doc.$VatKoeff).toFixed(2);
}
//Plan B
function getRowEXSum() {
    const row = this;
    const doc = row.$parent.$parent;
    //return +(row.$EXSum / doc.$VatKoeff).toFixed(2);
    return +row.$EXSum;
}

// TARow properties
function getARowSum() {
    const row = this;
    return +(row.Qty * row.$Price).toFixed(2);
}

function setARowSum(value) {
    const row = this;
    if (row.Qty !== 0) {
        row.$Price = +(value / row.Qty).toFixed(4);
    } else {
        row.$Price = 0;
    }
}

// Plan B
//function getRow$EXSum() {
//    const row = this;
//    return +(row.Qty * row.$EXPrice).toFixed(2);
//}

function setRow$EXSum(value) {
    //debugger;
    const row = this;
    if (row.Qty !== 0) {
        row.$EXPrice = +(value / row.Qty).toFixed(4);
    } else {
        row.$EXPrice = 0;
    }
}

// TSRow properties
function getSRowVSum() {
    const row = this;
    const doc = row.$parent.$parent;
    return +(row.Sum * (doc.$VatKoeff - 1.0)).toFixed(2);
}

function getReserveUrl() {
    const doc = this.$root.Document;
    return '/Document/Request/EntityReserve/' + this.Entity.Id + url.makeQueryString({ DocumentId: doc.Id });
}

function getHasFUnits() {
    const fUnits = this.Entity.FUnits;
    return fUnits ? fUnits.length > 1 : false; // один всегда пустой
}

function getIsFUnit() {
    return !!this.FUnit.Id;
}

function getRowPrice() {
    const row = this;
    return row.Qty ? +(row.Sum / row.Qty).toFixed(2) : 0;
}

function getRowEXPrice() {
    const row = this;
    return row.Qty ? +(row.EXSum / row.Qty).toFixed(2) : 0;
}

function getRow$FPrice() {
    const row = this;
    if (row.Factor !== 0)
        return row.$Price / row.Factor;
    return 0;
}

function getRow$Price() {
    const row = this;
    //if (row.Qty !== 0) row.$EXPrice = +(row.$Sum / row.Qty).toFixed(2);
    return row.Qty ? +(row.$Sum / row.Qty).toFixed(2) : 0;
}

function getRow$EXPrice() {
    const row = this;
    return row.Qty ? +(row.$EXSum / row.Qty).toFixed(2) : 0;
}

//// Бонусы
//function getRow$BPrice() {
//    const row = this;
//    return row.Qty ? +(row.$BSum / row.Qty).toFixed(2) : 0;
//}

//function getRow$BFPrice() {
//    const row = this;
//    if (row.Factor !== 0)
//        return row.$BPrice / row.Factor;
//    return 0;
//}
//// Бонусы

function getRowFqty() {
    const row = this;
    return +(row.Qty * row.Factor).toFixed(4);
}

function setRowFqty(value) {
    const row = this;
    if (!row.$HasFUnits)
        return;
    if (row.Factor === 0)
        return;
    row.Qty = value / row.Factor;
}

function fUnitChange(row) {
    row.Factor = row.FUnit.Factor;
}

function getPurchasePriceWithoutVAT() {
    const row = this;
    const doc = row.$parent.$parent;
    if (doc.VatPurchases)
        return row.PurchasePrice; // цена закупки уже без НДС
    else
        return +(row.PurchasePrice / doc.$VatKoeff).toFixed(2);	// цена закупки с НДС - выделяем НДС
}

function calcCostPricePrime() {
    const row = this;
    const doc = this.$parent.$parent;
    // цена закупки + налог на прибыль + налог с оборота + НДС невозмещаемый + стоимость доставки в себестоимости + персоналка + затраты на обналичку 
    //console.warn(`PurchasePrice: ${row.PurchasePrice}, $CostTaxProfit: ${row.$CostTaxProfit}, $CostTaxSale: ${row.$CostTaxSale}, $CostDelivery:${row.$CostDelivery}, $BonusPPrice: ${row.$BonusPPrice}, $CostCash:${row.$CostCash}`);
    return row.PurchasePrice + row.$CostTaxProfit + row.$CostTaxSale + row.$CostVat + row.$CostDelivery + row.$BonusPPrice + row.$CostCash;
}

function getCostTaxSale() {
    const row = this;
    const doc = row.$parent.$parent;
    let DeliveryPrice = 0;
    if (doc.$DeliveryType === 0)  //стоимость доставки в итогах документа
        DeliveryPrice = row.$DeliveryPrice;
    // налог с оборота на единицу: (цена продажи без НДС) * % налога
    // ????return taxSalefSum = (row.Price + DeliveryPrice) * doc.$Taxes.Sale / 100.0;
    if (!doc.$HasNoVat) {
        return (row.Price + DeliveryPrice) * doc.$Taxes.Sale / 100.0;
    }
    else {
        return 0;
    }
}

function calcCostPrice() {
    const row = this;
    // себестоимость первичная + стоимость обслуживания заёмных средств
    return +(row.$CostPricePrime + row.$LoanCostSum).toFixed(2);
}

function getCostVat() {
    const row = this;
    const doc = row.$parent.$parent;
    let DeliveryPrice = 0;
    if (doc.$DeliveryType !== 0)  //стоимость доставки не в итогах документа
        DeliveryPrice = row.$DeliveryPrice;
    if (!doc.$HasNoVat) {
        return (row.Price - DeliveryPrice - row.$PurchasePriceWithoutVAT) * doc.$Taxes.Vat / 100.0;
    }
    else {
        return 0;
    }
}

function getCostCash() {
    const row = this;
    // Затраты на обналичивание на единицу
    if (row.Qty !== 0) {
        return row.$BonusPSum * 0.01 / row.Qty;	//1%
    } else {
        return 0.0;
    }
}

function getCostDelivery() {
    const row = this;
    const doc = row.$parent.$parent;

    if (doc.$DeliveryType === 1 && row.Qty !== 0) {  //стоимость доставки в себестоимости
        return row.$DeliveryPrice * doc.$VatKoeff;
    } else {
        return 0.0;
    }
}

function getRowFPrice() {
    const row = this;
    if (row.Factor !== 0)
        return +(row.Price / row.Factor).toFixed(4);
    return 0;
}

function getRowBonusPPrice() {
    const row = this;
    return row.Qty ? row.$BonusPSum / row.Qty : 0;
}

function getRowBonusPSum() {
    const row = this;
    const doc = row.$parent.$parent;
    //console.warn(`$TotalBonusPSum: ${doc.$TotalBonusPSum}, TSum:${doc.TSum}`);
    if (doc.TSum !== 0) {
        return row.$Sum * doc.$TotalBonusPSum / doc.TSum;
    } else {
        return 0.0;
    }
}


function getLoanCostSum() {
    const row = this;
    const loanPercent = 16.0;
    let res = 0.0;  // по умолчанию - 100% предоплата

    let sarr = row.$parent.$parent.Contract.PaySchedule;     // график платежей
    let creditSum = row.$CostPricePrime;  // сумма заёмных средств на единицу
    let sSum = creditSum;   // остаток суммы заёмных средств

    if (sarr && sarr.length > 0) {
        for (let i = 0; i < sarr.length; i++) {
            res = res + sSum * loanPercent / 100.0 / 365 * sarr[i].Days;
            sSum = sSum - creditSum * sarr[i].Percent / 100.0;   // остаток кредита, на который накручиваем процент
        }
    }
    return res;
}

function getDeliverySum() {
    const row = this;
    const doc = row.$parent.$parent;

    //Сумма всех строк без бонуса на документ ("персоналки") и транспорта
    let totalSum = doc.Rows.reduce(function (prev, curr) {
        let deliveryVal = 0;
        if (doc.$DeliveryType !== 2 || curr.DeliveryOn)
            deliveryVal = curr.BasePrice * curr.Qty;
        return prev + deliveryVal;
    }, 0);

    if (!totalSum)
        return 0;

    //Сумма доставки * коэфициент (Сумма текущей строки без бонуса на документ ("персоналки") и транспорта / Сумма всех строк без бонуса на документ ("персоналки") и транспорта)
    return +(doc.$DeliverySum * row.BasePrice * row.Qty / totalSum).toFixed(2);
}

function getDeliveryPrice() {
    const row = this;
    //стоимость доставки единицы товара
    return row.Qty ? row.$DeliverySum / row.Qty : 0;
}

function getMargin() {
    //debugger;
    const row = this;
    let marginSum = 0;
    // Наценка на минимальную цену, %
    if (row.BasePrice !== 0) {
        marginSum = row.BasePrice - row.$CostPrice;
        // Отношение цены продавца к себестоимости
        return +(marginSum * 100.0 / row.BasePrice).toFixed(2);
    }
    else
        return 0;
}


function getFQty1() {
    const row = this;
    // Приходится округлять из-за странностей типа 11 * 0.03 = 0.32999999999999996
    return row.$IsFUnit ? +(row.Qty1 * row.Factor).toFixed(2) : 0;
}

function getFQty2() {
    const row = this;
    return row.$IsFUnit ? +(row.Qty2 * row.Factor).toFixed(2) : 0;
}

function getRowVPrice() {
    const row = this;
    return row.$Price - row.Price;
}

function getRowQty1() {
    const row = this;
    return row.Qty - row.Qty2;
}

function getRowWeight() {
    const row = this;
    return +(row.Entity.Weight * row.Qty).toFixed(4);
}

// TERow properties
function getBonusECashSum() {
    const row = this;
    return +(row.Sum * row.Percent / 100).toFixed(0);
}

function getBonusESum() {
    const doc = this.$parent.$parent;
    return +(doc.$EXSum - doc.$RSum).toFixed(2);
}

function getBonusEComission() {
    const row = this;
    return row.Sum - row.CashSum;
}

// TPRow properties

function getBonusPSum() {
    var row = this;
    var doc = row.$parent.$parent;
    return +(doc.$Sum * row.Percent / 100).toFixed(2);
}


/* document events */

function modelLoad(root) {
    if (root.Document.Id)
        documentLoad(root.Document);
    else
        documentCreate(root.Document);
}

function documentLoad(doc) {
    const root = doc.$root;
    if (!doc.SRows.length)
        doc.SRows.$append({ RelationType: 2 });
    if (!doc.PayForm.Id)
        doc.PayForm = root.PayForms[0];
    if (!doc.PayTerm.Id)
        doc.PayTerm = root.PayTerms[0];
}

function documentCreate(doc) {
    /*установка MyCompany - которая выбрана в комбике списка документов */
    const root = doc.$root;
    //var compId = context;

    doc.Date = utils.date.today();
    //doc.$DeliveryType = 2;   // Доставка в цене покупателя ??? getter only

    doc.PayForm = vm.PayForms[0];
    doc.PayTerm = vm.PayTerms[0];

    doc.PriceKind = getDefPriceKind(doc);


    doc.Rows.$append({ DeliveryOn: true });
    doc.SRows.$append({ RelationType: 2 });
        //if (+compId === -1)
            //return;

        /*
        if (context && root) {
            root.Companies.every(function (val, index) {
                if (val.Id === +compId) {
                    doc.Company = val;
                    return false;
                }
                return true;
            });
        }
        */
    }
/* автонумерация из Акцента
function companyChanged(doc) {
    const vm = doc.$vm;
    const data = { CompanyId: doc.Company.Id, DocId: doc.Id, DocKind: 'CALC', DocDate: doc.Date };
    vm.$invoke('getDocNo', data).then((data) => {
        if (!data.Result) return;
        doc.No = data.Result.DocNo;
        doc.SNo = doc.Company.String1 + '-' + doc.No;
    });
}
*/
function agentChange(doc) {
    doc.Contract.$empty();
    const vm = doc.$vm;
    vm.$invoke('defaultContract', { AgId: doc.Agent.Id })
        .then((data) => {
            if (data.Contract) {
                doc.Contract = data.Contract;
            }
        });
}

function getDefPriceKind(doc) {
    const priceKinds = doc.$root.PriceKinds;
    if (priceKinds.$isEmpty)
        return priceKinds.$new();
    let res = priceKinds[0];
    let m = priceKinds.find(val => val.Main);
    if (m) res = m;
    return res;
}

function contractChange(doc) {
    let ct = doc.Contract;
    let root = doc.$root;
    if (ct.Id) {
        // значения из договора
        doc.Company = ct.ContractLegal.Company;
        //alert(doc.Company.Name);
        doc.PayForm = ct.PayForm;
        doc.PayTerm = ct.PayTerm;
        doc.PriceKind = ct.PriceKind.Id ? ct.PriceKind : getDefPriceKind(doc);
        //doc.$DeliveryType = ct.TypeAddSumTransportServ; ??? getter only
    } else {
        // значения по умолчанию
        doc.PayForm = root.PayForms[0];
        doc.PayTerm = root.PayTerms[0];
        doc.PriceKind = getDefPriceKind(doc);
    }
    // Персоналка
    doc.PRows.$empty();
    if (ct.PercBonus4Pers)
        doc.PRows.$append({ Percent: ct.PercBonus4Pers, Person: ct.BonusPers });
    if (ct.PercBonus4Pers2)
        doc.PRows.$append({ Percent: ct.PercBonus4Pers2, Person: ct.BonusPers2});
    commands.clearBonusEPerson(doc);
}

function rowAdded(array, row) {
    row.Qty = 1;
    let ix = array.indexOf(row);
    if (ix === 0)
        return;
    /* наследуем значения из предыдущей строки */
    let prevRow = array[ix - 1];
    row.DeliveryOn = prevRow.DeliveryOn;
    if (!prevRow.Warehouse.$isEmpty)
        row.Warehouse = prevRow.Warehouse;
}

function entityChangeCommon(row) {
    /* указали кол-во в диалоге */
    if (row.Entity.Qty)
        row.Qty = row.Entity.Qty;
    row.Unit = row.Entity.Unit;
    row.FUnits = row.Entity.FUnits;
    if (!row.$HasFUnits) {
        row.Factor = 0;
        //row.FUnit.$empty();
    }
    row.EntName = ''; // очистить произвольное наименование
}

function priceKindchanged(doc) {
    vm.Document.Rows.forEach(function (row) {
        //TODO: определить цену с учётом спецификации договора
        row.BasePrice = getEntityPrice(row.Entity.Prices, doc.PriceKind.Id);
    });
}

function entityChange(row) {
    //debugger;
    entityChangeCommon(row);
    if (row.Entity.Id) {
        getEntitySelfCost(row.Entity);
        getEntityQtyRem(row.Entity, row.Warehouse);
        //TODO: определить цену с учётом спецификации договора
        row.BasePrice = getEntityPrice(row.Entity.Prices, row.$parent.$parent.PriceKind.Id);
    }
}

function qtyRemChange(row) {
    if ((row.Qty === 1 || row.Qty === 0) && row.QtyRem !== 0 ) { row.Qty = row.QtyRem; }
}

function warehouseChange(row) {
    getEntityQtyRem(row.Entity, row.Warehouse);
}

function priceSelected(prices, price) {
    if (prices.$root.$readOnly)
        return;
    var row = prices.$parent.$parent;
    row.BasePrice = price.Price;
}

function priceEXSelected(prices, price) {
    if (prices.$root.$readOnly)
        return;
    var row = prices.$parent.$parent;
    row.$EXPrice = price.Price;
}

function priceASelected(prices, price) {
    if (prices.$root.$readOnly)
        return;
    var row = prices.$parent.$parent;
    row.$Price = price.Price;
}

//function priceEXSelected(prices, price) {
//    if (prices.$root.$readOnly)
//        return;
//    var row = prices.$parent.$parent;
//    row.$Price = price.Price;
//}

function getEntitySelfCost(ent) {
    const data = { EntId: ent.Id };
    const vm = ent.$vm;
    vm.$invoke('getEntitySelfCostServer', data).then(
        function (response) {
            if (response.Result) {
                var row = ent.$parent;
                var doc = row.$parent.$parent;
                row.PurchasePrice = +(response.Result.SelfCost * doc.$VatKoeff).toFixed(2);
            }
        }
    );
}

function getRowQtyRemText(row) {
    return 'Остаток: ' + row.QtyRem;
}
function getEntityQtyRem(ent, wh) {

    const data = { EntId: ent.Id, WhId: wh.Id };
    const vm = ent.$vm;
    vm.$invoke('getEntityQtyRemServer', data).then(
        function (response) {
            if (response.Result) {
                var row = ent.$parent;
                //var doc = row.$parent.$parent;
                //row.Qty = response.Result.QtyRem;
                row.QtyRem = response.Result.QtyRem;
            }
        }
    );
}

function priceKindASelected(array, priceKind) {
    const root = array.$root;
    if (root.$readOnly)
        return;
    const doc = root.Document;
    const id = priceKind.Id;
    doc.ARows.forEach((row) => row.$Price = getEntityPrice(row.Entity.Prices, priceKind.Id));
}

function priceKindEXSelected(array, priceKind) {
    const root = array.$root;
    if (root.$readOnly)
        return;
    const doc = root.Document;
    const id = priceKind.Id;
    doc.Rows.forEach((row) => row.$EXPrice = getEntityPrice(row.Entity.Prices, priceKind.Id));
}

function priceKindSelected(array, priceKind) {
    const root = array.$root;
    if (root.$readOnly)
        return;
    const doc = root.Document;
    const id = priceKind.Id;
    doc.Rows.forEach((row) => row.BasePrice = getEntityPrice(row.Entity.Prices, priceKind.Id));
}

function getEntityPrice(prices, priceKindId) {
    let found = prices.find((item) => item.PriceKind.Id === priceKindId);
    return (found) ? found.Price : 0;
}

function getArticle() {
    return this.Article;
}

async function setArticle(value) {
    if (value === '')
        return;
    const vm = this.$vm;
    const row = this.$parent;
    const data = { Article: value, PrlId: 4294967304 };
    let result = await vm.$invoke('getEntitybyArticle', data);
    if (result.Entities)
        row.Entity = result.Entities[0];
}

function getShipment() {
    const doc = this;
    //debugger;
    // все склады, которые есть в строках документа
    let wars = [];
    doc.Rows.forEach(row => {
        const whId = row.Warehouse.Id;
        if (!whId) return;
        //if (wars.find(w => w.Warehouse.Id === whId)) return;
        if (wars.find(function (w) {
            return w.Warehouse.Id === whId;
        })) return;
        let item = {
            Warehouse: row.Warehouse,
            // все документы по заданному складу
            LinkedDocuments: doc.Shipment.filter(d => d.Warehouse.Id === whId)
        };
        utils.defineProperty(item, "TotalSum", function () {
            return this.LinkedDocuments.reduce((p, c) => p + c.Sum, 0);
        });
        utils.defineProperty(item, "TotalRem", function () {
            let totalSum = doc.Rows
                .filter(v => v.Warehouse.Id === whId)
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

function getDocWeight() {
    return +(this.Rows.reduce((prev, curr) => prev + curr.$Weight, 0)).toFixed(4);
}
/*
        properties: {
            "Document.$applyDisabled": getapplyDisabled,
        },

        events: {
            "Document.ARows[].remove": arowsRemove,
            /*при изменении этих свойств нужно заново проверить строки * /
            "Document.$DeliveryType.change": deliveryTypeChange,
    },
        validators: {
            "Document.Rows[].BasePrice": [
				{ valid: validMargin, msg: 'Убыток!', severity: 'warning' }
            ],
            "Document.Rows[].Qty1": [
                {
                    valid: function (row, rule) {
                        return row.Qty1 >= 0;
                    }, msg: 'не может быть отрицательным'
                }
            ] ,
            "Document.$ASum": [
                {
                    valid: function (doc, rule) {
                        return doc.$ASum >= doc.$RSum;
                    }, msg: 'сумма по счёту-фактуре не может быть меньше суммы заказанного товара'
                }
            ]
        },
    };

    // #region validatorFuncs
    function validMargin(row, rule) {
        return row.$Margin >= 0;
    }
    //#endregion

    function getapplyDisabled() {
        var doc = this;
        if (doc.Done)
            return true;
        //var v = vm.$host.$validate();
    }


    //#endregion


    //#region document events
    function arowsRemove(row) {
        var doc = row.$parent;
        // Удаляя последнюю строку в бухварианте, очищаем и превышение
        if (doc.ARows.length == 0 && doc.ERows) {
            doc.ERows.length = 0
        }
    }


    function deliveryTypeChange(doc) {
        var bOn = doc.$DeliveryType === 2;
        doc.Rows.forEach(function (row) {
            row.DeliveryOn = bOn;
        });
    }

    //#endregion
}
*/