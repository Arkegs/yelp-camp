var Campground = require("../models/campground");
var Comment = require("../models/comment");
//All the Middleware goes here
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
	//Is user logged in?
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
			if(err){
				req.flash("error", "Campground not found");
				res.redirect("back");
			} else{
				//Does the user own the campground? (.equals es un metodo de Mongoose)
				if(foundCampground.author.id.equals(req.user._id)){ //Un === o == no serviria, porque camp.author.id es objeto, y req.user.id es String
					next();
				} else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else{
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};


middlewareObj.checkCommentOwnership = function(req, res, next){
	//Is user logged in?
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				res.redirect("back");
			} else{
				//Does the user own the comment? (.equals es un metodo de Mongoose)
				if(foundComment.author.id.equals(req.user._id)){ //Un === o == no serviria, porque camp.author.id es objeto, y req.user.id es String
					next();
				} else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else{
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn = function (req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
};


module.exports = middlewareObj;