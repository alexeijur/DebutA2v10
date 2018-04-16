/*Заявка на продажу (логист)*/
const common = require('Document/request/common');

const localProperties = {
    "TInbox.$IsInPool"() { return this.Bookmark === 'Logists'; },
    "TInbox.$IsNotInPool"() { return this.Bookmark === 'CurrentLogist'; },
    // Document
    "TDocument.Weight": getDocWeight,	// Вес по документу
    // rows
    "TRow.$Weight": getRowWeight,
};

const allProperties = Object.assign({},
    common.Props,
    localProperties
);

const template = {
    properties: allProperties,
    events: {
    },
    validators: {
    },
    commands: {
        getForMe,
        setDone,
        returnToPool
    }
};

module.exports = template;

// Document properties
function getDocWeight() {
    return +(this.Rows.reduce((prev, curr) => prev + curr.$Weight, 0)).toFixed(4);
}

// row properties
function getRowWeight() {
    const row = this;
    return +(row.Entity.Weight * row.Qty).toFixed(4);
}

// COMMANDS
async function getForMe(inbox) {
    const vm = this.$vm;
    const result = await vm.$invoke('resumeLogist', { Id: inbox.Id, Answer: 'OK' });
    console.dir(result);
    vm.$close();
}

async function setDone(inbox) {
    const vm = this.$vm;
    const result = await vm.$invoke('resumeLogist', { Id: inbox.Id, Answer: 'OK' })
    console.dir(result);
    vm.$close();
}

async function returnToPool(inbox) {
    const vm = this.$vm;
    const result = await vm.$invoke('resumeLogist', { Id: inbox.Id, Answer: 'Return' })
    console.dir(result);
    vm.$close();
}

