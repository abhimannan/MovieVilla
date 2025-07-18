if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
    // console.log(process.env);
}

let express = require("express");
let app = express();
let port = 5052;
const mongoose = require('mongoose');
let path = require("path");
let ejaMate = require('ejs-mate');
let Movie = require("./models/movies.js");
let methodOverride = require('method-override');
let ExpressError = require("./utils/ExpressError.js");
let wrapasync = require("./utils/wrapasync.js");
let {movieSchemaValidation,reviewValidation}  = require("./schema.js");
let Review = require("./models/review.js");
let session = require('express-session');
const MongoStore = require('connect-mongo');
let flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
let User = require("./models/user.js");
const multer  = require('multer');
let {storage} = require("./cloudconfig.js");
const upload = multer({ storage });

let dbUrl = process.env.ATLASDB_URL;

// DB connection
// getting-started.js
main().
then(()=>{
    console.log("DB is connected!!");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/movieVilla');
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}


// middlewares
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
// use ejs-locals for all ejs templates:
app.engine('ejs', ejaMate);
// override with the X-HTTP-Method-Override header in the request
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

// middleware for validation of movie schema
let movieValidation = (req,resp,next)=>{
    let {error} = movieSchemaValidation.validate(req.body);
    if(error) {
        // console.log(error);
        const errorMSG = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errorMSG);
    }
    else {
        next();
    }
}
// middleware for review validation in the backend using Joi package
let reviewJoiValidation = (req, res, next) => {
  const { error } = reviewValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, errorMessage);
  } else {
    next();
  }
};

let store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto : {
        secret : process.env.SECRETE,
    },
    touchAfter : 24 * 3600,
});

store.on("error",()=>{
    console.log("ERROR ON MONGO SESSION STORE",err);
});

let sessionOptions = {
    store,
  secret: process.env.SECRETE,
  resave: false,
  saveUninitialized: true,
};


// express session
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware for local storage
app.use((req,resp,next)=>{
    resp.locals.success = req.flash("success");
    resp.locals.error = req.flash("error");
    resp.locals.currUser = req.user;
    next();
});

// users route
/*
app.get("/demouser",async(req,resp)=>{
    let fakeuser = new User({
        email :"abhi543it@gmail.com",
        username : "abhi",
    });
    let registerUser = await User.register(fakeuser, "143");
    resp.send(registerUser);
});
*/
// signup route
// render signin form
app.get("/signup",(req,resp)=>{
    resp.render("signup.ejs");
});
// add new user into database
app.post("/signup",async(req,resp)=>{
    let data = req.body.user;
    let newUser = new User(data);
    let registerUser = await User.register(newUser,data.password);
    // automatic login after signup
    req.logIn(registerUser,(err)=>{
        if(err) {
            return next(err);
        }
        req.flash("success","Welcome To The World of Movie Hub!!");
        resp.redirect("/movies");
    })
    // console.log(registerUser);

});
// login form render for user
app.get("/login",(req,resp)=>{
    resp.render("login.ejs");
});
// middleware for user login or not
let isLogin = (req,resp,next)=>{
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","Please Login into our website!!");
        return resp.redirect("/movies");
    }
    else {
        next();
    }
}
// middleware for check owner permissions
let isOwner = async (req,resp,next)=>{
    let {id} = req.params;
    let movie = await Movie.findById(id);
    if(!movie.owner.equals(resp.locals.currUser._id)) {
        req.flash("error","You are not the owner of this movie!");
        return resp.redirect(`/movies/${id}`);
    }
    next();
}
// check the review author
let isReviewAuthor = async (req,resp,next)=>{
    let {id,reviewID} = req.params;
    let review = await Review.findById(reviewID);
    if(!review.author.equals(resp.locals.currUser._id)) {
        req.flash("error","You are not the author of this movie!");
        return resp.redirect(`/movies/${id}`);
    }
    next();
}
// middleware for save redirect url
let saveRedirectUrl = (req,resp,next)=>{
    if(req.session.redirectUrl) {
        resp.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}
// sign into the website that already registered
app.post('/login',
    saveRedirectUrl, 
  passport.authenticate("local",
     { 
        failureRedirect: '/login',
        failureFlash : true 
     }),
  function(req, resp) {
    req.flash("success","Welcome to the world of movie hub!!");
    let redirectUrl = resp.locals.redirectUrl || "/movies";
    resp.redirect(redirectUrl);
});
// logout route
app.get("/logout",(req,resp,next)=>{
    req.logout((err)=>{
        return next(err);
    })
    req.flash("success","Your Logged Out Of The Website!!");
    resp.redirect("/movies");
});
// 



app.get("/session",(req,resp)=>{
    req.session.name = "abhi";
    resp.send(req.session.name);
});


// home route
app.get("/home",(req,resp)=>{
    resp.render("home.ejs");
});

// CRUD
// all movies
app.get("/movies",wrapasync(async (req,resp)=>{
    let movies = await Movie.find({});
    console.log(movies);
    resp.render("show.ejs",{movies});
}));

// render new form for add data
app.get("/movies/new",
    isLogin,
    wrapasync(async(req,resp)=>{
    resp.render("new.ejs");
}));
// post route for add new data
app.post("/addNew",
    movieValidation,
    upload.single('Movie[imageURL]'),
    wrapasync(async(req,resp)=>{
        console.log("file",req.file);
        let url = req.file.path;
        let filename = req.file.filename;
    let data = req.body.Movie;
    // // console.log(req.body);
    let newData = new Movie(data);
    newData.imageURL = {url , filename}; /* importent line */
    newData.owner = req.user._id;
    await newData.save();
    req.flash("success","The New Movie is Added!!");
    resp.redirect("/movies");
}));

// edit route
app.get("/movies/:id/edit",
    isLogin,
    isOwner,
    wrapasync(async (req,resp)=>{
    let {id} = req.params;
    let data = await Movie.findById(id);
    // console.log(data);
    resp.render("editForm.ejs",{data});
}));
// update route
app.put("/movies/:id/edit",
    upload.single('Movie[imageURL]'),
    isLogin,
    isOwner,
    movieValidation,
    wrapasync(async(req,resp)=>{
        let data = req.body.Movie;
    let {id} = req.params;
    let movieUpdate = await Movie.findByIdAndUpdate(id,{...data},{ new: true });
    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        movieUpdate.imageURL = {url , filename};
        movieUpdate.save();
    }
    
    req.flash("success","Updated successfully!!");
    resp.redirect("/movies");
}));

