const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');

let userSchema = mongoose.Schema({
    run: Boolean,
    web_emer: Boolean,
    web_reset: Boolean,
    val_v11: String,
    val_v22: String,
    val_v1:  String,
    val_v2:  String,
    total:   String,
    sendTime: { type: Date, default: Date.now },
    createdAt: { type: Date, expires: 86400, default: Date.now }
}, {
    collection: 'data',
});

module.exports = mongoose.model('data', userSchema);
