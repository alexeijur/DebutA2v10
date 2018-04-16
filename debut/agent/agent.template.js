
module.exports = {
    events: {
        "Agent.create": agentCreate,
    },
    validators: {
        "Agent.Name": "введите наименование покупателя"
    }
};


function agentCreate(item, parent, context) {
    item.Kind = 'CNTR';
}