// show individual movies
app.get("/movies/:id", wrapasync(async (req, resp) => {
    const { id } = req.params;
    const movie = await Movie.findById(id)
        .populate({
            path : "reviews",
            populate : {
                path : "author",
            },
        })
        .populate("owner");
        // console.log(movie);
    if (!movie) {
        req.flash("error", "Listing is not found!!");
        return resp.redirect("/movies");
    }

    resp.render("showMovie.ejs", { movie });
}));


// destroy route
app.delete("/movies/:id",
    isLogin,
    isOwner,
    wrapasync(async(req,resp)=>{
    let {id} = req.params;
    await Movie.findByIdAndDelete(id);
    req.flash("success","Movie is deleted!!");
    resp.redirect("/movies");
}));
// find searched movie
app.get("/search", async (req, resp) => {
    let query = req.query.query;
    let findMovie = await Movie.find({ title: query });

    if (findMovie.length === 0) {
        req.flash("error", "Movie not found!");
        return resp.redirect("/movies"); // redirect to all movies or wherever you want
    }

    resp.render("SeachedMovie.ejs", { findMovie });
});


// let addReview = async()=>{
//     let data = new Review({
//         description : "good",
//         rating : 5,
//     });
//     let res = await data.save();
//     console.log(res);
// }
// addReview();

// reviews
// new review
app.post("/movies/:id/reviews",
    // isLogin,
    // reviewJoiValidation,
    async (req,resp)=>{
        let movie = await Movie.findById(req.params.id);
        let Newreview = new Review(req.body.review);
        Newreview.author = req.user._id;// review author
        // console.log("user details:",req.user._id);
        // // console.log(Newreview);

        movie.reviews.push(Newreview);
        console.log("x : ",movie)
        // console.log("new",Newreview);
    await Newreview.save();
    await movie.save();
    req.flash("success","New Review is Created!!");
    resp.redirect(`/movies/${movie._id}`);
});

// delete review
app.delete("/movies/:id/reviews/:reviewID",
    isLogin,
    isReviewAuthor,
    async(req,resp)=>{
    let {id , reviewID} = req.params;
    await Movie.findByIdAndUpdate(id , {$pull : {reviews : reviewID}});
    await Review.findByIdAndDelete(reviewID);
    req.flash("success","Review is Deleted!!");
    resp.redirect(`/movies/${id}`);
});

app.all("*", (req, res, next) => {
    // You can pass a custom error to your error handler
    next(new ExpressError(404,"Page Not Found"));
});

// testing route
app.get("/demo",(req,resp,next)=>{
    next(new ExpressError(404,"ERROR"));
});

app.use((err,req,resp,next)=>{
    let {status=404,message="ERROR"} = err;
    resp.status(status).send(message);
});

app.listen(port,()=>{
    console.log(`The server is running at ${port}`);
});