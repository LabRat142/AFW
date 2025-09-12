var isListView = false;
var cardSize = 1;
var colClasses = ["col-md-1 px-1 mb-2", "col-md-2 px-2 mb-2", "col-md-4 px-3 mb-2"];
var imgHeights = ["150px", "300px", "600px"];

//--- Show My List ---//
function updateFranchiseCards(items) {
    const cardContainer = document.getElementById("FranchisesCardContainer");
    const listContainer = document.getElementById("FranchisesListContainer");

    cardContainer.innerHTML = "";
    listContainer.innerHTML = "";

    cardContainer.style.display = isListView ? "none" : "block";
    listContainer.style.display = isListView ? "block" : "none";
	
	document.getElementById("toggleViewBtn").innerText = isListView ? "📋" : "🖼"
    

    const categories = {
        Completed: [],
        Unfinished: [],
        Unwatched: []
    };

    items.forEach((item, index) => {
        if (item.completed) {
            categories.Completed.push({ item, index });
        } else {
            const watchedFlags = item.content.map(c => c.watched);
            if (watchedFlags.every(w => w === false)) {
                categories.Unwatched.push({ item, index });
            } else {
                categories.Unfinished.push({ item, index });
            }
        }
    });

    Object.entries(categories).forEach(([label, entries]) => {
        if (entries.length === 0) return;

        entries.sort((a, b) => a.item.name.localeCompare(b.item.name));

        const sectionHeader = document.createElement("h4");
        sectionHeader.className = "text-secondary fw-bold mt-4 mb-2 d-flex justify-content-between align-items-center";
        const headerLabel = document.createElement("span");
        headerLabel.textContent = `📁 ${label}`;
        sectionHeader.appendChild(headerLabel);
        
        if (!isListView && cardContainer.childElementCount === 0) {
            const toggleSizeBtn = document.createElement("button");
            toggleSizeBtn.className = "btn btn-sm btn-outline-secondary";
            toggleSizeBtn.textContent = "↔️ Resize";
            toggleSizeBtn.onclick = toggleCardSize;

            sectionHeader.appendChild(toggleSizeBtn);
        }

        if (isListView) {
            listContainer.appendChild(sectionHeader);
            const listGroup = document.createElement("div");
            listGroup.className = "list-group";

            entries.forEach(({ item }) => {
                const listItem = document.createElement("a");
                listItem.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
                listItem.href = "#";
                listItem.onclick = () => navigate('details', item.name);
                listItem.innerHTML = `
                    <span>${item.name}</span>
                    <span class="badge bg-primary rounded-pill">${item.content.length}</span>
                `;
                listGroup.appendChild(listItem);
            });

            listContainer.appendChild(listGroup);
        } else {
            cardContainer.appendChild(sectionHeader);
            const row = document.createElement("div");
            row.className = "row";

            entries.forEach(({ item }) => {
                const card = document.createElement("div");
                card.className = `card-wrapper ${colClasses[cardSize]}`;

                card.innerHTML = `
                    <div class="card shadow-sm h-100">
                        <img src="${item.imageUrl}" class="card-img-top" style="height:${imgHeights[cardSize]}" alt="${item.name}" />
                        <div class="card-body text-center pb-0">
                            <h5 class="card-title">${item.name}</h5>
                        </div>
                        <p class="text-muted text-center mb-2">Episodes: ${item.content.reduce((sum, item) => sum + (item.episodes || 0), 0)}</p>
                    </div>
                `;

                card.children[0].addEventListener('click', () => {
                    navigate('details', item.name);
                });

                row.appendChild(card);
            });

            cardContainer.appendChild(row);
        }
    });
}

//--- Search Filter ---//
function filterFranchises() {
    const query = document.getElementById("franchisesSearchInput").value.trim().toLowerCase();
    if (!query) {
        updateFranchiseCards(franchises); // Show all if query is empty
        return;
    }

    const words = query.split(/\s+/); // Split query into individual words

    const filtered = franchises.filter(franchise => {
        const searchable = [
            franchise.name.toLowerCase(),
            ...franchise.content.map(item => item.name.toLowerCase())
        ].join(" ");

        // Check if every word is found in the combined searchable string
        return words.every(word => searchable.includes(word));
    });

    updateFranchiseCards(filtered);
}

// Export to json
function exportFranchises() {
    const franchises = JSON.parse(localStorage.getItem("franchises") || "[]");

    const payload = {
        source: "AnimeFranchiesApp_v1", // Unique identifier
        timestamp: Date.now(),
        data: franchises
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "animeFranchises.json";
    a.click();

    URL.revokeObjectURL(url);
}

// Import from json
function importFranchises(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);

            if (parsed?.source !== "AnimeFranchiesApp_v1" || !Array.isArray(parsed.data)) {
                throw new Error("Invalid or unrecognized file format.");
            }

            localStorage.setItem("franchises", JSON.stringify(parsed.data));
            alert("Franchises imported successfully!");
            navigate('list')
        } catch (err) {
            alert("Import failed: " + err.message);
        }
    };
    reader.readAsText(file);
}

// Toggle between list and card view
function toggleViewMode() {
    isListView = !isListView;
    filterFranchises();
}

function toggleCardSize() {
    cardSize = (cardSize+1)%3
    
    updateFranchiseCards(franchises)
}