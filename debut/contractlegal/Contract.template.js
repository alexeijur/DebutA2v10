const dateUtils = require('std:utils').date;

module.exports = {
    properties: {
    },
    events: {
        "Model.load": modelLoad
    },
	validators: {
        "Contract.SNo": 'укажите номер договора',
        "Contract.Company": 'выберите продавца'
	}
};

function modelLoad(root, caller) {
    if (root.Contract.$isNew) {
        contractCreate(root.Contract, caller);
    }
}

function contractCreate(contract, caller) {
    var root = contract.$root;
    contract.Date = dateUtils.today();
    contract.Kind = 'LGMO';
	contract.Name = 'Договор продажи';
    contract.IsActive = true;
    //console.dir(caller.Agents.$selected.Id);
    if (caller && 'Agents' in caller) {
        const ag = caller.Agents.$selected;
        //contract.Contragent = caller.Agents.$selected;
        contract.Contragent.Id = ag.Id;
        contract.Contragent.Name = ag.Name;
        //ag.Name += "*";
    }
}
