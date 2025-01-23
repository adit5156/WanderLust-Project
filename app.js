const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Review = require("./models/review");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const expressError = require("./utils/expressError");
const asyncWrap = require("./utils/asyncWrap");
const listingSchema = require("./utils/schema");
const reviewSchema = require("./utils/schema");
const port = 8080;

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
async function main() {
    await mongoose.connect(MONGO_URL);
}
main()
.then(() => {
    console.log("Connected to DB");
})
.catch((err) => {
    console.log(err);
});

const validateListing = (req, res, next) => {
    let result = listingSchema.validate(req.body);
    if(result.error) {
        let errorMsg = result.error.details.map((el) => el.message).join(",");
        throw new expressError(400, errorMsg);
    }
    else {
        next();
    }
}

const validateReview = (req, res, next) => {
    let result = reviewSchema.validate(req.body);
    if(result.error) {
        let errorMsg = result.error.details.map((el) => el.message).join(",");
        throw new expressError(400, errorMsg);
    }
    else {
        next();
    }
}

app.engine("ejs", ejsMate);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended : true }));
app.use(methodOverride("_method"));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

// Root Route
app.get("/", (req, res) => {
    res.send("Server is working properly");
});

// Index Route
app.get("/listings", asyncWrap(async (req, res) => {
    let allListings = await Listing.find();
    res.render("listings/index.ejs", { allListings });
}));

// New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Post Route
app.post("/listings", validateListing, asyncWrap(async (req, res, next) => {
    let listingData = req.body.listing;
        let newListing = new Listing(listingData);
        await newListing.save();
        res.redirect("/listings");
    }
));

// Show Route
app.get("/listings/:id", asyncWrap(async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate("reviews");
    if(!listing) {
        next(new expressError(404, "Listing Not Found"));
    }
    else {
        res.render("listings/show.ejs", { listing });
    }
}));

// Edit Rotue
app.get("/listings/edit/:id", asyncWrap(async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing) {
        next(new expressError(404, "Listing Not Found"));
    }
    else {
        res.render("listings/edit.ejs", { listing });
    }
}));

// Update Route
app.put("/listings/:id", validateListing, async (req, res) => {
    let { id } = req.params;
    let listing = req.body.listing;
    await Listing.findByIdAndUpdate(id, {...listing}, { runValidators : true });
    res.redirect(`/listings/${id}`);
});

// Delete Route
app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
});

app.post("/listings/:id/reviews", validateReview , async(req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    res.redirect(`/listings/${id}`);
});

app.delete("/listings/:id/reviews/:reviewId", async(req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {$pull : {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
});

// No Path Response
app.all("*", (req, res) => {
    throw new expressError(404, "Page Not Found!");
});

// Error Handling Middleware 1 -> Default Error Handling Middleware
app.use((err, req, res, next) => {
    let {status = 500, message = "Something went wrong"} = err;
    res.status(status).render("listings/error.ejs", { message });
});