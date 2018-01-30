var schema = new Schema({
   
minimumBuyin: {
        type: Number,
        require: true
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
var model = {};
module.exports = _.assign(module.exports, exports, model);