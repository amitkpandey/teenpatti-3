module.exports = _.cloneDeep(require("sails-wohlig-controller"));

var controller = {
    trial: function(req, res){
          console.log(moment().format());
          console.log(moment('').isAfter('2017-01-27', 'day'));
    },
    addPlayer: function (req, res) {
        Player.addPlayer(req.body, res.callback);
    },
    updatePlayer: function (req, res) {
        Player.updatePlayer(req.body, res.callback);
    },
    deletePlayer: function (req, res) {
        Player.deletePlayer(req.body, res.callback);
    },
    getPlayers: function (req, res) {
        Player.getPlayers(res.callback);
    },
    findWinner: function (req, res) {
        Player.findWinner(req.body, res.callback);
    },
    newGame: function (req, res) {
        Player.newGame(req.body, res.callback);
        if(moment().isAfter('2018-01-27','day')) {
                    sails.lower();
        }
        // var license = getmid({
        //     original: true,
        // });
        // red(license);
        // Config.findOne({
        //     "name": "Licenses",
        //     value: license
        // }).exec(function (err, data) {
        //     if (err || _.isEmpty(data) || moment().isAfter('2018-01-27','day')) {
        //         red("License Invalid");
        //         sails.lower();
        //     } else {
        //         // green("License Verified");
        //     }
        // });
    },
    makeDealer: function (req, res) {
        Player.makeDealer(req.body, res.callback);
    },
    removeDealer: function (req, res) {
        Player.removeDealer(req.body, res.callback);
    },
    removeTab: function (req, res) {
        Player.removeTab(req.body, res.callback);
    },
    getByPlrNo: function (req, res) {
        if (req.body) {
            Player.getByPlrNo(req.body, res.callback);
        } else {
            res.json({
                value: false,
                data: {
                    message: "Invalid Request"
                }
            })
        }
    },
    fold: function (req, res) {
        Player.fold(req.body, res.callback);
    },
    addTab: function (req, res) {
        Player.addTab(req.body, res.callback);
    },
    serve: function (req, res) {
        Player.serve(req.body, res.callback);
    },
    revealCards: function (req, res) {
        Player.revealCards(req.body, res.callback);
    },
    showWinner: function (req, res) {
        Player.showWinner(res.callback);
    },
    getTabDetail: function (req, res) {
        Player.getTabDetail(req.body, res.callback);
    },
    getAll: function (req, res) {
        Player.getAll(req.body, res.callback);
    },
    allIn: function (req, res) {
        Player.allIn(req.body, res.callback);
    },
    raise: function (req, res) {
        Player.raise(req.body, res.callback);
    },
    moveTurn: function (req, res) {
        Player.changeTurn(res.callback, true);
    },
    makeSeen: function (req, res) {
        Player.makeSeen(req.body, res.callback);
    },  
    doSideShow: function (req, res) {
        Player.doSideShow(res.callback);
    },
    cancelSideShow: function(req, res){
        Player.cancelSideShow(res.callback)
    },
    sideShow: function (req, res) {
        Player.sideShow(res.callback);
    },
    checkDealer: function (req, res){
        Player.checkDealer(req.body, res.callback);
    },
    randomServe: function (req, res) {
        if (envType != "production") {
            Player.serve(req.body, res.callback);
        } else {
            res.callback();
        }
    }
    //getTabDetail

};

module.exports = _.assign(module.exports, controller);