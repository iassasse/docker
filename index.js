const express = require("express");
const path = require("path");
const app = express();
const port = 4000;

const mongoose = require("mongoose");
const redis = require("redis");

app.use(express.json());

// Custom CORS middleware (no external dependency needed)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from the current folder
app.use(express.static(__dirname));

// =======================
// DATA (JSON fallback)
// =======================
let equipes = require("./equipe.json");


// =======================
// MONGODB
// =======================
const mongoUrl = process.env.MONGO_URI || "mongodb://root:example@mongo:27017";
mongoose
  .connect(mongoUrl)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.log(`Could not connect to MongoDB at ${mongoUrl}. Trying localhost...`);
    mongoose
      .connect("mongodb://root:example@localhost:27017")
      .then(() => console.log("MongoDB Connected (localhost)"))
      .catch((localErr) => {
        console.log("No local MongoDB server found. Running app with JSON file fallback.");
      });
  });


// =======================
// REDIS
// =======================
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
let redisClient = redis.createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  // Silent error logging to avoid flooding the terminal during local fallback
});

// A simple in-memory mock for local development when Redis is not running
const redisMock = {
  store: new Map(),
  async connect() {
    console.log("Using In-Memory Redis Mock (local fallback)");
  },
  async set(key, value) {
    this.store.set(key, value);
  },
  async get(key) {
    return this.store.get(key) || null;
  },
  on(event, callback) {}
};

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis Connected");
  } catch (err) {
    console.log(`Could not connect to Redis at ${redisUrl}. Trying localhost...`);
    try {
      redisClient = redis.createClient({ url: "redis://localhost:6379" });
      redisClient.on("error", () => {});
      await redisClient.connect();
      console.log("Redis Connected (localhost)");
    } catch (localErr) {
      console.log("No local Redis server found. Falling back to in-memory Redis mock...");
      redisClient = redisMock;
    }
  }
})();


// =======================
// ROUTES
// =======================

// ROOT (TEST + REDIS SET + SERVE FRONTEND)
app.get("/", async (req, res) => {
  try {
    await redisClient.set("product", "product......!");
  } catch (err) {
    console.error("Redis set error:", err);
  }
  res.sendFile(path.join(__dirname, "index.html"));
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