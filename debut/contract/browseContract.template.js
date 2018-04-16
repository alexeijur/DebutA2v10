
module.exports = {
    properties: {
        "TRoot.Agent": { Id: 0, Name: '' },
        "TRoot.Company": {Id: 0, Name: ''}
    },
    events: {
        "Model.load": modelLoad
    },
	validators: {
	}
};

function modelLoad(root, caller) {
    if (!caller) return;
    if (!caller.Document) return;
    if (!caller.Document.Agent) return;

    let ag = caller.Document.Agent;
    root.Agent.Name = ag.Name;
    root.Agent.Id = ag.Id;
    let comp = caller.Document.Company;
    root.Company.Name = comp.Name;
    root.Company.Id = comp.Id;
}