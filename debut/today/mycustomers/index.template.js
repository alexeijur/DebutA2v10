/*
 * шаблон списка "мои клиенты"
 */

// текстовые утилиты

const tu = require('std:utils').text;
/*
vm.$$isContractDisabled = function (ct) {
    if (!ct)
        return true;
    else
        return ct.Kind !== 'BCSL';
}
*/

const template = {
    properties: {
        "TRequest.$HasShipment"() { return this.Shipment.length > 0; },
        "TContract.$HasConditions"() { return this.ContractConditions.length > 0;},
        "TAgentArray.IsFavorit"() { return this.$selected && this.$selected.IsFavorit; },
        "TAgent.$Mark"() { return this.IsFavorit ? 'cyan' : 'yellow'; },
        "TReport.$RepArg"() { return { Id: this.Id, Customer: this.$parent.$parent }; }
    },
    events: {
        "TLink.construct": linkConstruct,
    },
    delegates: {
        FilterDelegate
    },
    commands: {
        "removeLink": {
            exec: removeLink,
            confirm: { title: 'Удаление связи', msg: 'Вы уверены, что хотите удалить связь?', okText: 'Удалить связь' }
        },
        openContract,
        AddMyCustomers,
        DelMyCustomers
    }
};

module.exports = template;

function FilterDelegate(item, filter) {
    return tu.containsText(item, "Name,Id", filter.Fragment);
}

function openContract(ct) {
    //Добавить открытие разными диалогами в зависимости от вида договора
    vm.$editDialog(ct, 'editContract');
}

function linkConstruct(self, metadata) {
    /* объявлять через свойства нельзя! объект создается динамически */
    host.$defineProperty(self, "$TypeName", function () {
        switch (this.For) {
            case "Contact":
                return "Контакт";
            case "Agent":
                return "Контрагент";
            default:
                return "Undefined";
        }
    });
}

function removeLink(item) {
    vm.$invoke('removeLink', { Id: item.Id })
        .then(function () {
            vm.$remove(item);
        });
}

async function AddMyCustomers(agents) {
    const vm = agents.$vm;
    const ag = await vm.$showDialog('/Agent/BrowseAgent');
    await vm.$invoke('addMyCustomers', { Id: ag.Id });
    let target = agents.$append();
    target.Id = ag.Id;
    target.Name = ag.Name;
    target.Code = ag.Code;
    target.Memo = ag.Memo;
    target.IsFavorit = true;
}

async function DelMyCustomers(agent) {
    const vm = agent.$vm;
    if (agent.IsFavorit) {
        await vm.$invoke('delMyCustomers', { Id: agent.Id });
        agent.$remove();
    }
    else
        alert('Этот контрагент назначен для текущего пользователя и не может быть удалён из списка!');
}