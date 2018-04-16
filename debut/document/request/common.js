const props = {
    "TRow.$HasEntity"() { return !!this.Entity.Id; }
};

module.exports = {
    Props: props
};
