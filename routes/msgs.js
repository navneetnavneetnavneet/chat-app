const mongoose = require('mongoose');

const msgSchema = mongoose.Schema({
    msg: {
        type: String,
    },
    sender: {
        type: String,
        ref: 'user',
    },
    reciver: {
        type: String,
        ref: "user"
    }
},
{ 
    timestamps: true,
})

module.exports = mongoose.model("msg", msgSchema);