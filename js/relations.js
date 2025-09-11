//--- Recursive Relations Search Function ---//
async function processQueue() {
    while (queue.length > 0) {
        const aId = queue.shift();
        if (seenIds.has(aId)) continue;
        seenIds.add(aId);

        try {
            await delay(1000); // Rate limit
            const res = await fetch(`https://api.jikan.moe/v4/anime/${aId}/full`);
            const data = await res.json();
            const detail = data.data;

            // Skip unwanted types
            if (!relations.some(i => i.id === aId) 
				&& detail.type !== "CM" 
				&& detail.type !== "Music" 
				&& detail.type !== "PV" 
				&& detail.type !== null) {
                relations.push({
                    id: detail.mal_id,
                    name: detail.title_english || detail.title,
                    image: detail.images?.jpg?.image_url || "placeholder.jpg",
                    watched: false,
					episodes: detail.episodes
                });
                updateRelationsCards(relations);
            }

            // Process relations of the relation
            const subRelations = detail.relations || [];
            for (const rel of subRelations) {
                if (rel.relation === "Character" || rel.relation === "Other") continue;

                for (const entry of rel.entry) {
                    if (entry.type === "anime" && !seenIds.has(entry.mal_id)) {
                        queue.push(entry.mal_id);
                    }
                }
            }
        } catch (err) {
            console.error("Fetch error for ID", aId, err);
        }
    }
}

//--- Show Results ---//
function updateRelationsCards(items) {
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
			selectedImageIndex = index;
		});

		container.appendChild(card);
	});

	// Auto-select first item if available
	if (items.length > 0) {
		selectedImageIndex = 0;
		document.querySelector(".selectable-card").children[0].classList.add("selected");
	}
}

//--- Create New Frnachse ---//
function addFranchise() {
	const name = prompt("Enter franchise name:");
	if (!name) return;

	if (selectedImageIndex === null) {
		alert("Please select a cover image by clicking on a card.");
		return;
	}

	const selectedItem = relations[selectedImageIndex];

	const sortedItems = [...relations].sort((a, b) => a.name.localeCompare(b.name));

	const franchise = {
		name: name,
		imageUrl: selectedItem.image,
		content: sortedItems,
		completed: false,
		marked: false
	};

	const existing = JSON.parse(localStorage.getItem("franchises") || "[]");
	
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
	
	const filtered = existing.filter(f => f.name !== name);
	filtered.push(franchise);
	localStorage.setItem("franchises", JSON.stringify(filtered));
	
	loadMyList();

	alert(`Franchise "${name}" saved!`);
}