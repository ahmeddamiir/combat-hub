// Home screen: shows all exercises, with search

// =====================================================================
// PART 1: show data on the page (no API calls here)
// =====================================================================

// Show a list of exercises in the table
function showExercises(exercises) {
    const rows = document.getElementById("exerciseRows");
    rows.innerHTML = "";                       // remove the old rows
    if (exercises.length === 0) {
        showMessage("No exercises found. Try a whole word, for example “grip”.");
        return;
    }
    showMessage("");
    for (const exercise of exercises) {
        const row = document.createElement("tr");
        // The name is a link to the Details screen
        const link = document.createElement("a");
        link.href = "details.html?id=" + encodeURIComponent(exercise.exercise_id);
        link.textContent = exercise.name;
        const nameCell = document.createElement("td");
        nameCell.appendChild(link);
        row.appendChild(nameCell);
        addCell(row, exercise.category);
        addCell(row, exercise.difficulty);
        addCell(row, exercise.duration_minutes + " min");
        rows.appendChild(row);
    }
}

// Add one table cell with some text to a row
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Show a short message above the table
function showMessage(text) {
    document.getElementById("message").textContent = text;
}

// Search button (or Enter) calls searchExercises(); "Show all" calls loadExercises()
document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchExercises();
});
document.getElementById("showAllButton").addEventListener("click", () => {
    document.getElementById("searchBox").value = "";
    loadExercises();
});

// =====================================================================
// PART 2: talk to the API
// =====================================================================

// A. Load all exercises from the API: GET /exercises
async function loadExercises() {
    try {
        const response = await fetch("/exercises");
        if (!response.ok) {
            showMessage("Couldn't load the exercises (status " + response.status + ")");
            return;
        }
        const exercises = await response.json();
        showExercises(exercises);
    } catch (error) {
        showMessage("The API is not running. Start it with: npm run dev");
    }
}

// B. Search with the text index: GET /exercises/search?query=...
async function searchExercises() {
    const text = document.getElementById("searchBox").value.trim();
    if (text === "") {
        loadExercises();
        return;
    }
    try {
        const response = await fetch("/exercises/search?query=" + encodeURIComponent(text));
        if (!response.ok) {
            showMessage("Search failed (status " + response.status + ")");
            return;
        }
        const exercises = await response.json();
        showExercises(exercises);
    } catch (error) {
        showMessage("The API is not running. Start it with: npm run dev");
    }
}

// C. When the page opens, load all exercises
loadExercises();
