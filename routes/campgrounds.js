var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware"); //Reconoce solito el "index.js" asi que no hay que ponerlo, es un nombre especial
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'arkeg', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX - Shows all the campgrounds
router.get("/", function(req, res){
	Campground.find({}, function(err, campgrounditos){
		if(err){
			console.log(err);
		} else{
			res.render("campgrounds/index",{campground:campgrounditos, page:'campgrounds'});
		}
	});
});

//CREATE - Add new campground to database
router.post("/", middleware.isLoggedIn, function(req, res){
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id, //req.user viene dado por el passport.js, al usar la funcion Authenticate (Gracias al isLoggedIn)
		username: req.user.username
	};
	var newCamp = {name: name, price:price, image: image, description: desc, author: author};
	//Create a new campground
	Campground.create(newCamp, function(err, newlyCreated){
		if(err){
			console.log(err);
		} else{
			res.redirect("/campgrounds");
		}
	});
});

//NEW - Show form to create a new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campgrounds/newcamp");
});

//SHOW - Show ONE campground in particular with detail
router.get("/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		} else{
			console.log(foundCampground);
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

router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
		if(err){
			res.redirect("/campgrounds");
		} else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	}) //Toma 2 argumentos: Lo que estamos buscando y la data que queremos actualizar
});

//DESTROY - Deletes ONE campground and then redirects somewhere

router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/campgrounds");
		} else{
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;