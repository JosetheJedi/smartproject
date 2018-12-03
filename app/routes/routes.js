// app/routes.js

var app = require('../server');

var passport = app.passport;

var express = require('express');

var router = express.Router();

const userSchema = require('../models/userSchema');

// =====================================
// HOME PAGE (with login links) ========
// =====================================
// req = request
// res is the response that we are giving back.
// res.render() will look in a views folder for the view.

app.get('/', function (req, res) {
    res.render('index.ejs'); // load the index.ejs file
});

// =====================================
// DEVELOPER GUIDE =====================
// =====================================
app.get('/developer', function (req, res) {
    res.render('developer.ejs');
});

// =====================================
// User Manual ++++=====================
// =====================================
app.get('/userMan', function (req, res) {
    res.render('userMan.ejs');
});

// =====================================
// LOGIN ===============================
// =====================================
// show the login form
// this will handle the request for a login get
app.get('/login', function (req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login.ejs', { message: req.flash('loginMessage') });
});

// process the login form POST
// app.post('/login', do all our passport stuff here);
// process the login form
app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form
app.get('/signup', function (req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

// process the signup form POST
// app.post('/signup', do all our passport stuff here);

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
app.get('/profile', isLoggedIn, function (req, res) {

    // finding the document that belongs to the user.
    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        var username = req.user.local.email;
        username = username.substring(0, username.indexOf('@'));

        console.log(username);
        // this will render the profile page and it will set the values for user
        // gardens, and message so that we can work with them in ejs.
        res.render('profile.ejs', {
            user: req.user.local.email,
            name: username,
            gardens: uSchema.gardens,
            message: req.flash('duplicatedMessage')
        });
    });

});


// fix post for creating a new garden on profile page
app.post('/profile', isLoggedIn, function (req, res) {

    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // get the name of the garden from the headers and trim any extra white space
        var nameG = req.body.gardenName.trim();

        var username = req.user.local.email;
        username = username.substring(0, username.indexOf('@'));

        // concatenating the new garden name into the array of gardens.
        uSchema.gardens = uSchema.gardens.concat({ name: nameG });

        // saving the document with the changes that we have made
        uSchema.save(function (err) {
            if (err) {
                if (err.code === 11000) {
                    req.flash('duplicateMessage', 'That Garden name exists!');
                    res.redirect('/profile');
                    console.log("**********THERE WAS AN ERROR********");
                    console.log(err);
                }
                console.log(err);
            }
            else {

                // this will render the profile page and it will set the values for user
                // gardens, and message so that we can work with them in ejs.
                res.render('profile.ejs', {
                    user: req.user.local.email,
                    name: username,
                    gardens: uSchema.gardens,
                    message: req.flash('duplicatedMessage')
                });
            }
        })
    });

});

// this route handles deleting the garden selected
app.post('/profile/:id', isLoggedIn, function (req, res) {

    // get the garden to delete
    // getting the name of the garden based on the id
    let gardenD = req.params.id.trim();

    // removing unwanted characters so only the name of the garden
    // is in the var.
    gardenD = gardenD.replace(':', '');

    // make proper call to delete the garden using garden name
    // finding the document associated with the user
    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // isolating the garden object that was picked by the user.
        // we use the gardens ID to find it in the array.
        var picked = uSchema.gardens.find(o => o.id === gardenD);

        // removing the garden object from the garden array for the user
        uSchema.gardens.remove(picked);

        // saving changes made to the document
        uSchema.save(function (err) {
            if (err) {
                console.log(err);
            }
            else {

                // this will render the profile page and it will set the values for user
                // gardens, and message so that we can work with them in ejs.
                res.render('profile.ejs', {
                    user: req.user.local.email,
                    gardens: uSchema.gardens,
                    message: req.flash('duplicatedMessage')
                });
            }
        })

    });
    // render the account page
    res.redirect('/profile');
});

