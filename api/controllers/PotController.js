module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {
    createPot: function (req, res) {
        Pot.createPot(req.body, res.callback);
    },
    
};
module.exports = _.assign(module.exports, controller);
