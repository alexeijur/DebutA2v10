
/* Shipment index
*
*/

const template = {
	properties: {
        "TDocument.$Style"() { return this.Done ? "green" : null; },
        "TDocument.$HasReturns"() { return this.Returns.length > 0; }
	}
};

module.exports = template;
