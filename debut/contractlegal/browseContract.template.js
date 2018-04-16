
module.exports = {
    properties: {
        "TRoot.Agent": { Id: 0, Name: '' }
    },
    events: {
        "Model.load": modelLoad
    },
	validators: {
	}
};

function modelLoad(root, caller) {
    if (!caller) return;
    if (!caller.Contract) return;
    if (!caller.Contract.Contragent) return;

    let ag = caller.Contract.Contragent;
    root.Agent.Id = ag.Id;
    root.Agent.Name = ag.Name;
}