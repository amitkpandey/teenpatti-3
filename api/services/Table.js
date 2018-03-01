var schema = new Schema({

    minimumBuyin: {
        type: Number,
        require: true
    },


    potAmt: {
        type: Number,
        default: 0
    },

    tableShow: {
        type: Number
    },

    bootAmt: {
        type: Number,
        default: 0
    },

    maxBlind: {
        type: Number
    },

    chalLimit: {
        type: String,
        require: true
    },

    blindAmt: {
        type: Number
    },

    chalAmt: {
        type: Number
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


    status: {
        type: String,
        enum: [
            'beforeStart',
            'serve',
            'Turn',
            'winner'
        ],
        default: 'beforeStart'
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

schema.plugin(deepPopulate, {
    'activePlayer': {
        select: '_id'
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Table', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "activePlayer", "activePlayer"));
var model = {

    /**
     * @function {function getAllTable}
     * @param  {callback} callback {function with err and response}
     * @return {type} {all table data}
     */
    getAllTable: function (callback) {
        this.find({}).exec(callback);
    },


    /**
     * @function {function makePlayerInactive}
     * @param  {type} data     {tableId and player data whom to make inactive}
     * @param  {type} callback {function with err and response}
     * @return {type} {makes player inactive}
     */
    makePlayerInactive: function (data, callback) {
        async.parallel({

            player: function (callback) {
                Player.find({
                    table: data.tableId,
                    //  playerNo: data.playerNo
                }).exec(callback);
            }
        }, function (err, result) {
            if (_.isEmpty(result.player)) {
                callback("Invalide Request");
                return 0;
            }

            var removerPlayer = _.find(result.player, function (p) {
                return (result.player._id + "" == p.player + "");
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



    /**
     * @function {function removePlayer}
     * @param  {type} data     {tableId and player data}
     * @param  {callback} callback {function with err and response}
     * @return {type} {removes player from that table}
     */
    removePlayer: function (data, callback) {
        // console.log(data);
        async.parallel({
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
                
                if (_.isEmpty(result.player) || _.isEmpty(result.table)) {
                    callback("Invalide Request");
                    return 0;
                }

                var removerPlayer = _.find(result.player, function (p) {
                    return (result.player._id + "" == p.player + "");
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


blastSocket: function (tableId, extraData, fromUndo) {
        // console.log(tableId);
        // console.log("inside blastSocket", extraData);
        Player.getAllDetails({
            tableId: tableId
        }, function (err, allData) {
            if (err) {
                // console.log(err);
            } else {
                if (!_.isEmpty(extraData)) {
                    allData.extra = extraData;
                } else {
                    allData.extra = {};
                }
                // console.log("allData.extra", allData.extra);

                _.each(allData.players, function (p) {
                    if (!p.tableLeft) {
                        sails.sockets.broadcast(p.socketId, "Update", {
                            data: allData
                        });
                    }
                });
                _.each(allData.dealer, function (d) {
                    sails.sockets.broadcast(d.socketId, "Update", {
                        data: allData
                    });
                });
            }
        });
    },



    /**
     * @function {function addUserToTable}
     * @param  {type} data     {tableId of table to which player should be added}
     * @param  {callback} callback {function with err and response}
     * @return {type} {adds player to table}
     */
    addUserToTable: function (data, callback) {
        async.parallel({
            table: function (callback) {
                Table.findOne({
                    _id: data.tableId
                }).exec(callback);
            },

            players: function (callback) {
                Player.find({
                    table: data.tableId
                }).exec(callback);
            },

        }, function (err, result) {
            // console.log("result in add user to table", result);
            if (!_.isEmpty(result.table)) {
                var table = result.table;
                var playerIndex = -1;
                //check for max players
                if (table.activePlayer.length == table.maximumNoOfPlayers) {
                    callback("Room Not Available");
                    console.log("no sit available");
                    return 0;
                }

                //invalid player data
                if (!data.playerNo && parseInt(data.amount) == NaN) {
                    callback("Invalid data");
                    console.log("invalid data")
                    return 0;
                }

                //already exists
                playerIndex = _.findIndex(result.players, function (p) {
                    return (p.memberId == data.memberId);
                });

                if (playerIndex >= 0) {
                    console.log("Player Already Added");
                    // callback("Player Already Added");
                    return 0;
                }

                //position filled
                var positionFilled = _.findIndex(result.players, function (p) {
                    return p.playerNo == data.playerNo;
                });

                if (positionFilled >= 0) {
                    console.log("position already filled")
                    callback("position filled");
                    return 0;
                }

                var player = {};
                player.table = data.tableId;
                player.playerNo = data.playerNo;
                player.totalAmount = data.totalAmount;
                player.sitNummber = data.sitNummber;
                player.memberId = data.memberId;
                player.image = data.image;
                player.name = data.name;
                player.userType = data.userType;
                player.isActive=true;
                // player.socketId = data.socketId;
                // player.autoRebuy = data.autoRebuy;


                if (player.autoRebuy) {
                    player.autoRebuyAmt = player.buyInAmt;
                }

                async.waterfall([function (callback) {

                    callback(null);
                }, function (callback) {
                    Player.saveData(player, function (err, player) {
                        if (err) {
                            callback(err);
                        } else {
                            Table.connectSocket(table, data.socketId, player, callback);
                        }

                    });
                }], function (err, data) {
                    callback(err, data)
                });
            } else {
                callback("Please Login first");
            }
        });

    },

    /**
     * @function {function changeStatus}
     * @param  {type} table    {table id}
     * @param  {callback} callback {function with err and response}
     * @return {type} {changes status of that particular table}
     */
    changeStatus: function (table, callback) {
        console.log("in status change");

        Table.findOneAndUpdate({
            _id: table._id
        }, {
            status: table.status
        }).exec(function (err, data) {
            callback(err, data);
            console.log("after status change", data);
        });
    },



    getPrvStatus: function (curStatus) {
        var status = [
            'beforeStart',
            'serve',
            'Turn',
            'winner'
        ];

        var index = _.findIndex(status, function (s) {
            return s == curStatus
        });

        if (index >= 0) {
            curStatus = status[index - 1];
        }

        return curStatus;

    },




    /**
     * @function {function updateStatus}
     * @param  {ObjectId} tableId  {table id of table whose status is to be changed}
     * @param  {callback} callback {function with err and response}
     * @return {type} {updates table status}
     */
    updateStatus: function (tableId, callback) {
        console.log("updateStatus ", tableId);
        var status = [
            'beforeStart',
            'serve',
            'Turn',
            'winner'
        ];
        Table.findOne({
            _id: tableId
        }).exec(function (err, data) {
            var index = _.findIndex(status, function (s) {
                return s == data.status
            });
            data.currentRoundAmt = [];
            if (index >= 0) {
                data.status = status[index + 1];
            }
            async.parallel([function (callback) {
                data.save(callback);
            }, function (callback) {
                if (status[index + 1] == "winner") {
                    Player.showWinner({
                        tableId: tableId
                    }, callback)
                } else {
                    callback(null);
                }
            }], callback);
        });
    },


    connectSocket: function (table, socketId, player, callback) {
        if (table.activePlayer) {
            table.activePlayer.push(
                player._id
            );
        } else {
            table.activePlayer = [
                player._id
            ];
        }
        async.parallel([

            function (callback) {
                table.save(callback);
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                //  console.log(sails.sockets.rooms());
                // sails.sockets.subscribers(table._id, function(err, socketId){
                //        console.log(socketId);
                // });
                Table.blastAddPlayerSocket(table._id);
                callback(err, player);
            }
        });
    },


    blastAddPlayerSocket: function (tableId, extraData) {
        Player.getAllDetails({
            tableId: tableId
        }, function (err, allData) {
            // if (!fromUndo) {
            //     GameLogs.create(function () {});
            // } else {
            //     allData.undo = true;
            // }
            // if (data && data.newGame) {
            //     allData.newGame = true;
            // }

            if (err) {
                console.log(err);
            } else {
                if (extraData) {
                    allData.extra = extraData;
                } else {
                    allData.extra = {};
                }
                //console.log(allData);
                sails.sockets.blast("seatSelection", {
                    data: allData
                });
                // sails.sockets.broadcast("room" + tableId, "Update", {
                //     data: allData
                // });
            }
        });
    },


    /**
     * @function {function getAllActiveOfTables}
     * @param  {type} data    
     * @param  {type} callback {function with err and response}
     * @return {type} {active players in all table with id}
     */
    getAllActiveOfTables: function (data, callback) {
        var activePlayer = {};
        async.parallel({
            activePlayer: function (callback) {
                Table.find({}, {
                    activePlayer: 1
                }).exec(callback);
            },
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                callback(err, data);
            }
        });
    },


    /**
     * @function {function getAllActive}
     * @param  {type} data     {tableid}
     * @param  {type} callback {function with err and response}
     * @return {type} {activePlayer of particular table}
     */
    // getAllActive: function (data, callback) {
    //     async.parallel({
    //         table: function (callback) {
    //             Table.findOne({
    //                 _id: data.tableId
    //             }).select("activePlayer").exec(callback);
    //         }
    //     }, function (err, data) {
    //         if (err) {
    //             callback(err);
    //         } else {
    //             console.log("data........",data)
    //             console.log("data........",data.table.activePlayer)
    //             callback(null, data.table.activePlayer);
    //         }
    //     });
    // },

 getAllActive: function (data, callback) {
        // console.log("ddddd......",data)
                Table.findOne({
                    _id: data.tableId
                }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else {
                // console.log("data........",data)
                callback(null, data.activePlayer);
            }
    });
        },








};
module.exports = _.assign(module.exports, exports, model);