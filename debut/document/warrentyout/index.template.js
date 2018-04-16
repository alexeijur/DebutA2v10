const commands = require('Document/request/commands');

const template = {
    properties: {
        "TDocument.$Style"() { return this.Done ? "green" : null; }
        //"TDocument.$HasReturns"() { return this.Returns.length > 0; }
    },
    commands: commands
};

module.exports = template;
