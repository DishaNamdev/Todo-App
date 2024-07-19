const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({

    name:{
        type: String,
        require: [true, 'Name is requried!!']
    },

    email: {
        type: String,
        unique: true,
        required: [true, "Enter your email"],
        lowercase: true,
        validate: [validator.isEmail, "Please provide a email"],
    },

    password: {
        type: String,
        required: [true, 'password is required!!'],
        minLength:8,
        select: false,
    },

    confirmPassword: {
        type: String,
        validate:{
            validator: function(el){
                return el === this.password;
            },
            message: "Confirm password should match the entered password!"
        }
    },

    photo: String,
    createdAt: Date,
    active:{
        type: Boolean,
        default: true,
    },

    passwordChangedAt: Date,
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,12);
    this.confirmPassword = undefined;
    next();
});

userSchema.pre('save', async function(next){
    if(!this.isModified(this.password) || this.isNew) next();

    this.passwordChangedAt = new Date.now() - 1000;
    next();
})
userSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.checkEnteredPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}


userSchema.methods.changedPasswordAfter = function(JWTTimestamp){//this is the time when the token was issues
    if(this.passwordChangedAt){
        // const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        // return changedTimeStamp > JWTTimestamp;


        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return changedTimestamp > JWTTimestamp;
    }
    console.log("inside changedPasswordAfter");
    return false;
}

const User = mongoose.model('userModel', userSchema);

module.exports = User;