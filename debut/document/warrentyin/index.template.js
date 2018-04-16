const commands = require('Document/request/commands');

const template = {
     properties: {
        "TDocument.$Style"() { return this.Done ? "green" : null; }
        //"TDocument.$HasReturns"() { return this.Returns.length > 0; }
    },
    commands: commands
};

module.exports = template;

//function fetchAgents(position, text) {
//    const vm = position.$vm;
//    return vm.$invoke('getAgentSelector', { Text: text }, '/agent');
//}

//function fetchEntity(position, text) {
//    const vm = position.$vm;
//    return vm.$invoke('getEntitySelector', { Text: text }, '/entity');
//}