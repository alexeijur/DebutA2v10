function template(vm) {

    return {
        events: {
            "Agent.create": agentCreate,
        }
    };

    function agentCreate(item, parent, context) {
    	item.Kind = 'PERS';
    }
}
