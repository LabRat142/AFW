//--- Filter Missing Relations ---//
async function recalcFranchises() {
    document.getElementById("recalc-changelog").innerHTML = "";

    for (const franchise of franchises) {
        if (stop) break;

        const fName = franchise.name;
        document.getElementById("recalc-status").innerText = `🔍 Checking: ${fName}...`;

        const franchiseIds = new Set(franchise.content.map(item => item.id));
        const originalContent = [...franchise.content]; // Clone for comparison
        recalc_queue.push(franchise.content[0].id);
        await recalcProcessQueue();

        const frels = recalc_relations;
        recalc_relations = [];
        recalc_seenIds = new Set();
        recalc_queue = [];

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
                    updatedItems.push(`📺 Episodes updated for <b>${existing.name}</b>: ${existing.episodes} → ${anime.episodes}`);
                    existing.episodes = anime.episodes;
                }
                if (existing.image !== anime.image) {
                    updatedItems.push(`🖼️ Image updated for <b>${existing.name}</b>`);
                    existing.image = anime.image;
                }
                if (existing.date !== anime.date) {
                    updatedItems.push(`📅 Date updated for <b>${existing.name}</b>: ${existing.date || "none"} → ${anime.date}`);
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
        franchiseRelations[fName] = filteredRels;
        updateRecalcCards(franchiseRelations);

        // Display changes
        displayChangeLog(fName, updatedItems, removedItems);
    }
	
    document.getElementById("recalc-status").innerText = "";
    document.getElementById("recalc-addAnimeBtn").disabled = false;
    document.getElementById("recalc-loading-img").src = "./images/done.gif";
    document.getElementById("recalc-info-title").innerText = "Ready!";
}

//--- Recursive Relations Finder Function ---//
async function recalcProcessQueue(){
	while (recalc_queue.length > 0) {
        const aId = recalc_queue.shift();
        if (recalc_seenIds.has(aId)) continue;
        recalc_seenIds.add(aId);

        try {
            await delay(1000); // Rate limit
            const res = await fetch(`https://api.jikan.moe/v4/anime/${aId}/full`);
            const data = await res.json();
            const detail = data.data;

            // Skip unwanted types
            if (!recalc_relations.some(i => i.id === aId) && detail.type !== "CM" && detail.type !== "Music") {
                recalc_relations.push({
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
                if (rel.relation === "Character" || rel.relation === "Other") continue;

                for (const entry of rel.entry) {
                    if (entry.type === "anime" && !recalc_seenIds.has(entry.mal_id)) {
                        recalc_queue.push(entry.mal_id);
                    }
                }
            }
        } catch (err) {
            console.error("Fetch error for ID", aId, err);
        }
    }
}

//--- Show Results ---//
function updateRecalcCards(items){
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

function displayChangeLog(franchiseName, updates, removals) {
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



//--- Update All Franchises ---//
function updateFranchises() {
    franchises.forEach(franchise => {
        const fName = franchise.name;
        const extraContent = franchiseRelations[fName];

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
        }
    });
	localStorage.setItem("franchises", JSON.stringify(franchises));
	alert("Franchises updated successfully!");
    navigate("list");
}

// async function updateAnimeWithData() {
    // for (const franchise of franchises) {
        // for (let i = 0; i < franchise.content.length; i++) {
            
            // const anime = franchise.content[i];
			
			// await delay(1000);
            // try {
                // const res = await fetch(`https://api.jikan.moe/v4/anime/${anime.id}`);
                // const data = await res.json();
                // franchise.content[i].??? = data.data.???;
            // } catch (err) {
                // console.error(`Failed to fetch episodes for ${anime.id}`, err);
            // }
        // }
    // }
// }

