//--- Filter Missing Relations ---//
async function recalcFranchises() {
    for (const franchise of franchises) {
		if (stop) break;
		
        const fName = franchise.name;
        const franchiseIds = new Set(franchise.content.map(item => item.id));
		console.log(fName);
        recalc_queue.push(franchise.content[0].id);
        await recalcProcessQueue();
		
        const frels = recalc_relations;
        recalc_relations = [];
        recalc_seenIds = new Set();
        recalc_queue = [];
        
        for (const anime of frels){
            const existing = franchise.content.find(item => item.id === anime.id);
            if (existing && existing.name !== anime.name) {
                console.log("%c Updated name of " + existing.name + " -> " + anime.name, "color:lime");
                existing.name = anime.name;
            }
            if (existing && existing.episodes !== anime.episodes) {
                console.log("%c Updated episodes of " + existing.name + ": " + existing.episodes + " -> " + anime.episodes, "color:lime");
                existing.episodes = anime.episodes;
            }
            if (existing && existing.image !== anime.image) {
                console.log("%c Updated image of " + existing.name + ": " + existing.image + " -> " + anime.image, "color:lime");
                existing.image = anime.image;
            }
        }
		
        const filteredRels = frels.filter(rel => !franchiseIds.has(rel.id));
        franchiseRelations[fName] = filteredRels;
		updateRecalcCards(franchiseRelations);
    }
	
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
					episodes: detail.episodes
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

        const sectionHeader = document.createElement("h4");
        sectionHeader.className = "text-secondary fw-bold mt-4 mb-2";
        sectionHeader.textContent = `📁 ${fName}`;
        cardContainer.appendChild(sectionHeader);

        const row = document.createElement("div");
        row.className = "row";

        entries.forEach(item => {
            const card = document.createElement("div");
            card.className = "col-md-2 mb-2";

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
        }
    });
	localStorage.setItem("franchises", JSON.stringify(franchises));
	alert("Franchises updated successfully!");
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
