var schema = new Schema({
    playerNo: {
        type: Number,
        required: true,
        unique: true
    },

    image:{
        type: String
    },

    playerId: {
        type: String
    },

    memberId: {
        type: String
    },

    buyInAmt: {
        type: Number,
        default: 0
    },

    sitNummber: {
        type: Number
    },

    loosingAmt: {
        type: Number,
        default: 0
    },

    winningAmt: {
        type: Number,
        default: 0
    },


    amtToPlay: {
        type: Number,
        default: 0
    },

    maxBlind: {
        type: Number,
        default: 0
    },

    maxSeen: {
        type: Number,
        default: 0
    },

    isTurn: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isFold: {
        type: Boolean,
        default: false

    },
    isDealer: {
        type: Boolean,
        default: false
    },
    isChaal: {
        type: Boolean,
        default: false
    },

    hasTurnCompleted: {
        type: Boolean,
        default: false
    },

    cards: [String],

    cardsServe: {
        type: Number,
        default: 0
    },

    table: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
    },

    totalAmount: {
        type: Number,
        default: 0
    },

    tableLeft: {
        type: Boolean,
        default: false
    },


    isLastBlind: {
        type: Boolean,
        default: false
    },
    isBlind: {
        type: Boolean,
        default: true

    },
    accessToken: {
        type: [String],
        index: true
    },
    // hasRaised: {
    //     type: Boolean,
    //     default: false
    // },
    // isAllIn: {
    //     type: Boolean,
    //     default: false
    // }
});
schema.plugin(deepPopulate, {
    populate: {
        'cards': {
            select: 'name _id'
        },
        'table': {
            select: '_id'
        }
    }
});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Player', schema);
var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "cards", "cards", "table", "table"));

var model = {

    /**
     * @function {function addPlayer}
     * @param  {object} data     {playerdata}
     * @param  {callback} callback {function with err and response}
     * @return  {new player data}
     */
    addPlayer: function (data, callback) {
        Player.saveData(data, function (err, data2) {
            console.log("data..............", data);
            if (err) {
                callback(err, data2);
            } else {
                data3 = data2.toObject();
                delete data3.password;
                callback(err, data3);
            }
        });
    },

    /**
     * @function {function updatePlayer}
     * @param  {object} data     {playerNo,field to be modified}
     * @param  {callback} callback {function with err and response}
     * @return  {updated player data}
     */
    updatePlayer: function (data, callback) {

        var playerData = _.clone(data, true);
        delete playerData.playerNo;
        Player.update({
            "playerNo": data.playerNo
        }, playerData, {
            new: true,
            runValidators: true
        }, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(err, doc);
            }
        });
    },

    /**
     * @function {function deletePlayer}
     * @param  {object} data     {data of player to be deleted}
     * @param  {callback} callback {function with err and response}
     */
    deletePlayer: function (data, callback) {
        Player.findOne({
            "playerNo": data.playerNo
        }).exec(function (err, userData) {
            if (!_.isEmpty(userData)) {
                userData.remove(function (err, data) {
                    callback(err, "Deleted successfully");
                });
            } else {
                callback(err, userData);
            }
        });
    },
    findWinner: function (data, callback) {
        Player.find().exec(function (err, userData) {
            callback(err, userData);
        });
    },
    getAll: function (data, callback) {
        var cards = {};
        async.parallel({
            playerCards: function (callback) {
                Player.find({}, {
                    playerNo: 1,
                    isTurn: 1,
                    isActive: 1,
                    isDealer: 1,
                    isFold: 1,
                    cards: 1,
                    showCard: 1,
                    _id: 0,
                    isBlind: 1,
                    isChaal: 1,
                }).exec(callback);
            },
            currentGameType: function (callback) {
                GameType.find({}).exec(
                    function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            var gameIndex = _.findIndex(data, function (game) {
                                return game.currentType
                            });
                            if (gameIndex >= 0) {
                                callback(err, data[gameIndex]);
                            } else {
                                var normalGameIndex = _.findIndex(data, function (game) {
                                    return game.name == 'Joker';
                                });

                                callback(err, data[normalGameIndex]);
                            }
                        }
                    }
                );
            },
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {

                callback(err, data);
            }
        });
    },


