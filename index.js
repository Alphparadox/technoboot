const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();

const connectDB = () => {
  mongoose
    .connect("mongodb://localhost:27017")
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
};

connectDB();

app.use(express.json());

//question 3
const limiter = rateLimit({
  windowMs: 60000,
  max: 10,
});

app.use(limiter);

// question 1

const countrySchema = new mongoose.Schema({
  id: Number,
  name: String,
  code: String,
});

const stateSchema = new mongoose.Schema({
  id: Number,
  name: String,
  countryId: Number,
  countryCode: String,
  countryName: String,
  stateCode: String,
  type: String,
  lat: String,
  long: String,
});

const citySchema = new mongoose.Schema({
  id: Number,
  name: String,
  stateId: Number,
  stateCode: String,
  stateName: String,
  countryId: Number,
  countryCode: String,
  countryName: String,
  lat: String,
  long: String,
  wikiId: String,
});

const Country = mongoose.model("Country", countrySchema);
const State = mongoose.model("State", stateSchema);
const City = mongoose.model("City", citySchema);

const importData = async () => {
  const states = JSON.parse(fs.readFileSync("states.JSON", "utf-8"));
  const cities = JSON.parse(fs.readFileSync("cities.JSON", "utf-8"));

  await State.insertMany(states);
  await City.insertMany(cities);

  const countries = [];
  states.forEach((state) => {
    if (!countries.find((country) => country.id === state.countryId)) {
      countries.push({
        id: state.countryId,
        name: state.countryName,
        code: state.countryCode,
      });
    }
  });

  await Country.insertMany(countries);

  console.log("Data Imported");
};

importData();

// question 2

//2.a

app.get("/countries", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const countries = await Country.find()
    .skip((page - 1) * limit)
    .limit(limit);
  res.json(countries);
});

//2.b

app.get("/countries/search", async (req, res) => {
  const keyword = req.query.q;
  const countries = await Country.find({ name: { $regex: keyword } });
  res.json(countries);
});

//2.c

app.get("/states/search", async (req, res) => {
  const keyword = req.query.q;
  const states = await State.find({ name: { $regex: keyword } });
  res.json(states);
});

//2.d

app.get("/states/by-country", async (req, res) => {
  const countryId = parseInt(req.query.countryId);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const states = await State.find({ countryId })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json(states);
});

//2.e

app.get("/cities/search", async (req, res) => {
  const keyword = req.query.q;
  const cities = await City.find({ name: { $regex: keyword } });
  res.json(cities);
});

//2.f

app.get("/cities/by-state", async (req, res) => {
  const stateId = parseInt(req.query.stateId);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const cities = await City.find({ stateId })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json(cities);
});

//2.g

app.get("/country", async (req, res) => {
  const countryName = req.query.name;
  const country = await Country.findOne({ name: countryName });
  if (!country) {
    return res.status(404).send("Country not found");
  }
  const totalStates = await State.countDocuments({ countryId: country.id });
  const totalCities = await City.countDocuments({ countryId: country.id });
  res.json({
    name: country.name,
    code: country.code,
    totalStates,
    totalCities,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
