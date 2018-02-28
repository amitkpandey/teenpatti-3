module.exports = _.cloneDeep(require("sails-wohlig-controller"));
var controller = {

    addUserToTable: function (req, res) {
        Table.addUserToTable(req.body, res.callback);
    },
    getAllTable: function (res) {
        Table.getAllTable(res.callback);
    },
    removePlayer: function (req, res) {
        Table.removePlayer(req.body, res.callback);
    },
    makePlayerInactive: function (req, res) {
        console.log("inside makePlayerInactive", req.body);
        Table.makePlayerInactive(req.body, res.callback);
    },
    changeStatus: function (req, res) {
        Table.changeStatus(req.body, res.callback);
    },
    connectSocket: function (req, res) {
        Table.connectSocket(req.body, res.callback);
    },

    blastAddPlayerSocket: function (req, res) {
        Table.connectSocket(req.body, res.callback);
    },

    getAllActive: function (req, res) {
        Table.getAllActive(req.body, res.callback);
    },

    getAllActiveOfTables: function (req, res) {
        Table.getAllActiveOfTables(req.body, res.callback);
    },

};
module.exports = _.assign(module.exports, controller);