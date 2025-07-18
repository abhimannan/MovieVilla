const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

// user schema
const UserSchema = new Schema({
    email : {
        type : String,
        required : true,
    }
});

UserSchema.plugin(passportLocalMongoose);

let User =  mongoose.model('User', UserSchema);

module.exports = User;
