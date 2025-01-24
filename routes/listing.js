const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const {listingSchema} = require("../utils/schema");
const expressError = require("../utils/expressError");
const asyncWrap = require("../utils/asyncWrap");

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

// Index Route
router.get("/", asyncWrap(async(req, res) => {
    let allListings = await Listing.find();
    res.render("listings/index.ejs", { allListings });
}));

// New Route
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Post Route
router.post("/", validateListing, asyncWrap(async(req, res, next) => {
    let listingData = req.body.listing;
        let newListing = new Listing(listingData);
        await newListing.save();
        res.redirect("/listings");
    }
));

// Show Route
router.get("/:id", asyncWrap(async(req, res, next) => {
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
router.get("/edit/:id", asyncWrap(async(req, res, next) => {
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
router.put("/:id", validateListing, asyncWrap(async(req, res) => {
    let { id } = req.params;
    let listing = req.body.listing;
    await Listing.findByIdAndUpdate(id, {...listing}, { runValidators : true });
    res.redirect(`/listings/${id}`);
}));

// Delete Route
router.delete("/:id", asyncWrap(async(req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

module.exports = router;