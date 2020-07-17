// ==========================================
// COMMENTS ROUTES
// ==========================================

var express = require("express");
var router = express.Router({mergeParams: true}); //El mergeParams se puso para arreglar el problema con el :id en Routes de app.js
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//NEW ROUTE
router.get("/new", middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		} else{
			console.log(campground.name);
			res.render("comments/new", {campground:campground});
		}
	});
});

//CREATE ROUTE
router.post("/", middleware.isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds");
		} else{
			Comment.create(req.body.comment, function(err, comment){
				if (err){
					req.flash("error", "Something went wrong");
					console.log(err);
				} else{
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					console.log(comment);
					req.flash("success", "Successully added a comment");
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
});

//EDIT - Show edit form
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			res.redirect("back");
		} else{
			res.render("comments/edit", {campground_id: req.params.id, comment:foundComment});
		}
	});
});

//UPDATE - Edit one particular comment
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			res.redirect("back");
		} else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DESTROY - Delete one particular comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		} else{
			req.flash("error", "Comment deleted");
			res.redirect("/campgrounds/"+ req.params.id);
		}
	});
});


module.exports = router;