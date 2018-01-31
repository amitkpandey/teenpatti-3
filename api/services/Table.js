var schema = new Schema({

    minimumBuyin: {
        type: Number,
        require: true
    },


    potAmt: {
        type: Number,
        default: 0
    },

    maximumNoOfPlayers: {
        type: Number,
        require: true
    },
    name: {
        type: String,
        require: true
    },
    image: {
        type: String,
        default: ""
    },
    isOpen: Boolean,

    type: String,


    dealer: Number,

    timeoutTime: Number,


    activePlayer: [{
        type: Schema.Types.ObjectId,
        ref: 'Player'
    }],


    setDealer: {
        type: Boolean,
        default: false
    },

    currentRoundAmt: [{
        playerNo: {
            type: Number
        },
        amount: {
            type: Number
        }
    }]





});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Table', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {


 getAllTable: function (data, callback) {
        var requiredData = Player.requiredData();
        this.find({}, requiredData.table).exec(callback);
    },
    makePlayerInactive: function (data, callback) {
        async.parallel({
            user: function (callback) {
                User.findOne({
                    accessToken: data.accessToken
                }).exec(callback);
            },

            player: function (callback) {
                Player.find({
                    table: data.tableId,
                    //  playerNo: data.playerNo
                }).exec(callback);
            }
        }, function (err, result) {
            if (_.isEmpty(result.user) || _.isEmpty(result.player)) {
                callback("Invalide Request");
                return 0;
            }

            var removerPlayer = _.find(result.player, function (p) {
                return (result.user._id + "" == p.user + "");
            });
            // var socketId = result.player.socketId;
            if (!removerPlayer) {
                callback(null);
                return 0;
            }

            if (data.tableLeft) {
                removerPlayer.tableLeft = true;
            } else {
                removerPlayer.tableLeft = false;
            }

            removerPlayer.save(callback);
        });
    },
    removePlayer: function (data, callback) {
        // console.log(data);
        async.parallel({
            user: function (callback) {
                User.findOne({
                    accessToken: data.accessToken
                }).exec(callback);
            },
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },
            player: function (callback) {
                Player.find({
                    table: data.tableId,
                    //  playerNo: data.playerNo
                }).exec(callback);
            }
        }, function (err, result) {
            if (err) {
                callback(err);
            } else {

                if (_.isEmpty(result.user) || _.isEmpty(result.player) || _.isEmpty(result.table)) {
                    callback("Invalide Request");
                    return 0;
                }

                var removerPlayer = _.find(result.player, function (p) {
                    return (result.user._id + "" == p.user + "");
                });
                // var socketId = result.player.socketId;
                if (!removerPlayer) {
                    callback(null);
                    return 0;
                }

                var removedIds = _.remove(result.table.activePlayer, function (p) {
                    //console.log((p + "" == removerPlayer._id + ""));
                    return (p + "" == removerPlayer._id + "");
                });



                var player = _.cloneDeep(removerPlayer)
                var socketId = removerPlayer.socketId;
                var removeCheck = false;

                if (result.table.status == 'beforeStart') {
                    removeCheck = true;
                }
                //  console.log("removedIds", removedIds);
                //  console.log("removerPlayer...........", removerPlayer)
                //result.table.activePlayer = result.table.activePlayer;
                result.table.markModified('activePlayer');
                //console.log("socketId....", socketId);
                //console.log("result.table ", String("room" + result.table._id));
                async.parallel([
                    function (callback) {
                        result.table.save(callback);
                    },
                    function (callback) {
                        if (removeCheck) {
                            removerPlayer.remove(callback);
                        } else {
                            removerPlayer.tableLeft = true;
                            removerPlayer.isActive = true;
                            // removerPlayer.user = "";
                            removerPlayer.save(function (err, foldPlayer) {
                                if (err) {
                                    callback(err);
                                } else {
                                    Player.fold({
                                        tableId: data.tableId,
                                        accessToken: 'fromSystem',
                                        foldPlayer: foldPlayer
                                    }, callback);
                                }
                            });
                        }
                    },
                    // function (callback) {
                    //     Transaction.tableLostAmount(player, callback);

                    // }
                    // function (callback) {
                    //     sails.sockets.leave(socketId, String("room" + result.table._id), callback);
                    // }
                ], function (err, result) {
                    Table.blastSocket(data.tableId, {
                        removePlayer: true
                    });
                    // console.log("err", err);
                    callback(err, result);
                });


            }
        });
    },


  addUserToTable: function (data, callback) {
        console.log(data);

        async.parallel({
            user: function (callback) {
                User.findOne({
                    accessToken: data.accessToken
                }).exec(callback);
            },
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },
            players: function (callback) {
                Player.find({
                    table: data.tableId
                }).exec(callback);
            }
        }, function (err, result) {

            if (!_.isEmpty(result.user)) {
                var user = result.user;
                var table = result.table;
                var playerIndex = -1;
                //check for max players
                if (table.activePlayer && table.activePlayer.length == table.maximumNoOfPlayers) {
                    callback("Room Not Available");
                    return 0;
                }

                if (!data.playerNo && parseInt(data.amount) == NaN) {
                    callback("Invalid data");
                    return 0;
                }

                playerIndex = _.findIndex(result.players, function (p) {
                    return (p.user + "" == user._id + "" && p.table + "" == data.tableId + "");
                });
                console.log(playerAdded);

                console.log("playerIndex ", playerIndex);
                //already exists
                if (playerIndex >= 0) {
                    console.log("Player Already Added");
                    callback("Player Already Added");
                    return 0;
                }

                var positionFilled = _.findIndex(result.players, function (p) {
                    return p.playerNo == data.playerNo;
                });

                if (positionFilled >= 0) {
                    callback("position filled");
                    return 0;
                }
           
        });


};
module.exports = _.assign(module.exports, exports, model);