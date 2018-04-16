
/**
*
*/

const template = {
    properties: {
        "TDocument.$Icon"() { return this.Done ? "flag-green" : "flag-yellow";},
        "TDocument.$Style"() { return this.Done ? "green" : null; },
        "TDocument.$HasShipment"() { return this.Shipment.length > 0; }
	}
};

module.exports = template;
