/**
 * @author LabRat
 * @description Functions related to the recalc page.
 */

/**
 * Initializes recalc page
 */
function recalc_Init(){
    AppState.stopFetches = false;

    document.getElementById("recalc-status").innerHTML = "";
    document.getElementById("recalc-addAnimeBtn").disabled = true;
    document.getElementById("recalc-loading-img").src = "./images/loading.gif";
    document.getElementById("recalc-info-title").innerText = "Loading your franchise..."
    document.getElementById("RecalcCardContainer").innerHTML = "";
    document.getElementById("recalc-changelog").innerHTML = "";
    
    recalc_FetchUpdates();
}

async function recalc_FetchUpdates() {
    document.getElementById("recalc-changelog").innerHTML = "";

    for (let i = 0; i < AppState.franchises.length; i++) {
        let franchise = AppState.franchises[i];
        if (AppState.stopFetches) break;

        const fName = franchise.name;
        document.getElementById("recalc-status").innerText = `🔍 Checking: ${fName}... (${i+1}/${AppState.franchises.length})`;

        const franchiseIds = new Set(franchise.content.map(item => item.id));
        const originalContent = [...franchise.content]; // Clone for comparison
        AppState.recalc.queue.push(franchise.content[0].id);
        await recalc_ProcessQueue();

        const frels = AppState.recalc.relations;
        AppState.recalc.relations = [];
        AppState.recalc.seenIds = new Set();
        AppState.recalc.queue = [];

        const updatedItems = [];
        const removedItems = [];

        // Update existing entries
        for (const anime of frels) {
            const existing = franchise.content.find(item => item.id === anime.id);
            if (existing) {
                if (existing.name !== anime.name) {
                    updatedItems.push(`📝 Renamed: <b>${existing.name}</b> → <b>${anime.name}</b>`);
                    existing.name = anime.name;
                }
                if (existing.episodes !== anime.episodes) {
                    updatedItems.push(`📺 Episodes updated for <b>${existing.name}</b>: <br>${existing.episodes} → ${anime.episodes}`);
                    existing.episodes = anime.episodes;
                }
                if (existing.image !== anime.image) {
                    const oldLink = existing.image ? `<a href="${existing.image}" target="_blank">old</a>` : "none";
                    const newLink = `<a href="${anime.image}" target="_blank">new</a>`;

                    updatedItems.push(`🖼️ Image updated for <b>${existing.name}</b>: <br>${oldLink} → ${newLink}`);
                    existing.image = anime.image;
                }
                if (existing.date !== anime.date) {
                    const oldDate = existing.date ? new Date(existing.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }) : "none";

                    const newDate = new Date(anime.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });

                    updatedItems.push(`📅 Date updated for <b>${existing.name}</b>: <br>${oldDate} → ${newDate}`);
                    existing.date = anime.date;
                }
            }
        }

        // Remove entries no longer in Jikan
        const currentIds = new Set(frels.map(item => item.id));
        franchise.content = franchise.content.filter(item => {
            const keep = currentIds.has(item.id);
            if (!keep) {
                removedItems.push(`❌ Removed: <b>${item.name}</b>`);
            }
            return keep;
        });

        // Add new entries
        const filteredRels = frels.filter(rel => !franchiseIds.has(rel.id));
        AppState.recalc.franchiseRelations[fName] = filteredRels;
        recalc_UpdateCards(AppState.recalc.franchiseRelations);

        // Display changes
        recalc_DisplayChangeLog(fName, updatedItems, removedItems);
    }

    document.getElementById("recalc-status").innerText = "";
    document.getElementById("recalc-addAnimeBtn").disabled = false;
    document.getElementById("recalc-loading-img").src = "./images/done.gif";
    document.getElementById("recalc-info-title").innerText = "Ready!";
}

/**
 * Fetch Franchise Relations Recursively
 */
