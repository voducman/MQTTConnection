const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');

let userSchema = mongoose.Schema({
    email: String,
    password: String,
    username: String,
    avatarLink: String,
    createTime: { type: Date, default: Date.now },
}, {
    collection: 'user',
});


/*    Some methods to encrypt password   */
userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

/*       Check if password is exit      */
userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('user', userSchema);
