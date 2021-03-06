var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware"); //Reconoce solito el "index.js" asi que no hay que ponerlo, es un nombre especial
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|bmp)$/i)) {
		req.fileValidationError = "The extension of the image must be JPG, JPEG, PNG or BMP";
        return cb(null, false, req.fileValidationError);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'arkeg', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX - Shows all the campgrounds
router.get("/", function(req, res){
	var noMatch;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({name: regex}, function(err, campgrounditos){
			if(err){
				console.log(err);
			} else{
				if(campgrounditos.length < 1){
					noMatch = "There were no matches. Please, try searching another campground."
					res.render("campgrounds/index",{campground:campgrounditos, page:'campgrounds', noMatch:noMatch});
				} else{
					res.render("campgrounds/index",{campground:campgrounditos, page:'campgrounds', noMatch:noMatch});
				}
			}
		});
	} else{
		//Get all campgrounds from DB
		Campground.find({}, function(err, campgrounditos){
			if(err){
				console.log(err);
			} else{
				res.render("campgrounds/index",{campground:campgrounditos, page:'campgrounds', noMatch:noMatch});
			}
		});
	}
});

//CREATE - Add new campground to database
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
	 if (req.fileValidationError) {
		 req.flash('error', req.fileValidationError);
        return res.redirect('back');
	 }
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
    });
});


//NEW - Show form to create a new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/newcamp");
});

//SHOW - Show ONE campground in particular with detail
router.get("/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").populate({
		path: "reviews",
		options: {sort: {createdAt: -1}} 
	}).exec(function(err, foundCampground){
		if(err){
			console.log(err);
		} else{
			//console.log(foundCampground);
			res.render("campgrounds/show", {campoEncontrado: foundCampground});
		}
	});
});

//EDIT - Show edit form for ONE campground

router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){
		res.render("campgrounds/edit", {campground: foundCampground});
	});
});


//UPDATE - Edit ONE campground, and then redirect somewhere

router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res){
	Campground.findById(req.params.id, async function(err, campground){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			delete req.body.campground.rating;
			if (req.file){
				try {
					await cloudinary.v2.uploader.destroy(campground.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					campground.imageId = result.public_id;
					campground.image = result.secure_url;
				} catch(err){
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}
			campground.name = req.body.campground.name;
			campground.price = req.body.campground.price;
			campground.description = req.body.campground.description;
			campground.save();
			req.flash("success", "Campground successfully updated!");
			res.redirect("/campgrounds/" + req.params.id);
		}
	}); //Toma 2 argumentos: Lo que estamos buscando y la data que queremos actualizar
});

//DESTROY - Deletes ONE campground and then redirects somewhere

router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, async function(err, campground){
		if(err){
			req.flash("error", err.message);
			return res.redirect("/back");
		} try{
			await cloudinary.v2.uploader.destroy(campground.imageId);
			Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
					req.flash("success", "Campground deleted successfully");
					res.redirect("/campgrounds")
				});
			});
		} catch(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;