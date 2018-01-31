module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

 addUserToTable: function (req, res) {
        Table.addUserToTable(req.body, res.callback);
    },
    getAllTable: function (req, res) {
        Table.getAllTable(req.body, res.callback);
    },
    removePlayer: function (req, res) {
        Table.removePlayer(req.body, res.callback);
    },
    makePlayerInactive: function(req, res){
        console.log("inside makePlayerInactive", req.body);
        Table.makePlayerInactive(req.body, res.callback);  
    },



};
module.exports = _.assign(module.exports, controller);