async function recalc_ProcessQueue(){
    while (AppState.recalc.queue.length > 0) {
        if (AppState.stopFetches) break;
        const aId = AppState.recalc.queue.shift();
        if (AppState.recalc.seenIds.has(aId)) continue;
        AppState.recalc.seenIds.add(aId);

        try {
           let detail = null;
            for (i=0; i<3; i++){
                await delay(1000); // Rate limit
                detail = await jikan_GetAnimeData(aId,"full")
                if (detail != null){
                    break;
                }
            }
            if (detail == null){return;}
            
            // Skip unwanted types
            if (!AppState.recalc.relations.some(i => i.id === aId) && detail.type !== "CM" && detail.type !== "Music" && detail.type !== "PV") {
                AppState.recalc.relations.push({
                    id: detail.mal_id,
                    name: detail.title_english || detail.title,
                    image: detail.images?.jpg?.image_url || "placeholder.jpg",
                    watched: false,
                    episodes: detail.episodes,
                    date: detail.aired.from
                });
            }

            // Process relations of the relation
            const subRelations = detail.relations || [];
            for (const rel of subRelations) {
                if (rel.relation === "Character" || rel.relation === "Other" || rel.relation === "Summary") continue;

                for (const entry of rel.entry) {
                    if (entry.type === "anime" && !AppState.recalc.seenIds.has(entry.mal_id)) {
                        AppState.recalc.queue.push(entry.mal_id);
                    }
                }
            }
        } catch (err) {
            console.error("Fetch error for ID", aId, err);
        }
    }
}

/**
 * Presents missing anime info to user
 * @param {Array<Object>} items - list of missing anime to present on screen
 */
function recalc_UpdateCards(items){
    const cardContainer = document.getElementById("RecalcCardContainer");
    cardContainer.innerHTML = "";

    Object.entries(items).forEach(([fName, entries]) => {
        if (entries.length === 0) return;

        entries.sort((a, b) => a.name.localeCompare(b.name));

        const sectionHeader = document.createElement("h5");
        sectionHeader.className = "text-info fw-bold mb-2";
        sectionHeader.innerHTML = `📁 New in <span class="text-primary">${fName}</span>`;
        cardContainer.appendChild(sectionHeader);

        const row = document.createElement("div");
        row.className = "row";

        entries.forEach(item => {
            const card = document.createElement("div");
            card.className = "col-md-4 mb-4";

            card.innerHTML = `
                <div class="card shadow-sm h-100">
                    <img src="${item.image}" class="card-img-top" alt="${item.name}" />
                    <div class="card-body text-center">
                        <h5 class="card-title">${item.name}</h5>
                    </div>
                </div>
            `;

            row.appendChild(card);
        });

        cardContainer.appendChild(row);
    });
}

/**
 * @param franchiseName
 * @param updates
 * @param removals
 */
function recalc_DisplayChangeLog(franchiseName, updates, removals) {
    if (updates.length === 0 && removals.length === 0) return;

    const container = document.getElementById("recalc-changelog");
    const section = document.createElement("div");
    section.className = "mb-4";

    const header = document.createElement("h5");
    header.className = "text-info fw-bold";
    header.innerHTML = `🔄 Changes in <span class="text-primary">${franchiseName}</span>`;
    section.appendChild(header);

    const list = document.createElement("ul");
    list.className = "list-unstyled";

    [...updates, ...removals].forEach(change => {
        const item = document.createElement("li");
        item.className = "mb-1";
        item.innerHTML = change;
        list.appendChild(item);
    });

    section.appendChild(list);
    container.appendChild(section);
}

/**
 * Update franchises with the newly discovered updates
 */
function recalc_UpdateFranchises() {
    AppState.franchises.forEach(franchise => {
        const fName = franchise.name;
        const extraContent = AppState.recalc.franchiseRelations[fName];

        if (Array.isArray(extraContent)) {
            // Avoid duplicates by checking for existing IDs
            const existingIds = new Set(franchise.content.map(item => item.id));
            const newItems = extraContent.filter(item => !existingIds.has(item.id));

            franchise.content.push(...newItems);

            franchise.content = [...franchise.content].sort((a, b) => {
                const hasDateA = !!a.date;
                const hasDateB = !!b.date;

                // Prioritize items with both date and episode
                if (!hasDateA && !hasDateB) return 0;
                if (!hasDateA) return 1;
                if (!hasDateB) return -1;

                // If both have date and episode, sort by date
                return new Date(a.date) - new Date(b.date);
            })
            updateFranchiseCompletion(franchise)
        }
    });
    saveMyList();
    alert("Franchises updated successfully!");
    navigate("list");
}