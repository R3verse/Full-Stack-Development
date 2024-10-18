// app.js

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// Set view engine to EJS
app.set("view engine", "ejs");

// Middleware to serve static files and parse request body
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for posts (instead of a database)
let posts = [];

// Home route - Displays all posts and the form to create a new post
app.get("/", (req, res) => {
  res.render("index", { posts: posts });
});

// Handle post creation
app.post("/posts", (req, res) => {
  const newPost = {
    id: posts.length + 1, // Simple ID generation
    title: req.body.title,
    content: req.body.content,
  };
  posts.push(newPost);
  res.redirect("/");
});

// Render the Edit page with the existing post content
app.get("/posts/:id/edit", (req, res) => {
  const post = posts.find((p) => p.id == req.params.id);
  res.render("edit", { post: post });
});

// Handle post editing
app.post("/posts/:id/edit", (req, res) => {
  const postIndex = posts.findIndex((p) => p.id == req.params.id);
  posts[postIndex].title = req.body.title;
  posts[postIndex].content = req.body.content;
  res.redirect("/");
});

// Handle post deletion
app.post("/posts/:id/delete", (req, res) => {
  posts = posts.filter((p) => p.id != req.params.id);
  res.redirect("/");
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
