const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name...."],
  },

  email: {
    type: String,
    unique: true,
    required: [true, "Enter your email"],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a email"],
  },

  photo: String,

  password: {
    type: String,
    required: [true, "Enter your password"],
    minlength: 8,
    select: false,
  },

  passwordConfirmation: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //(1)
      validator: function (el) {
        return el === this.password;
      },
      message: "Confirmation password doesnt match with password",
    },
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {//(8)
    type: Boolean,
    default: true,
    select: false
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); //(2)

  this.password = await bcrypt.hash(this.password, 12); // this.password me hashed password hoga ab

  //this.passwordConfirm should not be persisted in the database therefore,making it undefined.
  this.passwordConfirmation = undefined;
  next();
});

userSchema.pre(/^find/, function(next){//(9)
  this.find({active: {$ne: false}});//(10)
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password (4)
  return await bcrypt.compare(candidatePassword, userPassword);
}; //(3)

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log("checking values", changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; //
  }
  return false; //returning false, becasue let say the usesr hasn't changed his password then this property wo't be there in their document therefore, return false.
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); //(5)

  //encrypting or hasing the token generated above.
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex"); //(5)
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //abhi se 10 min bad


  return resetToken;
};

userSchema.pre('save', function(next){
  if(!this.isModified('password') || this.isNew )return next();//(6)

  this.passwordChangedAt = Date.now()-1000;//(7)
  next();
});

const User = mongoose.model("User", userSchema); //DB m model ka name User hoga yhi hum likhte h commas m

module.exports = User;

/**
 * (1) the validator works only on SAVE method of mongoose because of which whenever,
 * the user will try to signup or update the password, we must have to use save method
 * instead of findOne or findByIdAndUpdate.
 *
 * We can use User.save for creating new user and can also use User.save for updating the old user.
 *
 * (2) isModified is the method provided by mongoose to check whether a particular field is modified.
 * WE don't want pre middleware to run even when field other than password is changes for exmaple if we
 * don't put this condition then it will run even when email is changed by user, therefore, we have kept this
 * condition that if password is not changed then return to next middlewre.
 *
 * (3)when we define the methods inside the userSchema, then all those methods are available for all the documents
 * of that collection. So, this method correctPassword is available for all the documents of this collection.
 *
 * (4) this.password here is nto available, because we have set the field as false, otherwise in that scenario we would
 * have pass jus the candidate password not hte user password, because in place of userPassword, we could have used this.password.
 *
 * (5) we should never store the plain token resetpassword token insid the database, because if the hacker gets the access to the
 * db then he/she can change the password using that token. Therefore, here we will encrypt the token first and then will
 * store it inside the database.
 * 
 * (6) we want this middleware to run when either the password is modified or the whole document is not new. 
 * this.isNew and this.isModified both the methods are provided by the mongooose
 * 
 * (7) setting this.passwordChangedAt == Date.now() is theoritcially fine but in practice sometimes, save method of mongoose takes time, 
 * may be more it takes more time then creating a token and sending it to the user, because of which accurate time of password change is not 
 * logged the db that means the passwordChangedAt time saved inside the db is a bit greater than the actual ( because save method took more time).
 * Therefore, here we are subtracting 1sec from the Date.now() so that if save method takes some time more, then passwordChangedAt can have
 * accurate timing. Aloso because the token is created a bit prior to the save meethod completion
 * 
 * (8) when we talk about deleting the user, we actually don't delete the user, instead we just set that user to inactive inside the db so if
 * in the future, the user again wants to activate the account then it can do that.
 * 
 * (9) here we are defining the query middleware which will run before all the query starting with the word "find" inside the pre middleware
 * instead of writing 'find' we wrote /^find/ to indicate that this middleware will run for all the query starting with find. 
 * 
 * (10) this line inside the middleware shows that, all the documents with this property having value true, will be sent.
 */