getAllDetails: function (data, callback, newGameCheck = false) {
        var tableId = data.tableId;
        console.log(data);
        if (!tableId) {
            callback("Invaid Request");
            return 0;
        }
        var requiredData = Player.requiredData();
        async.parallel({
            players: function (callback) {
                var filter = {};
                if (newGameCheck) {
                    filter = {
                        table: tableId,
                        tableLeft: false
                    }
                } else {
                    filter = {
                        table: tableId
                    }
                }
                Player.find(filter, requiredData.player).deepPopulate("user").lean().exec(callback);

            },
            communityCards: function (callback) {
                CommunityCards.find({
                    table: tableId
                }, requiredData.communityCards).sort({
                    cardNo: 1
                }).exec(callback);
            },
            pots: function (callback) {
                Pot.find({
                    table: tableId
                }, requiredData.pot).sort({
                    _id: 1
                }).lean().exec(callback);
            },
            
            table: function (callback) {
                Table.findOne({
                    _id: tableId
                }, requiredData.table).exec(callback);
            },
            extra: function (callback) { //to have same format required by the frontend
                callback(null, {});
            }
        }, function (err, allData) {
            if (err) {
                callback(err);
            } else {
                _.each(allData.pots, function (p, key) {
                    p['no'] = key + 1;
                });

                if (allData.table.status == 'beforeStart') {
                    _.remove(allData.players, function (p) {
                        return p.tableLeft;
                    });
                }

                _.each(allData.pots, function (p, key) {
                    if (key == 0) {
                        p['name'] = 'Main rsPot'
                    } else {
                        p['name'] = 'Side Pot ' + key;
                    }
                });

                _.each(allData.players, function (p) {
                    allData.players.winPots = [];
                    _.each(allData.pots, function (pot) {
                        var winIndex = -1
                        if (pot.winner && !_.isEmpty(pot.winner)) {
                            winIndex = _.findIndex(pot.winner, function (w) {
                                return w.winner && w.playerNo == p.playerNo;
                            });
                            if (winIndex >= 0) {
                                allData.players.winPots.push(p.no);
                            }
                            _.remove(pot.winner, function (w) {
                                return !pot.winner
                            });
                        }
                    })


                });
                // Pot.solveInfo(allData, function (err, data) {
                //     // console.log("inside allData");
                //     if (err) {
                //         //  console.log("inside allData err", err);
                //         callback(null, allData);
                //     } else {

                //         if (!_.isEmpty(data.currentPlayer)) {

                //             //enable or disable buttons depending on conditions
                //             var totalRoundAmount = 0;
                //             var remainingBalance = data.currentPlayer.buyInAmt - data.currentPlayer.totalAmount;
                //             allData.isChecked = false;
                //             allData.isCalled = false;
                //             allData.isRaised = false;
                //             allData.fromRaised = 0;
                //             allData.toRaised = 0;
                //             if (data.callAmount <= 0) {
                //                 allData.isChecked = true;
                //             }

                //             _.each(data.pots, function (p) {
                //                 totalRoundAmount += p.potMaxLimit;
                //             });

                //             var maxAmountObj = _.maxBy(allData.table.currentRoundAmt, "amount");
                //             if (!maxAmountObj && _.isEmpty(maxAmountObj)) {
                //                 maxAmount = 0;
                //             } else {
                //                 maxAmount = maxAmountObj.amount;
                //             }
                //             allData.fromRaised = maxAmount + 100;
                //             if (maxAmount == 0) {
                //                 allData.fromRaised = allData.table.bigBlind;
                //             }
                //             // console.log("allData.fromRaised", allData.fromRaised);


                //             // console.log("remainingBalance", remainingBalance);
                //             // console.log("data.payableAmt", data.payableAmt);
                //             if (remainingBalance >= data.callAmount && !allData.isChecked) {
                //                 allData.isCalled = true;
                //             }

                //             allData.toRaised = remainingBalance;

                //             if (allData.toRaised > data.allInAmount) {
                //                 allData.toRaised = data.allInAmount;
                //             }

                //             if (remainingBalance >= allData.fromRaised && allData.fromRaised < allData.toRaised) {
                //                 allData.isRaised = true;
                //             }
                //             // allData.isRaised = true;
                //             delete allData.tableStatus;
                //             delete allData.currentPlayer;
                //             delete allData.callAmount;
                //             delete allData.allInAmount;
                //             callback(null, allData);
                //         } else {
                //             callback(null, allData);
                //         }
                //     }

                // });
            }
            //send isckecked and raise amount( from to end)   
        });
    },


