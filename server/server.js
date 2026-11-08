// 1. Load the libraries we installed with npm
const express = require("express");
const { MongoClient } = require("mongodb");

// 2. Create the API application
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// 3. Prepare the connection to MongoDB Atlas
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Start with: node --env-file=.env server/server.js");
    process.exit(1);
}
const client = new MongoClient(process.env.MONGO_URI);
let db;

// 4. Test endpoint: is the API running?
app.get("/", (req, res) => {
    res.send("Combat Hub API is running!");
});

// Get /exercises: return all documents from the exercises collection
app.get("/exercises", async (req, res) => {
    try {
        const exercises = await db.collection("exercises").find().toArray();
        res.status(200).json(exercises)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read exercises from the database" })
    }
});

// GET /exercises/count: return the number of exercises
app.get("/exercises/count", async (req, res) => {
    try {
        const exercisesCount = await db.collection("exercises").countDocuments();
        res.status(200).json(exercisesCount);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not count the exercises in the database" });
    }
});

// GET /exercises/search?query=keyword: search exercises using the text index
app.get("/exercises/search", async (req, res) => {
    try {
        const query = req.query.query;

        if (!query || typeof query !== "string" || query.trim() === "") {
            return res.status(400).json({ error: "Search query is required" });
        }

        const results = await db.collection("exercises")
            .find({ $text: { $search: query } })
            .toArray();
        res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not search exercises" });
    }
});

// GET /exercises/:id: return one exercise using custom exercise_id
app.get("/exercises/:id", async (req, res) => {
    try {
        const exercise = await db.collection("exercises").findOne({ exercise_id: req.params.id });

        if (!exercise) return res.status(404).json({ error: "Exercise not found" });
        res.status(200).json(exercise);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read exercise data" });
    }
});

// GET /sports: return all sports (sorted by name, used for the dropdown in the form)
app.get("/sports", async (req, res) => {
    try {
        const sports = await db.collection("sports").find().sort({name: 1}).toArray();
        res.status(200).json(sports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read sports from the database" });
    }
});

// GET /sports/:id: return one sport using our custom sport_id
app.get("/sports/:id", async (req, res) => {
    try {
        const sport = await db.collection("sports").findOne({ sport_id: req.params.id });
        if (!sport) return res.status(404).json({ error: "Sport not found" });
        res.status(200).json(sport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read sport data" });
    }
});

// 6. Connect to Atlas first, then start the API
async function start() {
    await client.connect();
    db = client.db('combat_hub');
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, (error) => {
        if (error) {
            console.error("Could not start the API:", error.message);
            process.exit(1);
        }
        console.log(`API running at http://localhost:${PORT}`);
    });
}

start().catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
});


