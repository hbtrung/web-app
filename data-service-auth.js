const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
var Schema = mongoose.Schema;
var userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

var User;

module.exports.initialize = function(){
    return new Promise(function(resolve, reject){
        let db = mongoose.createConnection("mongodb://hbtrung:concac93@ds047762.mlab.com:47762/web322_a6");

        db.on('error', (err)=>{
            reject(err);
        });
        db.once('open',()=>{
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

module.exports.registerUser = function(userData){
    return new Promise(function(resolve, reject){
        if(userData.password !== userData.password2){
            reject("Passwords do not match");
        } else {
            bcrypt.genSalt(10, function(err, salt) { // Generate a "salt" using 10 rounds
                if(err){
                    reject("There was an error encrypting the password");
                } else {
                    bcrypt.hash(userData.password, salt, function(err, hash) { // encrypt the password
                        if(err){
                            reject("There was an error encrypting the password");
                        } else {
                            userData.password = hash;
                            let newUser = new User(userData);
                            newUser.save((err)=>{
                                if(err){
                                    if(err.code == 11000){
                                        reject("User Name already taken");
                                    } else {
                                        reject('There was an error creating the user: ' + err);
                                    }
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                }
            });  
        }
    })
}

module.exports.checkUser = function(userData){
    return new Promise(function(resolve, reject){
        User.find({ userName : userData.userName })
        .exec()
        .then(
            function(users){
            if(!users){
                reject("Unable to find user: " + userData.userName);
            } else{
                bcrypt.compare(userData.password, users[0].password).then((res) => {
                    // res === true if it matches and res === false if it does not match
                    if(res === false){
                        reject("Incorrect Password for user: " + userData.userName);
                    } else {
                        users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                        User.update({userName: users[0].userName},
                        {$set: {loginHistory: users[0].loginHistory}},
                        {multi: false})
                        .exec()
                        .then(function(){
                            resolve(users[0]);
                        })
                        .catch(function(err){
                            reject("There was an error verifying the user: " + err);
                        });
                    }
                });
            }
        })
        .catch((err) => {
            reject("Unable to find user: " + userData.userName);
        });
    });
}