// =====================================
// ACCOUNT PAGE ========================
// =====================================
app.get('/account', isLoggedIn, function (req, res) {
    res.render('account.ejs', {
        user: req.user
    });
});


// =====================================
// GARDEN SECTION ======================
// =====================================

// this route handles rendering the plants for the garden that the user
// selected
app.get('/garden/:id', isLoggedIn, function (req, res) {

    // get the garden to display
    let gardenO = req.params.id.trim();

    gardenO = gardenO.replace(':', '');

    // make proper call to display the garden
    // make proper call to the garden using garden name
    // finding the document associated with the user
    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // singling out the garden that the user provided from the gardens
        // that the user owns
        var resG = uSchema.gardens.find(function (element) {
            return element._id.toString() === gardenO.toString();
        });

        // if the garden exists then we check if there are any plants in the garden
        if (resG !== undefined) {
            // render the garden page
            res.render('garden.ejs', {
                user: req.user.local.email,
                gardenID: gardenO,
                garden: resG,
                plants: resG.plants,
                message: req.flash('duplicatedMessage')
            });
        }

    });
});

// it will create a new plant with the given garden
app.post('/garden', isLoggedIn, function (req, res) {
    // getting values from the request

    // name of the new plant
    var nameP = req.body.plantName.trim();

    // id of the garden we are putting the plant into
    var gardenID = req.body.gardenID.trim();

    // finding the garden with the gardenID provided.
    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // singling out the garden with the name that the user provided
        // from the gardens that the user owns
        var resG = uSchema.gardens.find(function (element) {
            return element._id.toString() === gardenID.toString();
        });

        // checking if the garden exists, if it does then we create the new plant
        if (resG !== undefined) {
            // adding the new plant that the user wants to create.
            resG.plants = resG.plants.concat({ name: nameP });

            // saving the changes to the database for the users garden.
            uSchema.save(function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    // res.render('garden.ejs', {
                    //     user: req.user.local.email,
                    //     gardenID: gardenID,
                    //     garden: resG,
                    //     plants: resG.plants,
                    //     message: req.flash('duplicatedMessage')
                    // });

                    res.redirect('back');
                }
            });
        }

    });
});


// =====================================
// PLANT SECTION =======================
// =====================================

// this route will fire when the user selects to delete a plant
// from the current garden.
app.post('/garden/:id', isLoggedIn, function (req, res) {


    // gets the request information
    let reqID = req.params.id.trim();

    // extracting both plant and garden ID to an array
    reqID = reqID.split(":");

    var plantO = reqID[1];
    var gardenO = reqID[2];

    // retrieve information for the current user
    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // single out the garden that the user provided
        var resG = uSchema.gardens.find(function (element) {
            return element._id.toString() === gardenO.toString();
        });

        // if the garden exists then we check if there are any plants in the garden
        if (resG !== undefined) {


            // single out the plant that the user wants to delete
            var plantR = resG.plants.find(function (element) {
                return element._id.toString() === plantO.toString();
            });

            if (plantR !== undefined) {

                // removing the plant and then saving the changes
                resG.plants.remove(plantR);

                uSchema.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // render the selected garden with all it's plants
                        res.render('garden.ejs', {
                            user: req.user.local.email,
                            gardenID: gardenO,
                            garden: resG,
                            plants: resG.plants,
                            message: req.flash('duplicatedMessage')
                        });
                    }
                });
            }

        }
    });
});


// =====================================
// SETTINGS SECTION ====================
// =====================================

