// Details screen: shows one exercise and its related sport,
// or an empty form when we come from the New button

// How do we know which mode we are in? From the address of the page:
//   details.html?id=EX001   -> an existing exercise (we came from the list)
//   details.html?mode=new   -> a new exercise (we came from the New button)
const params = new URLSearchParams(window.location.search);
const exerciseId = params.get("id");              // null when there is no id in the address
const isNewMode = params.get("mode") === "new";

// =====================================================================
// PART 1: show data on the page (no API calls here)
// =====================================================================

// Show a short message above the form
function showMessage(text) {
    document.getElementById("message").textContent = text;
}

// Fill the sport dropdown with the sports from the API
function showSportsDropdown(sports) {
    const dropdown = document.getElementById("sport");
    dropdown.innerHTML = ""; // remove the old options
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Choose a sport";
    dropdown.appendChild(firstOption);
    for (const sport of sports) {
        const option = document.createElement("option");
        option.value = sport.sport_id;
        option.textContent = sport.name;
        dropdown.appendChild(option);
    }
}

// Fill the form with the values of an existing exercise
function showExercise(exercise) {
    document.getElementById("pageTitle").textContent = exercise.name;
    document.getElementById("name").value = exercise.name;
    document.getElementById("category").value = exercise.category;
    document.getElementById("difficulty").value = exercise.difficulty;
    document.getElementById("duration").value = exercise.duration_minutes;
    document.getElementById("sport").value = exercise.sport_id;
    document.getElementById("description").value = exercise.description;
}

// Add one "label: value" line to the related sport panel
function addInfo(list, label, text) {
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    value.textContent = text;
    list.appendChild(term);
    list.appendChild(value);
}

// Show the related sport (from Collection B) under the form
function showSport(sport) {
    const list = document.getElementById("sportInfo");
    list.innerHTML = "";
    addInfo(list, "Name", sport.name);
    addInfo(list, "Type", sport.type);
    addInfo(list, "Origin", sport.origin_country);
    addInfo(list, "Description", sport.description);
    addInfo(list, "Key attributes", sport.key_attributes);
    document.getElementById("sportPanel").hidden = false;
}

// Read the values of the form and build the object we send to the API
function readForm() {
    return {
        name: document.getElementById("name").value,
        category: document.getElementById("category").value,
        difficulty: document.getElementById("difficulty").value,
        duration_minutes: Number(document.getElementById("duration").value),
        sport_id: document.getElementById("sport").value,
        description: document.getElementById("description").value
    };
}

// Save button (or Enter) calls saveExercise(), Delete button calls deleteExercise()
document.getElementById("exerciseForm").addEventListener("submit", (event) => {
    event.preventDefault(); // stopping the browser from reloading the page
    if (isNewMode) return; 
    saveExercise();
});

// =====================================================================
// PART 2: talk to the API
// =====================================================================

// A. Load all sports for the dropdown: GET /sports
async function loadSports() {
    try {
        const response = await fetch("/sports");
        if (!response.ok) {
            showMessage("Couldn't load the sports (status " + response.status + ")");
            return;
        }
        const sports = await response.json();
        showSportsDropdown(sports);
    } catch (error) {
        showMessage("The API is not running. Start it with: npm run dev");
    }
}

// B. Load one exercise: GET /exercises/:id
async function loadExercise(id) {
    try {
        const response = await fetch("/exercises/" + encodeURIComponent(id));
        if (response.status === 404) {
            showMessage("Exercise " + id + " was not found.");
            return;
        }
        if (!response.ok) {
            showMessage("Couldn't load the exercise (status " + response.status + ")");
            return;
        }
        const exercise = await response.json();
        showExercise(exercise);
        loadSport(exercise.sport_id); // use the relationship field
    } catch (error) {
        showMessage("The API is not running. Start it with: npm run dev");
    }
}

// C. Load the related sport: GET /sports/:id
async function loadSport(id) {
    try {
        const response = await fetch("/sports/" + encodeURIComponent(id));
        if (!response.ok) {
            showMessage("Couldn't load the related sport (status " + response.status + ")");
            return;
        }
        const sport = await response.json();
        showSport(sport);
    } catch (error) {
        showMessage("The API is not running. Start it with: npm run dev");
    }
}

// D. Save the changes: Put /exercises/:id
async function saveExercise() {
    try {
        const response = await fetch("/exercises/" + encodeURIComponent(exerciseId), {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(readForm())
        });
        if (!response.ok) {
            const problem = await response.json();
            showMessage("Couldn't Save: " + problem.error);
            return;
        }
        window.location.href = "index.html"; // Back to home
    } catch (error) {
        showMessage("The API is not running. Start it with npm run dev");
    }
}

// F. When the page opens, decide the mode
async function startDetails() {
    await loadSports(); // the dropdown must be ready before we fill the form
    if (isNewMode) {
        document.getElementById("pageTitle").textContent = "New exercise";
        return;
    }
    if (exerciseId === null) {
        showMessage("No exercise selected. Go back to Home and choose one.");
        return;
    }
    await loadExercise(exerciseId);
}

startDetails();
