const express = require("express");
const router = express.Router({ mergeParams : true });
const Listing = require("../models/listing");
const Review = require("../models/review");
const {reviewSchema} = require("../utils/schema");
const expressError = require("../utils/expressError");
const asyncWrap = require("../utils/asyncWrap");

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

router.post("/", validateReview , asyncWrap(async(req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    res.redirect(`/listings/${id}`);
}));

router.delete("/:reviewId", asyncWrap(async(req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {$pull : {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));

module.exports = router;