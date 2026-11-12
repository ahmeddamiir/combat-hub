const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Database Setup
if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Start with: npm run dev");
    process.exit(1);
}
const client = new MongoClient(process.env.MONGO_URI);
let db;

// Validation Helper: check the exercise data sent by the client (used by POST and PUT)
// Returns an error message if something is wrong, or null if everything is fine
async function validateExercise(body) {
    const { name, category, description, difficulty, duration_minutes, sport_id } = body;

    const textFields = { name, category, description, difficulty, sport_id };
    for (const [field, value] of Object.entries(textFields)) {
        if (typeof value !== "string" || value.trim() === "") {
            return `${field} is required and must be text`;
        }
    }

    if (typeof duration_minutes !== "number" || duration_minutes <= 0) {
        return "duration_minutes must be a positive number";
    }

    const sport = await db.collection("sports").findOne({ sport_id: sport_id });
    if (!sport) return "sport_id does not match any existing sport";

    return null;
}

// Cleaning Helper: keeps only the allowed fields and trims string values
// and keeps non-string fields unchanged
function cleanBody(body) {
    const allowedFields = ["name", "category", "description", "difficulty", "duration_minutes", "sport_id"]
    const cleaned = {};

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            const value = body[field];
            cleaned[field] = typeof value === "string" ? value.trim() : value;
        }
    }

    return cleaned
}

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

// POST /exercises: add a new exercise
app.post("/exercises", async (req, res) => {
    try {
        const cleanedBody = cleanBody(req.body || {});

        const validationError = await validateExercise(cleanedBody);
        if (validationError) return res.status(400).json({ error: validationError });


        // Create the next exercise_id automatically
        const last = await db.collection("exercises").find().sort({ exercise_id: -1 }).limit(1).toArray();
        const nextNum = last.length > 0 ? parseInt(last[0].exercise_id.slice(2)) + 1 : 1;
        const newId = `EX${String(nextNum).padStart(3, "0")}`;

        const newExercise = {
            ...cleanedBody,
            exercise_id: newId
        };

        await db.collection("exercises").insertOne(newExercise);
        res.status(201).json(newExercise);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not create the exercise" });
    }
});

// PUT /exercises/:id: edit an existing exercise
app.put("/exercises/:id", async (req, res) => {
    try {
        const cleanedBody = cleanBody(req.body || {});

        const validationError = await validateExercise(cleanedBody);
        if (validationError) return res.status(400).json({ error: validationError });


        const result = await db.collection("exercises").updateOne(
            { exercise_id: req.params.id },
            {
                $set: cleanedBody
            }
        );
        if (result.matchedCount === 0)  return res.status(404).json({ error: "Exercise not found" });
        res.status(200).json({ message: "Exercise updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not update the exercise" });
    }
});

// DELETE /exercises/:id: delete an exercise
app.delete("/exercises/:id", async (req, res) => {
    try {
        const result = await db.collection("exercises").deleteOne({ exercise_id: req.params.id });

        if (result.deletedCount === 0) return res.status(404).json({ error: "Exercise not found" });
        res.status(200).json({ message: "Exercise deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not delete the exercise" });
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

// Start Server
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
