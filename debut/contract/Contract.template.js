
const msgBonusPers = 'если указан процент "персоналки", должен быть указан получатель';

const dateUtils = require('std:utils').date;

module.exports = {
    properties: {
        'TContract.$PayScheduleTotal': get$PayScheduleTotal,
        "TContract.$HasNoVat"() { return this.PayForm.Code === '2'; }, // Признак заказа без налоговой 
        'TContract.$PayScheduleTotalDays': get$PayScheduleTotalDays,
        'TContract.$PersonKind'() { return {Kind: 'PERS;WORK'};},
        "TContract.$BrowseContractLegalData"() { return { AgentId: this.Contragent.Id } },
        'TSpecRow.$IsGroup'() { return this.Mode === 1; },
        'TSpecRow.$IsSubGroup'() { return this.Mode === 2; },
        'TSpecRow.$IsEntity'() { return this.Mode === 3; },
        'TSpecRow.$PriceDisabled'() { return !this.PriceKind.$isEmpty || !this.PriceList.$isEmpty; },
        'TSpecRow.$PriceListDisabled'() { return this.Price !== 0; }
    },
    events: {
        "Model.load": modelLoad,
		"Contract.SpecRows[].add": rowAdd,
        "Contract.PriceList.change": priceListChange,
        "Contract.SpecRows[].Mode.change": (row) => { row.Entity.$empty(); row.Group.$empty(), row.SubGroup.$empty() },
		"Contract.PaySchedule[].change": setPayTerm,
		"Contract.PaySchedule[].Days.change": setPayTerm,
		"Contract.PaySchedule[].Percent.change": setPayTerm,
        "Contract.SpecRows[].PriceList.change": specPriceListChange,
        //"Contract.PayForm.change": 
    },
	validators: {
		"Contract.BonusPers.Name": { valid: bonusPersonValid, msg: msgBonusPers },
		"Contract.BonusPers2.Name": { valid: bonusPersonValid2, msg: msgBonusPers },
		//"Contract.Agent.Name": { valid: rowPersonValid, msg: 'если указан процент, должен быть указан получатель' },
        "Contract.$PayScheduleTotal": { valid: payScheduleValid, msg: 'Не равно 100%' },
        "Contract.ContractLegal": 'выберите договор с покупателем',
        "Contract.PersonRows[].Agent.Name": 'укажите получателя',
        "Contract.PersonRows[].Percent": 'укажите % получения',
        "Contract.SpecRows[].Entity": { valid: validSpecEntity, msg: 'выберите товар'},
        "Contract.SpecRows[].Group": { valid: validSpecGroup, msg: 'выберите группу' },
        "Contract.SpecRows[].SubGroup": { valid: validSpecSubGroup, msg: 'выберите подгруппу' },
        "Contract.SpecRows[].PriceKind": {valid: validSpecPriceKind, msg: 'выберите вид цены'}
	}
};

function get$PayScheduleTotal() {
    return +this.PaySchedule.reduce((p, c) => p + c.Percent, 0).toFixed(2);
}

function get$PayScheduleTotalDays() {
    return +this.PaySchedule.reduce((p, c) => p + c.Days, 0).toFixed(0);
}

function modelLoad(root, caller) {
    if (root.Contract.$isNew) {
        contractCreate(root.Contract, caller);
    }
}

function contractCreate(contract, caller) {
    var root = contract.$root;
    contract.Date = dateUtils.today();
	contract.Kind = 'BCSL';
	contract.Name = 'Договор продажи';
	contract.TypeAddSumTransportServ = 2;
	contract.PayForm = root.PayForms[0];
    contract.PayTerm = root.PayTerms[0];
	contract.PaySchedule.$append({Percent: 100});
	contract.IsActive = true;
	if (caller && 'Agent' in caller) {
        contract.Contragent = caller.Agent;
    }
    if (caller && 'Company' in caller) {
        let srcId = caller.Company.Id;
        let comp = root.Companies.find((v) => v.Id === srcId);
        if (comp)
            contract.Company = comp;
    }
}

function rowAdd(array, row) {
	row.Mode = 1;
}

function priceListChange(contract) {
	/* установим основной вид цены выбранного прайс-листа */
	contract.PriceList.PriceKinds.every(function (val, index) {
		if (val.Main) {
			contract.PriceKind = val;
			return false;
		}
		return true;
	});
}

function setPayTerm() {
    // TODO: remove vm
	var ct = sh = vm.Contract;
	var sh = ct.PaySchedule;
	if (sh.length === 0)
        return;
	if (sh[0].Days !== 0) {
        ct.PayTerm = vm.PayTerms[2];
	} else if (sh[0].Days === 0 && sh[0].Percent < 100) {
        ct.PayTerm = vm.PayTerms[1];
	} else {
        ct.PayTerm = vm.PayTerms[0];
	}
}

function specPriceListChange(row) {
    row.PriceKind.$empty();
}

//#region Валидаторы
function bonusPersonValid(bonusPers) {
    var contract = bonusPers.$parent;
    return contract.PercBonus4Pers > 0 ? bonusPers.Id !== 0 : true;
}

function bonusPersonValid2(bonusPers) {
    var contract = bonusPers.$parent;
    return contract.PercBonus4Pers2 > 0 ? bonusPers.Id !== 0 : true;
}

function rowPersonValid(row) {
	return row.Percent > 0 ? row.Agent.Id !== 0 : true;
}

function payScheduleValid(contract) {
	return contract.$PayScheduleTotal === 100.0;
}

function validSpecEntity(row) {
    return row.$IsEntity ? !row.Entity.$isEmpty : true;
}

function validSpecGroup(row) {
    return row.$IsGroup ? !row.Group.$isEmpty : true;
}

function validSpecSubGroup(row) {
    return row.$IsSubGroup ? !row.SubGroup.$isEmpty : true;
}

function validSpecPriceKind(row) {
    return row.PriceList.$isEmpty ? true : !row.PriceKind.$isEmpty;
}
//#endregion
