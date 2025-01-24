const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const expressError = require("./utils/expressError");
const listings = require("./routes/listing");
const reviews = require("./routes/review");
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

app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);

// No Path Response
app.all("*", (req, res) => {
    throw new expressError(404, "Page Not Found!");
});

// Error Handling Middleware 1 -> Default Error Handling Middleware
app.use((err, req, res, next) => {
    let {status = 500, message = "Something went wrong"} = err;
    res.status(status).render("listings/error.ejs", { message });
});