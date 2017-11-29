var schema = new Schema({
    cardNo: {
        type: Number,
        required: true
    },
    isOpen: {
        type: Boolean,
        default: false,
        required: true
    },
    cardValue: {
        type: String,
        default: ""
    },
    isBurn: {
        type: Boolean,
        default: false
    }
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);

module.exports = mongoose.model('CommunityCards', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    createCards: function (callback) {
        var Model = this;
        var cardsNo = [1, 2, 3, 4, 5];
        _.each(cardsNo, function (value, key) {
            Model.saveData({
                cardNo: value
            }, function (err, data2) {
                if (err) {
                    if (value == 1) {
                        callback(err, data2);
                    }
                } else {}
            });
        });
        callback(null, "Cards Created");
    },
    findWinner: function (players, callback) {
        var playerCardsNotPresent = _.findIndex(players, function (player) {
            return player.cards.length === 0;
        });
        if (playerCardsNotPresent >= 0) {
            callback("Cards not Distributed");
            return 0;
        }


        _.each(players, function (player) {
            player.allCards = _.cloneDeep(player.cards);
            player.detail = teenPattiSolver(player.allCards);
        });
        var scores = _.reverse(_.sortedUniq(_.map(players, "detail.score")));
        var Rank = 1;
        _.each(scores, function (value, key) {
            var winners = _.filter(players, function (data) {
                return (data.detail.score == value)
            });
            _.each(winners, function (data) {
                if (Rank == 1) {
                    data.winner = true;
                }
                data.winRank = Rank
            });
            Rank++;
        });
        console.log(scores);
        console.log("players", players);
        callback();
    },
    removeCards: function (data, callback) {
        CommunityCards.find().sort({
            cardNo: 1
        }).exec(function (err, allCards) {
            if (err) {
                callback(err);
            } else {
                var cards = _.filter(allCards, function (n, index) {
                    return (index >= data.cardIndex);
                });
                console.log(cards);
                async.concat(cards, function (card, callback) {
                    card.cardValue = "";
                    card.save(callback);
                }, function (err, data) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(err, data);
                        Player.blastSocket();
                    }
                });
            }
        });
    }
};
module.exports = _.assign(module.exports, exports, model);