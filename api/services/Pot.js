var schema = new Schema({
   table: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    players: [{
        playerNo: {
            type: Number,
        },
        amount: {
            type: Number,
            default: 0
        }
    }],
    type: {
        type: String,
        enum: ['main', 'side']
    },
    winner: {
        type: Schema.Types.Mixed,
    }
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Pot', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {};
module.exports = _.assign(module.exports, exports, model);