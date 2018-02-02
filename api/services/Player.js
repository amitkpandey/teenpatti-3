var schema = new Schema({
    playerNo: {
        type: Number,
        required: true,
        unique: true,
        // excel: true,
    },
    buyInAmt: {
        type: Number,
        default: 0
    },


loosingAmt: {
        type: Number,
        default: 0
    },

    amtToPlay: {
        type: Number,
        default: 0
    },

   maxBlind : {
        type: Number,
        default: 0
    },

    maxSeen : {
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


    isAllIn: {
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
var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "cards", "cards","table","table"));

var model = {
    addPlayer: function (data, callback) {
        Player.saveData(data, function (err, data2) {
            console.log("data..............",data);
            if (err) {
                callback(err, data2);
            } else {
                data3 = data2.toObject();
                delete data3.password;
                callback(err, data3);
            }
        });
    },
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
    showWinner: function (callback) {
        async.parallel({
            players: function (callback) {
                Player.find({
                    isActive: true,
                    isFold: false
                }).lean().exec(callback);
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
                                    return game.name == 'Normal';
                                });
                                if (normalGameIndex >= 0) {
                                    callback(err, data[normalGameIndex]);
                                } else {
                                    callback();
                                }
                            }
                        }
                    }
                );
            },
            sideShows: function (callback) {
                SideShow.find({}, {
                    fromPlayerNo: 1,
                    toPlayerNo: 1,
                    winner: 1
                }).lean().exec(callback);
            }
        }, function (err, data) {
            if (err) {
                callback(err);
            } else {
                //Check All Player Cards are Placed
                CommunityCards.findWinner(data.players, data.currentGameType, function (err, finalVal) {
                    if (err) {
                        callback(err);
                    } else {
                        console.log("data.players", data.players);
                        Player.blastSocketWinner({
                            winners: data.players,
                            gameType: data.currentGameType,
                            sideShows: data.sideShows
                            // communityCards: data.communityCards
                        });
                        callback(null, {
                            winners: data.players,
                            gameType: data.currentGameType,
                            sideShows: data.sideShows
                            //communityCards: data.communityCards
                        });
                    }
                });

            }
        });
    },
    revealCards: function (data, callback) {
        CommunityCards.find({
            isOpen: true
        }).exec(function (err, cardsData) {
            var revealNo = cardsData.length;
            switch (revealNo) {
                case 0:
                    CommunityCards.update({
                        cardNo: {
                            $lt: 4
                        }
                    }, {
                        $set: {
                            isOpen: true
                        }
                    }, {
                        multi: true
                    }, function (err, data) {
                        Player.blastSocket();
                        callback(err, data);
                    });
                    break;
                case 3:
                    CommunityCards.update({
                        cardNo: 4
                    }, {
                        $set: {
                            isOpen: true
                        }
                    }, {
                        multi: true
                    }, function (err, data) {
                        Player.blastSocket();
                        callback(err, data);
                    });
                    break;
                case 4:
                    CommunityCards.update({
                        cardNo: 5
                    }, {
                        $set: {
                            isOpen: true
                        }
                    }, {
                        multi: true
                    }, function (err, data) {
                        Player.blastSocket();
                        callback(err, data);
                    });
                    break;
                default:
                    callback(null, "No more cards to reveal");
            }
        });
    },
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
    makeDealer: function (data, callback) {
        console.log("data in dealre",data);
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
                    console.log("palyers@@@@@@@@",players)
                    if (err) {
                        console.log("in if")
                        callback(err);
                    } else {
                        console.log("in else")
                        var playerIndex = _.findIndex(players, function (player) {
                            console.log("palyerIndex@@@@@@@@",playerIndex)
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
    assignCard: function (card, wfCallback) {
        var Model = this;
        Model.findOneAndUpdate({
            isTurn: true,
            cardsServe: {
                $lt: 2
            }
        }, {
            $push: {
                cards: card
            },
            $inc: {
                cardsServe: 1
            }
        }, {
            new: true
        }, function (err, CurrentTab) {
            if (!_.isEmpty(CurrentTab)) {
                readLastValue = card;
                wfCallback(err, CurrentTab);
            } else {
                //$nin    
                CommunityCards.findOneAndUpdate({
                    $or: [{
                        cardValue: {
                            $in: ["", undefined, null]
                        }
                    }, {
                        cardValue: {
                            $exists: false
                        }
                    }]
                }, {
                    cardValue: card
                }, {
                    new: true,
                    sort: {
                        cardValue: 1
                    }
                }, function (err, CurrentTab) {
                    readLastValue = card;
                    if (!_.isEmpty(CurrentTab)) {
                        if (CurrentTab.cardNo == 5) {
                            cardServed = true;
                            Model.changeTurnWithDealer(wfCallback);
                        } else {
                            wfCallback(err, CurrentTab);
                        }
                    } else {
                        wfCallback(err, "Extra Card");
                    }

                    //callback(null, "Repeated Card"); 
                });
            }
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




 serve: function (data, callback) {
        console.log(data);
        Table.findOne({
            _id: data.tableId
        }).exec(function (err, table) {
            if (err || _.isEmpty(table)) {
                callback(err);
            } else {
                if (table.setDealer) {
                    Player.serveCard(data, callback);
                } else {
                    Player.makeDealer(data, function (err, dealer) {
                        if (err) {
                            callback(err);
                        } else {
                            Player.serveCard(data, callback);
                        }
                    });
                }
            }
        });

    },





 checkDealer: function (tableId, callback) {
        Player.findOne({
            isActive: true,
            table: tableId,
            isDealer: true
        }).exec(callback);
    },





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
                                // winnerData

                                //data
                                // console.log("data", finalData);

                            });

                            // Player.blastSocketSideShow(finalData);

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


};
module.exports = _.assign(module.exports, exports, model);