requiredData: function () {
        var data = {};
        data.table = {
            minimumBuyin: 1,
            smallBlind: 1,
            bigBlind: 1,
            name: 1,
            maximumNoOfPlayers: 1,
            status: 1,
            currentRoundAmt: 1,
            timeoutTime: 1
        };
        data.player = {
            playerNo: 1,
            socketId: 1,
            hasRaised: 1,
            buyInAmt: 1,
            hasTurnCompleted: 1,
            isSmallBlind: 1,
            isBigBlind: 1,
            totalAmount: 1,
            hasCalled: 1,
            hasChecked: 1,
            isAllIn: 1,
            cards: 1,
            isDealer: 1,
            isFold: 1,
            isActive: 1,
            isTurn: 1,
            isLastBlind: 1,
            user: 1,
            tableLeft: 1
        };

        data.communityCards = {
            cardNo: 1,
            isBurn: 1,
            cardValue: 1,
            serve: 1
        };

        data.pot = {
            totalAmount: 1,
            players: 1,
            type: 1,
            winner: 1
        };
        return data;
    },

    getTabDetail: function (data, callback) {
        async.parallel({
            playerCards: function (callback) {
                Player.find({
                    playerNo: data.tabId
                }, {
                    playerNo: 1,
                    isTurn: 1,
                    isActive: 1,
                    isDealer: 1,
                    isFold: 1,
                    cards: 1,
                    _id: 0
                }).exec(callback);
            }
        }, callback);

    },

    /**
     * @function {function newGame}
     * @param  {callback} callback {function with err and response}
     * @return {type} {flush gamelogs and creates new game}
     */
    newGame: function (data, callback) {
        var Model = this;
        async.waterfall([
            function (callback) {
                GameLogs.flush(function (err, data) {
                    callback(err);
                });
            },
            function (callback) { // Next Dealer
                Model.find({
                    isActive: true
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return n.isDealer;
                        });
                        if (turnIndex >= 0) {
                            async.parallel({
                                removeDealer: function (callback) {
                                    var player = players[turnIndex];
                                    player.isDealer = false;
                                    player.save(callback);
                                },
                                addDealer: function (callback) {
                                    var newTurnIndex = (turnIndex + 1) % players.length;
                                    var player = players[newTurnIndex];
                                    player.isDealer = true;
                                    player.save(callback);
                                }
                            }, function (err, data) {
                                callback();
                            });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });
            },
            function (fwCallback) {
                Model.update({}, {
                    $set: {
                        isFold: false,
                        cards: [],
                        isTurn: false,
                        isLastBlind: false,
                        hasRaised: false,
                        isAllIn: false,
                        isBlind: true
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    fwCallback(err, cards);
                });
            },
            function (arg1, callback) {
                SideShow.remove({}, callback);
            },
            function (arg1, fwCallback) {
                Setting.update({
                    name: "turnLimit"
                }, {
                    $set: {
                        value: 1
                    }
                }, {
                    new: true
                }, function (err, CurrentTab) {
                    fwCallback(err, CurrentTab);
                });
            },
            function (arg1, fwCallback) {
                GameType.update({

                }, {
                    $set: {
                        jokerCard: ""
                    }
                }, {
                    new: true,
                    multi: true
                }, function (err, CurrentTab) {
                    fwCallback(err, CurrentTab);
                });
            }
        ], function (err, cumCards) {
            Player.blastSocket({
                newGame: true
            });
            callback(err, cumCards);
        });
        readLastValue = "";
        cardServed = false;
    },
    /**
     * @function {function makeDealer}
     * @param  {type} data     {player data}
     * @param  {callback} callback {function with err and response}
     * @return {type} {creates new dealer}
     */
    makeDealer: function (data, callback) {
        var Model = Player;
        async.waterfall([
            function (callback) {
                Player.update({}, {
                    $set: {
                        isDealer: false
                    }
                }, {
                    multi: true
                }, callback);
            },
            function (val, callback) {
                Player.find({
                    isActive: true
                }).exec(function (err, players) {
                    if (err) {
                        console.log("in if")
                        callback(err);
                    } else {
                        console.log("in else")
                        var playerIndex = _.findIndex(players, function (player) {
                            return player.playerNo == parseInt(data.tabId);
                        });
                        if (playerIndex >= 0) {
                            async.parallel({
                                addDealer: function (callback) {
                                    players[playerIndex].isDealer = true;
                                    players[playerIndex].save(callback);
                                },
                                addBlind: function (callback) {
                                    var skipBlind = 2;
                                    if (data.isStraddle) {
                                        skipBlind = 3;
                                    }
                                    var turnIndex = (playerIndex + skipBlind) % players.length;
                                    players[turnIndex].isLastBlind = true;
                                    players[turnIndex].save(callback);
                                }
                            }, function (err, data) {
                                Model.blastSocket();
                                callback(err, data);
                            });
                        } else {
                            callback("No Such Player");
                        }
                    }
                });
            }
        ], callback);
    },


    /**
     * @function {function removeDealer}
     * @param  {type} data     {player data}
     * @param  {callback} callback {function with err and response}
     * @return {type} {remove player as a dealer}
     */
    removeDealer: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isDealer: false
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            callback(err, CurrentTab);
        });
    },
    removeTab: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isActive: false
            }
        }, {
            new: true
        }, function (err, currentTab) {
            Player.blastSocket();
            callback(err, currentTab);
        });
    },
    addTab: function (data, callback) {
        var Model = this;
        Model.findOneAndUpdate({
            playerNo: data.tabId
        }, {
            $set: {
                isActive: true
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            Player.blastSocket();
            callback(err, CurrentTab);
        });
    },

    // serve: function (data, callback) {
    //     if (data.card && data.card.length == 2) {
    //         async.parallel({
    //             players: function (callback) {
    //                 Player.find({
    //                     isActive: true
    //                 }).exec(callback);
    //             },
    //             communityCards: function (callback) {
    //                 CommunityCards.find().exec(callback);
    //             },
    //             currentGameType: function (callback) {
    //                 GameType.find({}).exec(
    //                     function (err, data) {
    //                         if (err) {
    //                             callback(err);
    //                         } else {
    //                             var gameIndex = _.findIndex(data, function (game) {
    //                                 return game.currentType
    //                             });
    //                             if (gameIndex >= 0) {
    //                                 callback(err, data[gameIndex]);
    //                             } else {
    //                                 var normalGameIndex = _.findIndex(data, function (game) {
    //                                     return game.name == 'Normal';
    //                                 });
    //                                 if (normalGameIndex >= 0) {
    //                                     callback(err, data[normalGameIndex]);
    //                                 } else {
    //                                     callback();
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 );
    //             }
    //         }, function (err, response) {
    //             // Initialize all variables
    //             var allCards = [];
    //             var playerCards = [];
    //             var cardsToServe = response.currentGameType.totalCards;
    //             var currentGame = response.currentGameType.name;
    //             var playerCount = response.players.length;
    //             var communityCards = [];
    //             var communityCardCount = 0;
    //             var dealerNo = -1;
    //             var maxCommunityCard = 0;
    //             var maxCardsPerPlayer = cardsToServe;
    //             var playerServe = true;
    //             _.each(response.players, function (player, index) {
    //                 playerCards = _.concat(playerCards, player.cards);
    //                 if (player.isDealer) {
    //                     dealerNo = index;
    //                 }
    //             });

    //             _.each(response.communityCards, function (commuCard) {
    //                 if (commuCard.cardValue && commuCard.cardValue !== "") {
    //                     communityCards = _.concat(communityCards, commuCard.cardValue);
    //                 }
    //             });
    //             communityCardCount = communityCards.length;
    //             allCards = _.concat(communityCards, playerCards);



    //             // check whether no of players are greater than 1
    //             if (playerCount <= 1) {
    //                 callback("Less Players - No of Players selected are too less");
    //                 return 0;
    //             }

    //             // check whether dealer is provided or not
    //             if (dealerNo < 0) {
    //                 callback("Dealer is not selected");
    //                 return 0;
    //             }

    //             // Check whether Card is in any Current Cards List
    //             var cardIndex = _.indexOf(allCards, data.card);
    //             if (cardIndex >= 0) {
    //                 callback("Duplicate Entry - Card Already Used");
    //                 return 0;
    //             }

    //             if (currentGame == 'Joker' && allCards.length == 0 && _.isEmpty(response.currentGameType.jokerCard)) {
    //                 response.currentGameType.jokerCard = data.card;
    //                 playerServe = false;
    //                 response.currentGameType.save(function (err, data1) {
    //                     //console.log("JokerCard assigned", data.card);
    //                     Player.blastSocket();
    //                     callback(err, "JokerCard assigned");
    //                     return 0;
    //                 });

    //             } else {
    //                 if (playerCards.length < (playerCount * maxCardsPerPlayer)) {
    //                     // Add card to Players
    //                     var remainder = playerCards.length % playerCount;
    //                     var toServe = (dealerNo + remainder + 1) % playerCount;
    //                     var toServePlayer = response.players[toServe];
    //                     toServePlayer.cards.push(data.card);
    //                     toServePlayer.save(function (err, data) {
    //                         if (err) {
    //                             callback(err);
    //                         } else {
    //                             callback(err, "Card Provided to Player " + response.players[toServe].playerNo);
    //                             if (playerCards.length + 1 == (playerCount * maxCardsPerPlayer)) {
    //                                 Player.makeTurn("", function (err, data) {
    //                                     Player.blastSocket({
    //                                         player: true,
    //                                         value: response.players[toServe].playerNo
    //                                     });
    //                                 });
    //                             } else {
    //                                 Player.blastSocket({
    //                                     player: true,
    //                                     value: response.players[toServe].playerNo
    //                                 });
    //                             }
    //                         }
    //                     });
    //                 } else if (communityCardCount < maxCommunityCard) {
    //                     // Add card to Community Cards
    //                     var toServeCommuCard = response.communityCards[communityCardCount];
    //                     toServeCommuCard.cardValue = data.card;
    //                     toServeCommuCard.save(function (err, data) {
    //                         if (err) {
    //                             callback(err);
    //                         } else {

    //                             callback(err, "Card Provided to Community Card No " + (communityCardCount + 1));

    //                             if (communityCardCount == 3 || communityCardCount == 5 || communityCardCount == 7) {
    //                                 Player.makeTurn(communityCardCount, function (err, data) {
    //                                     Player.blastSocket({
    //                                         player: false,
    //                                         value: communityCardCount
    //                                     });
    //                                 });
    //                             } else {
    //                                 Player.blastSocket({
    //                                     player: false,
    //                                     value: communityCardCount
    //                                 });
    //                             }
    //                         }
    //                     });
    //                 } else {
    //                     callback("All Cards are Served");
    //                     return 0;
    //                 }
    //             }
    //         });
    //     } else {
    //         callback("Incorrect Card - Please enter a valid Card");
    //         return 0;
    //     }

    // },



    //  serve: function (data, callback) {
    //         console.log(data);
    //         Table.findOne({
    //             _id: data.tableId
    //         }).exec(function (err, table) {
    //             if (err || _.isEmpty(table)) {
    //                 callback(err);
    //             } else {
    //                 if (table.setDealer) {
    //                     Player.serveCard(data, callback);
    //                 } else {
    //                     Player.makeDealer(data, function (err, dealer) {
    //                         if (err) {
    //                             callback(err);
    //                         } else {
    //                             Player.serveCard(data, callback);
    //                         }
    //                     });
    //                 }
    //             }
    //         });

    //     },

    /**
     * @function {function checkDealer}
     * @param  {type} tableId  {id of table for which dealer to be checked}
     * @param  {callback} callback {function with err and response}
     * @return {type} {dealer data}
     */
    checkDealer: function (tableId, callback) {
        Player.findOne({
            isActive: true,
            table: tableId,
            isDealer: true
        }).exec(callback);
    },




    /**
     * @function {function makeSeen}
     * @param  {object} data     {data of player}
     * @param  {callback} callback {function with err and response}
     * @return {type} {makes player's isBlind false}
     */
    makeSeen: function (data, callback) {
        var Model = this;
        var cond = {};
        if (data.playerNo) {
            cond = {
                playerNo: data.playerNo
            }
        } else {
            cond = {
                isTurn: true
            }
        }
        console.log("Inside the makeSeen");
        Model.findOneAndUpdate(cond, {
            $set: {
                isBlind: false
            }
        }, {
            new: true
        }, function (err, currentTab) {
            Player.blastSocket();
            callback(err, currentTab);
        });
    },

    blastSocket: function (data, fromUndo) {
        Player.getAll({}, function (err, allData) {
            if (!fromUndo) {
                GameLogs.create(function () {});
            }

            if (err) {
                console.log(err);
            } else {
                if (data) {
                    allData.extra = data;
                } else {
                    allData.extra = {};
                }
                sails.sockets.blast("Update", allData);
            }
        });
    },
    blastSocketSideShow: function (data) {
        sails.sockets.blast("sideShow", {
            data: data
        });
    },
    cancelSideShow: function (callback) {
        async.waterfall([Player.currentTurn,
            function (player, callback) {
                sails.sockets.blast("sideShowCancel", {
                    data: player
                });
                callback();
            },
            Player.changeTurn
        ], function (err, data) {
            callback(err, data);
        });
    },
    blastSocketWinner: function (data) {
        // var newWinner = _.filter(data.winners, function (n) {
        //     return n.winner;
        // });
        // var finalWinner = _.map(newWinner, function (n) {
        //     var obj = {
        //         cards: n.cards,
        //         descr: n.descr,
        //         playerNo: n.playerNo
        //     };
        //     return obj;
        // });
        sails.sockets.blast("showWinner", {
            data: data
        });
    },
    allIn: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isLastBlind: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.isAllIn = true;
                player.hasRaised = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },


    /**
     * @function {function doSideShow}
     * @param  {callback} callback {function with err and response}
     */
    doSideShow: function (callback) {

        async.waterfall([
            Player.currentTurn,
            function (playerFromTop, callback) {
                GameType.find({}).exec(
                    function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            var gameIndex = _.findIndex(data, function (game) {
                                return game.currentType
                            });
                            if (gameIndex >= 0) {
                                callback(err, playerFromTop, data[gameIndex]);
                            } else {
                                var normalGameIndex = _.findIndex(data, function (game) {
                                    return game.name == 'Normal';
                                });
                                if (normalGameIndex >= 0) {
                                    callback(err, playerFromTop, data[normalGameIndex]);
                                } else {
                                    callback();
                                }
                            }
                        }
                    }
                );
            },
            function (playerFromTop, gameType, callback) {
                Player.find({
                    $or: [{
                        isActive: true,
                        isFold: false,
                    }, {
                        isTurn: true
                    }]
                }).lean().exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            var nextPlayer = (turnIndex - 1) % players.length;
                            if (nextPlayer < 0) {
                                nextPlayer = players.length - 1;
                            }
                            var finalData = [];
                            finalData.push(players[nextPlayer]);
                            finalData.push(players[turnIndex]);
                            CommunityCards.findWinner(finalData, gameType, function (err, winnerData) {
                                if (err) {
                                    callback(err);
                                } else {
                                    var looseIndex = _.findIndex(finalData, function (value) {
                                        return (value.winRank == 2);
                                    });

                                    var turnIndex1 = _.findIndex(finalData, function (value) {
                                        return value.isTurn;
                                    });

                                    if (looseIndex >= 0) {
                                        if (looseIndex == turnIndex1) {
                                            console.log("Loose index is equal to turn index", looseIndex, turnIndex1, winnerData);
                                            async.parallel([
                                                Player.fold,
                                                function (callback) {
                                                    var sideShowData = {};
                                                    sideShowData.fromPlayerNo = players[turnIndex].playerNo;
                                                    sideShowData.toPlayerNo = players[nextPlayer].playerNo;
                                                    sideShowData.winner = finalData;
                                                    SideShow.saveData(sideShowData, callback);
                                                }

                                            ], function (err, data) {
                                                if (err) {
                                                    callback(err);
                                                } else {
                                                    GameLogs.create(function () {
                                                        Player.blastSocket();
                                                        //callback();
                                                        return 0;
                                                    });

                                                }
                                            });

                                        } else {
                                            console.log("inside the condition");
                                            async.waterfall([
                                                    Player.changeTurnPrv,
                                                    function (data, callback) {
                                                        Player.fold({}, function (err, data) {
                                                            callback(err);
                                                        });
                                                    },
                                                    Player.changeTurn,
                                                    function (data, callback) {
                                                        var sideShowData = {};
                                                        sideShowData.fromPlayerNo = players[turnIndex].playerNo;
                                                        sideShowData.toPlayerNo = players[nextPlayer].playerNo;
                                                        sideShowData.winner = finalData;
                                                        console.log(sideShowData);
                                                        //console.log(callback);
                                                        SideShow.saveData(sideShowData, function (err, data) {
                                                            callback(err);
                                                        });
                                                    }


                                                ],
                                                function (err, data) {
                                                    if (err) {
                                                        callback(err);
                                                    } else {
                                                        GameLogs.create(function () {
                                                            console.log("inside the condition.........");
                                                            //  Player.blastSocket({},true);
                                                            // callback();
                                                            return 0;
                                                        }, 3);
                                                    }
                                                });
                                        }
                                    } else {
                                        sync.parallel([
                                            Player.changeTurn,
                                            function (callback) {
                                                var sideShowData = {};
                                                sideShowData.fromPlayerNo = players[turnIndex].playerNo;
                                                sideShowData.toPlayerNo = players[nextPlayer].playerNo;
                                                sideShowData.winner = finalData;
                                                console.log(sideShowData);
                                                SideShow.saveData(sideShowData, callback);
                                            }

                                        ], function (err, data) {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                GameLogs.create(function () {
                                                    Player.blastSocket();
                                                    // callback();
                                                    return 0;
                                                });

                                            }
                                        });

                                    }
                                }

                            });

                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);
    },

    sideShow: function (callback) {
        async.waterfall([
            Player.currentTurn,
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        isActive: true,
                        isFold: false,
                    }, {
                        isTurn: true
                    }]
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            var nextPlayer = (turnIndex - 1) % players.length;
                            if (nextPlayer < 0) {
                                nextPlayer = players.length - 1;
                            }
                            var finalData = {};
                            finalData.toPlayer = players[nextPlayer];
                            finalData.fromPlayer = players[turnIndex];
                            Player.blastSocketSideShow(finalData);
                            callback(null, finalData);
                            // async.parallel({
                            //     removeTurn: function (callback) {
                            //         var player = players[turnIndex];
                            //         player.isTurn = false;
                            //         player.save(callback);
                            //     },
                            //     addTurn: function (callback) {
                            //         var newTurnIndex = (turnIndex + 1) % players.length;
                            //         var player = players[newTurnIndex];
                            //         player.isTurn = true;
                            //         player.save(callback);
                            //     }
                            // }, function (err, data) {
                            //     callback(err, data);
                            //     Player.blastSocket();
                            //     // Player.whetherToEndTurn(data.removeTurn[0], data.addTurn[0], function (err) {
                            //     //     Player.blastSocket();
                            //     // });
                            // });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);
    },




    /**
     * @function {function currentTurn}
     * @param  {callback} callback {function with err and response}
     * @return {type} {player whose isTurn is true}
     */
    currentTurn: function (callback) {
        Player.findOne({
            isTurn: true
        }).exec(function (err, data) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(data)) {
                callback("No Player Has Turn");
            } else {
                callback(null, data);
            }
        });
    },
    changeTurnPrv: function (callback, makeChaal = false) {
        async.waterfall([
            function (callback) {
                Player.update({}, {
                    $set: {
                        isChaal: false
                    }
                }, {
                    multi: true
                }).exec(function (err, data) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        isActive: true,
                        isFold: false,
                    }, {
                        isTurn: true
                    }]
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            async.parallel({
                                removeTurn: function (callback) {
                                    var player = players[turnIndex];
                                    player.isTurn = false;
                                    if (makeChaal) {
                                        player.isChaal = true;
                                    }
                                    player.save(callback);
                                },
                                addTurn: function (callback) {
                                    var newTurnIndex = (turnIndex - 1) % players.length;
                                    if (newTurnIndex < 0) {
                                        newTurnIndex = players.length - 1;
                                    }
                                    var player = players[newTurnIndex];
                                    player.isTurn = true;
                                    player.save(callback);
                                },
                                turnLimit: function (callback) {
                                    Setting.findOne({
                                        name: "turnLimit"
                                    }).exec(callback);
                                }
                            }, function (err, data) {
                                callback(err, data);
                                Player.blastSocket();

                                Player.whetherToEndTurn(data.removeTurn[0], data.addTurn[0], data.turnLimit, function (err) {
                                    Player.blastSocket();
                                });

                            });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);
    },
    changeTurn: function (callback, makeChaal = false) {
        async.waterfall([
            function (callback) {
                Player.update({}, {
                    $set: {
                        isChaal: false
                    }
                }, {
                    multi: true
                }).exec(function (err, data) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (playerFromTop, callback) {
                Player.find({
                    $or: [{
                        isActive: true,
                        isFold: false,
                    }, {
                        isTurn: true
                    }]
                }).exec(function (err, players) {
                    if (err) {
                        callback(err);
                    } else {
                        var turnIndex = _.findIndex(players, function (n) {
                            return (n._id + "") == (playerFromTop._id + "");
                        });
                        if (turnIndex >= 0) {
                            async.parallel({
                                removeTurn: function (callback) {
                                    var player = players[turnIndex];
                                    player.isTurn = false;
                                    if (makeChaal) {
                                        player.isChaal = true;
                                    }
                                    player.save(callback);
                                },
                                addTurn: function (callback) {
                                    var newTurnIndex = (turnIndex + 1) % players.length;
                                    var player = players[newTurnIndex];
                                    player.isTurn = true;
                                    player.save(callback);
                                },
                                turnLimit: function (callback) {
                                    Setting.findOne({
                                        name: "turnLimit"
                                    }).exec(callback);
                                }
                            }, function (err, data) {
                                callback(err, data);
                                Player.blastSocket();

                                Player.whetherToEndTurn(data.removeTurn[0], data.addTurn[0], data.turnLimit, function (err) {
                                    Player.blastSocket();
                                });

                            });
                        } else {
                            callback("No Element Remaining");
                        }
                    }
                });

            }
        ], callback);
    },
    makeTurn: function (cardNo, callback) {
        var findInitialObj = {};
        async.waterfall([
            function (callback) {
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isTurn: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            function (callback) { // There is an MAIN Error where there is no dealer or No isLastBlind
                if (cardNo == "LastPlayerCard") {
                    Player.findLastBlindNext(callback);
                } else {
                    async.waterfall(
                        [
                            function (callback) {
                                Player.update({}, {
                                    $set: {
                                        hasRaised: false,
                                        isLastBlind: false,
                                        isTurn: false
                                    }
                                }, {
                                    multi: true
                                }, function (err) {
                                    callback(err);
                                });
                            },
                            Player.findDealerNext
                        ], callback);
                }
            },
            function (player, callback) { // Enable turn from the same
                player.isTurn = true;
                player.save(callback);
            }
        ], callback);
    },
    raise: function (data, callback) {
        async.waterfall([
            function (callback) { // Remove All raise
                Player.update({}, {
                    $set: {
                        hasRaised: false,
                        isLastBlind: false
                    }
                }, {
                    multi: true
                }, function (err, cards) {
                    callback(err);
                });
            },
            Player.currentTurn,
            function (player, callback) {
                player.hasRaised = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },


    /**
     * @function {function fold}
     * @param  {object} data     {data of player whom to fold}
     * @param  {callback} callback {function with err and response}
     * @return {type} {folds that particular player}
     */
    fold: function (data, callback) {
        async.waterfall([
            Player.currentTurn,
            function (player, callback) {
                player.isFold = true;
                player.save(function (err, data) {
                    callback(err);
                });
            },
            Player.changeTurn
        ], callback);
    },
    whetherToEndTurn: function (fromPlayer, toPlayer, turnLimit, callback) {
        Player.find({
            $or: [{
                isActive: true,
                isFold: false,

            }, {
                isDealer: true
            }]
        }).sort({
            playerNo: 1
        }).exec(function (err, allPlayers) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(allPlayers)) {
                callback("No Players found in Whether to end turn");
            } else {


                var removeAllTurn = false;


                var turnIndex = _.findIndex(allPlayers, function (n) {
                    return n.isTurn;
                });

                var dealerIndex = _.findIndex(allPlayers, function (n) {
                    return n.isDealer;
                });

                var isDealerFoldIndex = _.findIndex(allPlayers, function (n) {
                    return (n.isDealer && n.isFold);
                });

                var newTurnIndex = (dealerIndex + 1) % allPlayers.length;

                var totalActive = _.filter(allPlayers, function (n) {
                    return (!n.isFold && n.isActive);
                });

                var blindIndex = _.findIndex(allPlayers, function (n) {
                    return (!n.isFold && n.isBlind);
                });
                if (fromPlayer.playerNo == toPlayer.playerNo) {

                    removeAllTurn = true;
                }
                console.log("totalActive", totalActive);
                // only 1 player left
                if (totalActive.length == 1) {
                    removeAllTurn = true;
                }
                if (removeAllTurn) {
                    //Show Winner to be checked
                    Player.update({}, {
                        $set: {
                            isTurn: false
                        }
                    }, {
                        multi: true
                    }, function () {
                        callback();

                    });
                } else {

                    // if (turnLimit.value == 4 && blindIndex >= 0) {
                    //     //console.log(totalBlind.length);
                    //     Player.update({
                    //         isActive: true,
                    //         isFold: false
                    //     }, {
                    //         $set: {
                    //             isBlind: false
                    //         }
                    //     }, {
                    //         multi: true
                    //     }, function (err, data) {
                    //         Player.blastSocket();
                    //         callback(err, data);
                    //     });
                    // }

                    // //console.log("fromPlayer", fromPlayer)
                    // if ((isDealerFoldIndex < 0 && turnIndex == dealerIndex) || (isDealerFoldIndex >= 0 && turnIndex == newTurnIndex && fromPlayer.playerNo != allPlayers[dealerIndex].playerNo)) {

                    //     // if(data.value == 3 && totalBlind && allPlayer.length == totalBlind.length){
                    //     //     removeAllTurn = true;
                    //     // }else{
                    //     if (!_.isEmpty(turnLimit)) {
                    //         // console.log("blind", totalBlind.length);
                    //         // console.log("allplayer", allPlayers.length);
                    //         // console.log("datavalue", data.value);

                    //         //console.log(totalBlind.length);

                    //         turnLimit.value = Number(turnLimit.value) + 1;
                    //         turnLimit.save(function (data) {});

                    //     } else {

                    //         data = {};
                    //         data.name = "turnLimit";
                    //         data.value = 1;
                    //         Setting.saveData(data, function (data) {});
                    //     }
                    //     //  }

                    // }
                }
                //case 2 from Player and To Player is Same

            }
        });


    },
    findLastBlindNext: function (callback) {
        async.waterfall([
            function (callback) {
                Player.findOne({
                    isLastBlind: true
                }).exec(callback);
            },
            Player.nextInPlay
        ], callback);

    },
    findDealerNext: function (callback) {
        async.waterfall([
            function (callback) {
                Player.findOne({
                    isDealer: true
                }).exec(callback);
            },
            Player.nextInPlay
        ], callback);
    },
    nextInPlay: function (player, callback) {
        if (player) {
            Player.find({
                isActive: true,
                isFold: false,
                isAllIn: false
            }).sort({
                playerNo: 1
            }).exec(function (err, players) {
                if (err) {
                    callback(err);
                } else if (_.isEmpty(players)) {
                    callback("No Next In Play");
                } else {
                    var finalPlayer = _.find(players, function (n) {
                        return (n.playerNo > player.playerNo);
                    });
                    if (finalPlayer) {
                        callback(err, finalPlayer);
                    } else {
                        callback(err, players[0]);
                    }
                }
            });
        } else {
            callback("No Player selected for Next");
        }

    },



    /**
     * @function {function serve}
     * @param  {type} data     {description}
     * @param  {callback} callback {function with err and response}
     * @return {type} {serve cards to all players}
     */
    serve: function (data, callback) {
        async.parallel({
            players: function (callback) {
                Player.find({
                    isActive: true
                }).exec(callback);

            },

        }, function (err, response) {

            var allCards = [];
            var playerCards = [];
            var playerCount = response.players.length;
            var palyers = response.players;
            var dealerNo = 1;
            var maxCardsPerPlayer = 3;
            var maxCards = [1, 2, 3];

            // check whether no of players are greater than 1
            if (playerCount <= 1) {
                callback("Less Players - No of Players selected are too less");
                return 0;
            }

            // check whether dealer is provided or not
            if (dealerNo < 0) {
                callback("Dealer is not selected");
                return 0;
            }
            //for serving

            // console.log("player count",playerCount);
            // console.log("playerssssss",palyers);

            var cardArr = [
                "As", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "Ts", "Js", "Qs", "Ks", "Ad", "2d", "3d", "4d", "5d", "6d", "7d", "8d", "9d", "Td", "Jd", "Qd", "Kd", "Ac", "2c", "3c", "4c", "5c",
                "6c", "7c", "8c", "9c", "Tc", "Jc", "Qc", "Kc", "Ah", "2h", "3h", "4h", "5h", "6h", "7h", "8h", "9h", "Th", "Jh", "Qh", "Kh",
            ];

            // _.each(cardArr, function (card) {
            _.each(palyers, function (player) {
                _.each(maxCards, function (maxCard) {
                    var card1 = cardArr[_.random(0, cardArr.length)];
                    player.cards.push(card1);
                    console.log("player.cards.......", player.cards)
                    var index = _.indexOf(cardArr, card1);
                    cardArr.splice(index, 1);
                });
            });
            callback(null, palyers);
            console.log("players", palyers);

        });
    }
};
module.exports = _.assign(module.exports, exports, model);