var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
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

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the review?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/campgrounds/" + foundCampground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};


module.exports = middlewareObj;