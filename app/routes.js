// app/routes.js
module.exports = function (app, passport) {

    var userSchema = require('./models/userSchema');

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
        userSchema.find({ $or: [{ 'local.email': req.user.local.email }, { 'google.email': req.user.google.email }] }, function (err, uSchema) {

            var arrclone;

            // cloning the array of gardens to display on the profile page.
            uSchema.forEach(element => {
                arrclone = element.gardens.slice(0);
            });

            // this will render the profile page and it will set the values for user
            // gardens, and message so that we can work with them in ejs.
            res.render('profile.ejs', {
                user: req.user,
                gardens: arrclone,
                message: req.flash('duplicatedMessage')
            });
        });

    });


    // fix post for creating a new garden on profile page
    app.post('/profile', isLoggedIn, function (req, res) {

        userSchema.find({ $or: [{ 'local.email': req.user.local.email }, { 'google.email': req.user.google.email }] }, function (err, uSchema) {

            // get the name of the garden from the headers and trim any extra white space
            var nameG = req.body.gardenName.trim();

            // concatenating the new garden name into the array of gardens.
            uSchema[0].gardens = uSchema[0].gardens.concat({ name: nameG });

            // saving the document with the changes that we have made
            uSchema[0].save(function (err) {
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

                    var arrclone;

                    // cloning the array of gardens to display on the profile page.
                    uSchema.forEach(element => {
                        arrclone = element.gardens.slice(0);
                    });

                    // this will render the profile page and it will set the values for user
                    // gardens, and message so that we can work with them in ejs.
                    res.render('profile.ejs', {
                        user: req.user,
                        gardens: arrclone,
                        message: req.flash('duplicatedMessage')
                    });
                }
            })
        });

    });

    app.get('/profile/:id', isLoggedIn, function (req, res) {

        // get the garden to display
        let gardenO = req.params.id.trim();

        gardenO = gardenO.replace(':', '');

        console.log("***OPENING GARDEN: " + gardenO);

        // make proper call to display the garden


        // render the garden page
        res.redirect('/profile');
    });

    app.post('/profile/:id', isLoggedIn, function (req, res) {


        // get the garden to delete
        // getting the name of the garden based on the id
        let gardenD = req.params.id.trim();

        // removing unwanted characters so only the name of the garden
        // is in the var.
        gardenD = gardenD.replace(':', '');

        // make proper call to delete the garden using garden name
        // finding the document associated with the user
        userSchema.find({ $or: [{ 'local.email': req.user.local.email }, { 'google.email': req.user.google.email }] }, function (err, uSchema) {

            // isolating the garden object that was picked by the user.
            // we use the gardens ID to find it in the array.
            var picked = uSchema[0].gardens.find(o => o.id === gardenD);

            // removing the garden object from the garden array for the user
            uSchema[0].gardens.remove(picked);

            // saving changes made to the document
            uSchema[0].save(function (err) {
                if (err) {
                    console.log(err);
                }
                else {

                    var arrclone;

                    // cloning the array of gardens to display on the profile page.
                    uSchema.forEach(element => {
                        arrclone = element.gardens.slice(0);
                    });

                    // this will render the profile page and it will set the values for user
                    // gardens, and message so that we can work with them in ejs.
                    res.render('profile.ejs', {
                        user: req.user,
                        gardens: arrclone,
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
    app.get('/garden', isLoggedIn, function (req, res) {
        res.render('garden.ejs', {
            user: req.user // get the user out of session and pass to garden.
            /*
                will do the same with gardens once I put it in the database.
                garden: req.garden, or something of the sort.
            */
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/account',
            failureRedirect: '/'
        }));

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

    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/account',
            failureRedirect: '/'
        }));



    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/account');
        });
    });


    // google ---------------------------------
    app.get('/unlink/google', function (req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function (err) {
            res.redirect('/account');
        });
    });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}