const LocalStrategy = require('passport-local').Strategy;
const User          = require('./model/User');

module.exports = function(passport){
    
    passport.serializeUser(function(user, done){
        done(null, user.id);
    })

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        })
    })

    passport.use('local-signin', new LocalStrategy({
        // By default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true      // allows us to pass back the entire request to the callback

    }, function(req, email, password, done){  // callback with email and password
        console.log(req.body);
        console.log(email);
        console.log(password);
        // Find a user whose email is the same as the forms email
        // We are checking to see if the user trying to login already exists
        User.findOne({'email': email}, function(err, user){
            // If there are any errors, return the error before anything else
            if (err)  return done(err);

            // If no user is found, return the message
            if (!user)  return done(null, false); // req.flash is the way to set flashdata using connect-flash

            // If the user is found but the password is wrong
            if (!user.validPassword(password)){
                return done(null, false); // create the loginMessage and save it to session as flashdata
            }    
          
            return done(null, user);
        })
    }));


    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 

    }, function(req, email, password, done){
        if (req.body["name"].length == 0){
            return done(null, false);
        }

        console.log("Passport is working");
        console.log(req.body);
        process.nextTick(function() {
            User.findOne({ 'email' :  email }, function(err, user) {
                if (err)
                    return done(err);
                if (user) {
                    return done(null, false);
                } else {
                    let newUser         = new User();
                    newUser.email       = email;
                    newUser.password    = newUser.generateHash(password);
                    newUser.username    = req.body["name"];
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        return done(null, newUser);
                    });
                }
            });    
        });   
    }))
}
