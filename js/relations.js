/**
 * @author LabRat
 * @description Functions related to the relations page.
 */

/**
 * Initialize relations page
 * @param {number} anime_id - ID of anime to search relations for
 */
function relations_Init(anime_id){
    AppState.stopFetches = false;
    // Reset information
    document.getElementById("RelationsCardContainer").innerHTML = "";
    document.getElementById("addAnimeBtn").disabled = true;
    document.getElementById("loading-img").src = "./images/loading.gif";
    document.getElementById("info-title").innerText = "Loading your franchise..."

    // Fetch all relations and then update information
    AppState.relations.queue.push(anime_id);
    relations_ProcessQueue().then(() => {
        document.getElementById("addAnimeBtn").disabled = false;
        document.getElementById("loading-img").src = "./images/done.gif";
        document.getElementById("info-title").innerText = "Ready!";
    });
}

/**
 * Fetch Related items for anime recursively
 * Uses AppState parameters in AppState.relations
 */
async function relations_ProcessQueue() {
    const relation_items = AppState.relations.anime;
    while (AppState.relations.queue.length > 0) {
        if (AppState.stopFetches) { return; }

        const aId = AppState.relations.queue.shift();
        if (AppState.relations.seenIds.has(aId)) continue;
        AppState.relations.seenIds.add(aId);

        try {
            await delay(1000); // Rate limit
            const anime_data = await jikan_GetAnimeData(aId,"full")

            // Skip unwanted types
            if (!relation_items.some(i => i.id === aId)
                && anime_data.type !== "CM"
                && anime_data.type !== "Music"
                && anime_data.type !== "PV"
                && anime_data.type !== null) {
                relation_items.push({
                    id: anime_data.mal_id,
                    name: anime_data.title_english || anime_data.title,
                    image: anime_data.images?.jpg?.image_url || "placeholder.jpg",
                    watched: false,
                    episodes: anime_data.episodes,
                    date: anime_data.aired.from
                });
                relations_UpdateCards(relation_items);
            }

            // Process relations of the currently processed anime
            const subRelations = anime_data.relations || [];
            for (const rel of subRelations) {
                if (rel.relation === "Character" || rel.relation === "Other" || rel.relation === "Summary") continue;

                for (const entry of rel.entry) {
                    if (entry.type === "anime" && !AppState.relations.seenIds.has(entry.mal_id)) {
                        AppState.relations.queue.push(entry.mal_id);
                    }
                }
            }
        } catch (err) {
            console.error("Fetch error for ID", aId, err);
        }
    }
}

/**
 * Presents related anime to user
 * @param {Array<Object>} items - list of related anime to present on screen
 */
function relations_UpdateCards(items) {
    const container = document.getElementById("RelationsCardContainer");
    container.innerHTML = "";

    items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "col-md-2 mb-2 selectable-card";
        card.dataset.index = index;

        card.innerHTML = `
			<div class="card h-100">
				<img src="${item.image}" class="card-img-top mx-auto" alt="${item.name}" />
				<div class="card-body text-center">
					<h5 class="card-title">${item.name}</h5>
				</div>
			</div>
		`;

        card.addEventListener("click", () => {
            document.querySelectorAll(".selectable-card").forEach(c => c.children[0].classList.remove("selected"));
            card.children[0].classList.add("selected");
            AppState.relations.selectedImageIndex = index;
        });

        container.appendChild(card);
    });

    // Auto-select first item if available
    if (items.length > 0) {
        AppState.relations.selectedImageIndex = 0;
        document.querySelector(".selectable-card").children[0].classList.add("selected");
    }
}

/**
 * Adds Franchise with all the relations to the list
 */
function relations_AddFranchise() {
    // Get Name
    const name = prompt("Enter franchise name:");
    if (!name) return;

    // Get Sorted Anime
    const relations_items = AppState.relations.anime;
    const sortedItems = [...relations_items].sort((a, b) => {
        const hasDateA = !!a.date;
        const hasDateB = !!b.date;

        if (!hasDateA && !hasDateB) return 0;
        if (!hasDateA) return 1;
        if (!hasDateB) return -1;

        return new Date(a.date) - new Date(b.date);
    });

    // Get Selected Image
    const selected_index = AppState.relations.selectedImageIndex
    if (selected_index === null) {
        alert("Please select a cover image by clicking on a card.");
        return;
    }
    const image = relations_items[selected_index].image;

    // Make the franchise
    const franchise = {
        name: name,
        imageUrl: image,
        content: sortedItems,
        completed: false,
        marked: false
    };

    // Confirm replace existing franchise
    const existing = loadFromLocalStorage();
    const oldFranchise = existing.find(f => f.name === name);
    if (oldFranchise) {
        if (confirm(`A franchise named "${name}" already exists. Replace it?`)){
            // Preserve watched state per anime
            franchise.content = franchise.content.map(anime => {
                const match = oldFranchise.content.find(old => old.id === anime.id);
                return match ? { ...anime, watched: match.watched } : anime;
            });
            if (franchise.content.every(anime => anime.watched === true)) {franchise.completed = oldFranchise.completed;}
        } else { return; }
    }

    // remove existing franchise and append the new one
    const filtered = existing.filter(f => f.name !== name);
    filtered.push(franchise);

    // Update LocalStorage
    AppState.franchises = filtered;
    saveMyList();

    // Refresh Franchises Data
    loadMyList();

    alert(`Franchise "${name}" saved!`);
}