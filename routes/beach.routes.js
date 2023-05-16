// Routes Configuration
const express = require("express");
const router = express.Router();

// Require Beach Model
const Beach = require("../models/Beach.model");
// Require User Model
const User = require("../models/User.model.js");
// Require Review Model
const Review = require("../models/Review.model.js");

// CRUD
// GET => render the form to create a new beach
router.get("/new", (req, res) => {
  res.render("beaches/new-beach.hbs");
});

// POST => to create new restaurant and save it to the DB
router.post("/new", (req, res) => {
  // add location object here
  const { longitude, latitude, rate, activity, name, description } = req.body;

  async function createBeach() {
    try {
      let newBeach = await Beach.create({
        name,
        description,
        rate,
        activity,
        location: {
          type: "Point",
          coordinate: [longitude, latitude],
        },
      });
      console.log(`${newBeach.name}`);
      res.redirect("/beaches");
    } catch (error) {
      console.log(error);
    }
  }
  createBeach();
});

// GET => to retrieve all the beaches from the DB
router.get("/beaches", (req, res, next) => {
  async function findAllBeaches() {
    try {
      let allBeaches = await Beach.find();
      //console.log('here');
      res.render("beaches/list-beaches.hbs", { beaches: allBeaches });
    } catch (error) {
      console.log(error);
    }
  }
  findAllBeaches();
});

// GET => get the form pre-filled with the details of one beach
router.get("/beaches/:beach_id/edit", async (req, res) => {
  const { beach_id } = req.params;
  try {
    const beach = await Beach.findById(beach_id);

    res.render("beaches/update-beach.hbs", { beach });
  } catch (error) {
    console.log(error);
  }
});

// POST => save updates in the database
router.post("/beaches/:beach_id/edit", async (req, res, next) => {
  const { beach_id } = req.params;
  const { name, description } = req.body;

  try {
    await Beach.findByIdAndUpdate(beach_id, { name, description });
    res.redirect(`/beaches`);
  } catch (error) {
    console.log(error);
  }
});

// DELETE => remove the beach from the DB
router.get("/beaches/:beach_id/delete", async (req, res, next) => {
  const { beach_id } = req.params;
  try {
    await Beach.findByIdAndRemove(beach_id);
    res.redirect("/beaches");
  } catch (error) {
    console.log(error);
  }
});

// GET route to retrieve and display details of a specific Beach
router.get("/beaches/:beach_id", (req, res) => {
  const { beach_id } = req.params;
  async function findBeachFromDb() {
    try {
      // Find all the users
      const users = await User.find();
      // Finding the Beach via Id
      let foundBeach = await Beach.findById(beach_id);
      await foundBeach.populate('reviews author')
      await foundBeach.populate({
        path: "reviews",
        populate: {
          path: "author",
          model: "User",
        },
      });
      res.render("beaches/beach-details.hbs", { beach: foundBeach, users });
    } catch (error) {
      console.log(error);
    }
  }

  findBeachFromDb();
});

router.post("/review/create/:beach_id", (req, res) => {
  const { beach_id } = req.params;
  const { content, author } = req.body;

  async function createReviewinDb() {
    try {
      // Create the Review
      const newReview = await Review.create({ content, author });

      // Add the Review to the Book
      const beachUpdate = await Beach.findByIdAndUpdate(beach_id, {
        $push: { reviews: newReview._id },
      });

      // Add the Review to the User
      const userUpdate = await User.findByIdAndUpdate(author, {
        $push: { reviews: newReview._id },
      });

      res.redirect(`/beaches/${beach_id}`);
    } catch (error) {
      console.log(error);
    }
  }
  createReviewinDb();
});

// DELETE review
router.post("/review/delete/:beach_id", (req, res) => {
  const { beach_id } = req.params;

  async function deleteReviewInDb() {
    try {
      const removedReview = await Review.findByIdAndRemove(beach_id);

      await User.findByIdAndUpdate(removedReview.author, {
        $pull: { reviews: removedReview._id },
      });

      res.redirect(`/beaches/${beach_id}`);
    } catch (error) {
      console.log(error);
    }
  }

  deleteReviewInDb();
});

module.exports = router;
