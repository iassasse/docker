const express = require("express");
const app = express();
const port = 4000;

const mongoose = require("mongoose");
const redis = require("redis");

app.use(express.json());

// =======================
// DATA (JSON fallback)
// =======================
let equipes = require("./equipe.json");


// =======================
// MONGODB
// =======================
mongoose
  .connect("mongodb://root:example@mongo:27017")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));


// =======================
// REDIS
// =======================
const redisClient = redis.createClient({
  url: "redis://redis:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

(async () => {
  await redisClient.connect();
  console.log("Redis Connected");
})();


// =======================
// ROUTES
// =======================

// ROOT (TEST + REDIS SET)
app.get("/", async (req, res) => {
  await redisClient.set("product", "product......!");
  res.send("<h1>API is running 🚀</h1>");
});


// GET REDIS DATA
app.get("/data", async (req, res) => {
  const product = await redisClient.get("product");
  res.send(`<h1>Value from Redis:</h1><h2>${product}</h2>`);
});


// GET ALL EQUIPES
app.get("/equipe", (req, res) => {
  res.json(equipes);
});


// GET BY ID
app.get("/equipe/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const equipe = equipes.find((e) => e.id === id);

  if (!equipe) {
    return res.status(404).json({ message: "Equipe not found" });
  }

  res.json(equipe);
});


// CREATE
app.post("/equipe", (req, res) => {
  const newEquipe = {
    id: equipes.length + 1,
    name: req.body.name,
    country: req.body.country,
  };

  equipes.push(newEquipe);

  res.status(201).json(newEquipe);
});


// UPDATE
app.put("/equipe/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const equipe = equipes.find((e) => e.id === id);

  if (!equipe) {
    return res.status(404).json({ message: "Equipe not found" });
  }

  equipe.name = req.body.name || equipe.name;
  equipe.country = req.body.country || equipe.country;

  res.json(equipe);
});


// DELETE
app.delete("/equipe/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = equipes.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Equipe not found" });
  }

  const deleted = equipes.splice(index, 1);

  res.json(deleted);
});


// =======================
// START SERVER
// =======================
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});