// it will open up the settings for the selected plant
app.get('/settings/:id', isLoggedIn, function (req, res) {

    // gets the request information
    let reqID = req.params.id.trim();

    reqID = reqID.split(":");

    var plantO = reqID[1];
    var gardenO = reqID[2];

    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // singling out the garden that the user provided from the gardens
        // that the user owns
        var resG = uSchema.gardens.find(function (element) {
            return element._id.toString() === gardenO;
        });

        // if the garden exists then we check if there are any plants in the garden
        if (resG !== undefined) {

            // singling out the plant that the user wanted to get the settings for.
            var plantR = resG.plants.find(function (element) {
                return element._id.toString() === plantO.toString();
            });

            if (plantR !== undefined) {

                // render the settings page for the selected plant
                res.render('settings.ejs', {
                    user: req.user.local.email,
                    gardenID: gardenO,
                    garden: resG,
                    plantID: plantO,
                    plant: plantR,
                    logs: plantR.logs,
                    schedules: plantR.waterSchedules,
                    message: req.flash('duplicatedMessage')
                });
            }
        }
    });
});

// this route will run when the user selects to create a new
// schedule.
app.post('/settings', isLoggedIn, function (req, res) {
    
    // gets the request information
    /*
        plantid, gardenid, schedule name, duration of the watering, start time 1 and 2.
    */
    var plantO = req.body.plantID.trim();
    var gardenID = req.body.gardenID.trim();
    var scheduleN = req.body.scheduleName.trim();
    var duration = req.body.Duration.trim();
    var startT = req.body.startT.trim();
    var startT2 = req.body.startT2;

    var hour, hour2, minutes, minutes2;

    var time1mill, time2mill;

    // if there is no second starting time, then we just calculate the 
    // hour and minutes variables for that time.
    if (startT2 === undefined) {
        // get time out of the start time input
        var timeVals = startT.split(":");
        hour = timeVals[0];
        minutes = timeVals[1].replace(/\D/g, '');
    }
    else {
        // get time out of the start time input
        var timeVals = startT.split(":");
        hour = timeVals[0];
        minutes = timeVals[1].replace(/\D/g, '');

        // get the second time out of the second time input
        var timeVal2 = startT2.split(":");
        hour2 = timeVal2[0];
        minutes2 = timeVal2[1].replace(/\D/g, '');
    }

    // convert hours to milliseconds
    if (hour2 === undefined) {
        time1mill = (hour * 3600000) + (minutes * 60000);
        time2mill = 0;
        durationmill = duration * 60000;
    }
    else {
        time1mill = (hour * 3600000) + (minutes * 60000);
        time2mill = (hour2 * 3600000) + (minutes2 * 60000);
        durationmill = duration * 60000;
    }

    userSchema.findOne({ 'local.email': req.user.local.email }, function (err, uSchema) {

        // singling out the garden with the name that the user provided
        // from the gardens that the user owns
        var resG = uSchema.gardens.find(function (element) {
            return element._id.toString() === gardenID.toString();
        });

        // if the garden exists then we check if there are any plants in the garden
        if (resG !== undefined) {

            var plantR = resG.plants.find(function (element) {
                return element._id.toString() === plantO.toString();
            });

            // if there are any plants we set up the new watering schedule
            if (plantR !== undefined) {

                plantR.waterSchedules = plantR.waterSchedules.concat({
                    scheduleName: scheduleN,
                    default: false,
                    startTime: [
                        {
                            time: time1mill,
                            offset: 7
                        },
                        {
                            time: time2mill,
                            offset: 7
                        }
                    ],
                    duration: [
                        {
                            time: durationmill
                        },
                        {
                            time: durationmill
                        }
                    ]
                });

                uSchema.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // // render the garden page
                        // res.render('settings.ejs', {
                        //     user: req.user.local.email,
                        //     gardenID: gardenID,
                        //     garden: resG,
                        //     plantID: plantO,
                        //     plant: plantR,
                        //     logs: plantR.logs,
                        //     schedules: plantR.waterSchedules,
                        //     message: req.flash('duplicatedMessage')
                        // });

                        res.redirect('back');
                    }
                });

            }
        }

    });
});


// =====================================
// LOGOUT ==============================
// =====================================
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

// locally --------------------------------
app.get('/connect/local', function (req, res) {
    res.render('connect-local.ejs', { message: req.flash('loginMessage') });
});
app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/account', // redirect to the secure profile section
    failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

module.exports = router;


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}