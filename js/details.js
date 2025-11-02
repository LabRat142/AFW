/**
 * @author LabRat
 * @description Functions related to the details page.
 */

/**
 * Initialize details page
 */
function details_Init(franchise_name){
    details_Load(franchise_name)
}

/**
 * Loads all information for the given franchise
 * @param name - name of the franchise to show details for
 */
function details_Load(name) {
    // Get Franchise
    const selected = AppState.franchises.find(f => f.name === name);
    if (!selected) return;

    // Store index in AppState
    AppState.details.currentFranchiseIndex = AppState.franchises.indexOf(selected);

    // Load Franchise Info
    document.getElementById("details-image").src = selected.imageUrl;
    document.getElementById("details-name").innerText = selected.name;
    document.getElementById("checkmark-image").src = selected.marked ? "./images/checked.png" : "./images/unchecked.png";
    document.getElementById("details-completion").innerText = selected.completed ? "Completed" : "Not Completed";
    let totalEpisodes = selected.content.reduce((sum, item) => sum + (item.episodes || 0), 0);
    document.getElementById("total-episodes").innerText = "Episodes: " + totalEpisodes;


    // Render anime list
    const list = document.getElementById("details-anime-list");
    list.innerHTML = "";

    selected.content.forEach((anime, i) => {
        // Ensure watched property exists
        if (anime.watched === undefined) anime.watched = false;

        const item = document.createElement("li");
        item.className = `list-group-item d-flex align-items-center gap-3 ${anime.watched ? 'list-group-item-success' : ''}`;
        item.style.cursor = "pointer";

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center w-100">
                <div class="d-flex align-items-center gap-3">
                    <img src="${anime.image}" alt="${anime.name}" style="width: 50px; height: 50px; object-fit: contain;" class="rounded" />
                    <span>${anime.name}</span>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span class="text-muted">${anime.episodes ?? '—'} eps</span>
                    <div style="border-left: 1px solid #ccc; height: 24px;"></div>
                    <a href="https://myanimelist.net/anime/${anime.id}" target="_blank" title="View on MyAnimeList" onclick="event.stopPropagation();" style="text-decoration: none; color: inherit; font-size:1.2rem">🔗</a>
                </div>
            </div>
        `;

        item.addEventListener("click", () => {
            anime.watched = !anime.watched;
            item.classList.toggle("list-group-item-success");

            updateFranchiseCompletion(AppState.franchises[AppState.details.currentFranchiseIndex]);

        });

        list.appendChild(item);
    });
}

/**
 * Mark currently viewed franchise as completed
 */
function details_MarkCompleted(){
    const index = AppState.details.currentFranchiseIndex;
    const selected = AppState.franchises[index];
    if (!selected) return;

    if (!selected.marked){
        selected.marked = true;
        selected.completed = true;
        document.getElementById("checkmark-image").src = "./images/checked.png"
        document.getElementById("details-completion").innerText = "Completed";
    } else {
        selected.marked = false;
        if (selected.content.some(item=>item.watched === false)){
            selected.completed = false;
            document.getElementById("details-completion").innerText = "Not Completed";
        }
        document.getElementById("checkmark-image").src = "./images/unchecked.png"
    }

    AppState.franchises[index] = selected;
    saveMyList();
}

/**
 * Edit the name of the currently viewed franchise
 */
function details_EditFranchiseName() {
    const index = AppState.details.currentFranchiseIndex;
    const selected = AppState.franchises[index];

    const newName = prompt("Enter a new name for this franchise:", selected.name);
    if (newName && newName.trim()) {
        selected.name = newName.trim();
        AppState.franchises[index] = selected;
        saveMyList();
        document.getElementById("details-name").innerText = selected.name;
    }
}

/**
 * Delete the currently viewed franchise
 */
function details_DeleteFranchise() {
    const index = AppState.currentFranchiseIndex;
    const selected = AppState.franchises[index];

    if (confirm(`Are you sure you want to delete "${selected.name}" from your list?`)) {
        AppState.franchises.splice(index, 1);
        saveMyList();
        navigate('list');
    }
}