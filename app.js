var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	flash = require("connect-flash"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Campground = require("./models/campground"),
	Comment = require("./models/comment"),
	User = require("./models/user"),
	seedDB = require("./seeds");

//REQUIRING ROUTES
var commentRoutes = require("./routes/comments"),
	reviewRoutes = require("./routes/reviews"),
	campgroundRoutes = require("./routes/campgrounds"),
	indexRoutes = require("./routes/index");

//seedDB();
//var urlMongo = "mongodb://localhost:27017/yelp_camp"
//variables de entorno: export DATABASEURL=mongodb://localhost:27017/yelp_camp / export CLOUDINARY_API_KEY=898553665625971 / export CLOUDINARY_API_SECRET=QQvmBN3b7MxvOQZoosx-CDnJqZA
//var urlMongo = "mongodb+srv://Arkegs:0xxabc07-A@cluster0.i4xd8.mongodb.net/yelp_camp?retryWrites=true&w=majority"
var urlMongo = process.env.DATABASEURL
mongoose.connect(urlMongo, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Manso secreto conchetumare",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//El primer parametro queda como prefijo para todas las rutas de ESE indexRoutes.

app.use("/", indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);


app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0', function(){
	console.log("YelpCamp server has started!");
});