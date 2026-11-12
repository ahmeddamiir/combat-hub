# Combat Hub 🥋

> A dedicated combat sports conditioning platform that connects disciplines (MMA, Boxing, Wrestling, Judo, Muay Thai, BJJ) with targeted performance drills and athletic routines.

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Combat Hub is a full-stack web application designed for fighters and strength & conditioning coaches to browse, search, and manage specialized fight-camp exercises while referencing sport-specific guidelines and physical attributes.

```This is a semester project for the Advanced Database Systems course.```

---

## Developer

Ahmed Abdelrahman Mohamed Hassan

---

## Tech Stack

- **Database**: MongoDB Atlas
- **Backend**: Node.js + Express.js (RESTful API Architecture)
- **Client**: HTML + CSS + JavaScript (Fetch API)
- **API testing**: Thunder Client
- **Environment & Tooling:** Git, dotenv (`--env-file`), nodemon / `node --watch`
---

## Application Architecture

```text
Client Application (HTML/CSS/JS)
        │  HTTP requests
        ▼
REST API / Backend (Node.js + Express)
        │  MongoDB driver
        ▼
MongoDB Atlas
```

The client never connects directly to MongoDB. All database operations go through the REST API.

---

## Database Design

Database name: `combat_hub`

Two collections:

- `exercises` (Collection A: displayed, searched, and managed by the client - Main CRUD collection)
- `sports` (Collection B: related information shown on the Details screen - Reference collection)

### Collection A: exercises

Strength, conditioning, and technical drills, each belonging to one primary sport.

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB internal ID |
| `exercise_id` | string | Application ID (e.g. `EX001`) |
| `name` | string | Exercise name |
| `category` | string | Strength / Cardio / Mobility / Plyometrics / Technique / Grip |
| `description` | string | What the exercise is and why it helps |
| `difficulty` | string | Beginner / Intermediate / Advanced |
| `duration_minutes` | int | Typical duration |
| `sport_id` | string | Reference to `sports.sport_id` |

### Collection B: sports

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | MongoDB internal ID |
| `sport_id` | string | Application ID (e.g. `SP001`) |
| `name` | string | Sport / martial art name |
| `type` | string | Striking / Grappling / Hybrid |
| `origin_country` | string | Country of origin |
| `description` | string | Short overview |
| `key_attributes` | string | Main physical attributes it demands (e.g. explosiveness, grip strength) |

Note: general conditioning exercises (e.g. squats, rope climbs) belong to a `General Conditioning` entry in `sports`.

---

## Collection Relationship

One sport has many exercises. Each exercise belongs to one primary sport.

```text
sports.sport_id  (1)
      │
      ▼
exercises.sport_id  (many)
```

Schema diagram: `Database_Schema_Diagram.png`

---

## MongoDB Text Search

- Collection with the text index: `exercises`
- Indexed fields: `name`, `description`

```javascript
db.exercises.createIndex({
  name: "text",
  description: "text"
})
```

MongoDB query used in the backend (`server/server.js`):

```javascript
db.collection.("exercises").find({ text: { search: query } }).toArray()
```

**How the search endpoint uses it:**
1. The client sends a request to `GET /exercises/search?query=keyword` (e.g., `/exercises/search?query=explosive`).
2. The server validates that the `query` parameter is a non-empty string (returning a `400 Bad Request` error if missing or blank).
3. It passes the keyword into MongoDB's `$text` operator to search across the indexed `name` and `description` fields, returning the matching exercise documents as a JSON array (`200 OK`).
---

## REST API Endpoints

### Exercises (Collection A)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/exercises` | Return all exercises |
| GET | `/exercises/count` | Return the total number of exercises |
| GET | `/exercises/search?query=keyword` | Search exercises using the MongoDB text index |
| GET | `/exercises/:id` | Return one exercise by `exercise_id` |
| POST | `/exercises` | Create a new exercise |
| PUT | `/exercises/:id` | Update an existing exercise |
| DELETE | `/exercises/:id` | Delete an exercise |

### Sports (Collection B)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/sports/:id` | Return one sport by `sport_id` |
| GET | `/sports` | Return all sports (used for the dropdown in the New/Edit form) |

Total: 9 endpoints (7 required + 2 helper).

Error handling: 400 for invalid input, 404 for non-existing IDs, 500 for server/database errors.

---

## Client Screens

### Home

- Displays all exercises on load
- Search field (uses `/exercises/search`)
- Select an exercise to open Details
- New button

### Details

- Existing exercise: shows the exercise and its related sport (via `sport_id`), with Edit and Delete
- New mode: a form to create a new exercise
- After Add / Edit / Delete, the app returns to Home and refreshes the data

---

## Run Locally

Start the server in development mode (with auto-reload):

```bash
npm run dev
```

Create a `.env` file:

```env
MONGO_URI=your_connection_string
PORT=3000
```

Start the server:

```bash
node --env-file=.env server/server.js
```
