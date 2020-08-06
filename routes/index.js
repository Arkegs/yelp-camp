var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground")

//ROOT ROUTE
router.get("/", function(req, res){
	res.render("landing");
});


//=====================
//AUTHENTICATION ROUTES
//=====================


//SHOW Register form
router.get("/register", function(req, res){
	res.render("register", {page: 'register'});
});

//SIGN UP LOGIC
router.post("/register", function(req, res){
	var newUser = new User({username: req.body.username, 
							firstName: req.body.firstName,
						  	lastName: req.body.lastName,
							avatar: req.body.avatar,
							email: req.body.email
						  });
	if(req.body.adminCode === "v!kfl3$90adfkjke!23900xx32"){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
   			console.log(err);
    		return res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to YelpCamp " + user.username);
			res.redirect("/campgrounds");
		});
	});
});

//SHOW Login form
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});
});

//LOGIN LOGIC
router.post("/login", passport.authenticate("local", 
		{
			successRedirect:"/campgrounds",
			failureRedirect:"/login"
		}), function(req, res){

});

//LOGOUT ROUTE
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "You logged out");
	res.redirect("/campgrounds");
});

//USER PROFILE
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "User was not found");
			res.redirect("/");
		} else{
		Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounditos){
			if(err){
				req.flash("error", "Something went wrong");
				res.redirect("/");
			} else{
				res.render("users/show", {campgrounds: campgrounditos, user: foundUser});
			}
		});
		}
	});
});

module.exports = router;