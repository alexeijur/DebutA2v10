

const template = {
	events: {
		"Model.load": onload
	}
};

function onload(root) {
	if (!root.PriceLists.length)
		return;
	root.Entity.SelectedPriceList = root.PriceLists[0];
}

module.exports = template;
