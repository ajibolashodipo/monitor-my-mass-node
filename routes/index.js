const express = require("express");
const router = express.Router();
const Weight = require("../models/weights");
const User = require("../models/users");
const bcrypt = require("bcryptjs");

//landing page
router.get("/", async (req, res) => {
  res.render("index/landing");
});

//register
router.get("/register", async (req, res) => {
  res.render("index/register");
});
router.post("/register", async (req, res) => {
  try {
    let { username, password, confirmPass } = req.body;

    //check for empty input fields
    if (!username || !password || !confirmPass) {
      req.flash("error_msg", "User fields cannot be empty");
      return res.redirect("/register");
    }
    //check for equality between password fields
    if (password !== confirmPass) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/register");
    }
    //check for password length
    if (password.length < 6) {
      req.flash("error_msg", "Passwords too short");
      return res.redirect("/register");
    }

    //check if user doesnt exist in the db

    const user = await User.findOne({ username: req.body.username });
    if (user) {
      req.flash("error_msg", "Account already exists");
      return res.redirect("/register");
    }
    //hash the password
    password = await bcrypt.hash(password, 8);

    //get details from register form
    const userDetail = { username, password };
    //make an instance of the user and save
    const newUser = new User(userDetail);
    await newUser.save();

    req.flash("success_msg", "Sign Up Succesful. Please Login");
    res.redirect("/login");
  } catch (error) {
    req.flash("error_msg", "An error occurred. Try again");
    res.redirect("/register");
  }
});

//login
router.get("/login", async (req, res) => {
  res.render("index/login");
});
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    //check for empty input
    if (!username || !password) {
      req.flash("error_msg", "Empty input fields");
      return res.redirect("/login");
    }
    //check if user exists in the db
    const user = await User.findOne({ username: username });

    if (!user) {
      req.flash("error_msg", "Username or password is wrong");
      return res.redirect("/login");
    }
    //compare passwords using bcrypt
    const isPassword = await bcrypt.compare(password, user.password);
    if (!isPassword) {
      req.flash("error_msg", "Username or password is wrong");
      return res.redirect("/login");
    }

    //we know at this point that the user is who they say they are

    //set session object

    req.session.username = user.username;
    req.session.id = user._id;
    req.session.isLoggedIn = true;
    await req.session.save();

    req.flash("success_msg", "Login Successful");
    res.redirect("/user/dashboard");

    //
  } catch (error) {
    req.flash("error_msg", "An error occurred. Try again");
    res.redirect("/login");
  }
});
router.get("/logout", async (req, res) => {
  //Destroys the session and logs out the user
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.redirect("/login");
    });
  } catch (error) {
    req.flash("error_msg", "An error occurred. Try again");
    res.redirect("/user/dashboard");
  }
});

module.exports = router;
