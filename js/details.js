//--- Show Info ---//
function loadDetails(name) {
    const selected = franchises.find(f => f.name === name);
    if (!selected) return;

    currentFranchiseIndex = franchises.indexOf(selected);

    document.getElementById("details-image").src = selected.imageUrl;
    document.getElementById("details-name").innerText = selected.name;
    document.getElementById("checkmark-image").src = selected.marked ? "./images/checked.png" : "./images/unchecked.png";
    document.getElementById("details-completion").innerText = selected.completed ? "Completed" : "Not Completed";
    var totalEpisodes = selected.content.reduce((sum, item) => sum + (item.episodes || 0), 0);
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
            // if not marked and all watched before change, uncompleted
            if (!selected.marked && selected.content.every(item=>item.watched === true)){
                selected.completed = false;
                document.getElementById("details-completion").innerText = "Not Completed";
            }
            
            anime.watched = !anime.watched;
            item.classList.toggle("list-group-item-success");
            
            // if all true after change to completed
            if (!selected.marked && selected.content.every(item=>item.watched === true)){
                selected.completed = true;
                document.getElementById("details-completion").innerText = "Completed";
            }
                
            // Save updated franchise back to localStorage
            franchises[index] = selected;
            localStorage.setItem("franchises", JSON.stringify(franchises));
        });

        list.appendChild(item);
    });
}

// Mark an anime as completed
function markCompleted(){
    index = currentFranchiseIndex;
    const selected = franchises[index];
    if (!selected) return;
    
    if (!selected.marked){
        selected.marked = true;
        selected.completed = true;
        document.getElementById("checkmark-image").src = "./images/checked.png"
        document.getElementById("details-completion").innerText = "Completed";
        franchises[index] = selected;
        localStorage.setItem("franchises", JSON.stringify(franchises));
    } else {
        selected.marked = false;
        if (selected.content.some(item=>item.watched === false)){
                selected.completed = false;
        }
        document.getElementById("checkmark-image").src = "./images/unchecked.png"
        document.getElementById("details-completion").innerText = "Not Completed";
        franchises[index] = selected;
        localStorage.setItem("franchises", JSON.stringify(franchises));
    }
}

// Edit the name of the current franchise
function editFranchiseName() {
    const index = currentFranchiseIndex;
    const selected = franchises[index];
    
    const newName = prompt("Enter a new name for this franchise:", selected.name);
    if (newName && newName.trim()) {
        selected.name = newName.trim();
        franchises[index] = selected;
        localStorage.setItem("franchises", JSON.stringify(franchises));
        document.getElementById("details-name").innerText = selected.name;
    }
}

// Delete current franchise
function deleteFranchise() {
    const index = currentFranchiseIndex;
    const selected = franchises[index];

    if (confirm(`Are you sure you want to delete "${selected.name}" from your list?`)) {
        franchises.splice(index, 1);
        localStorage.setItem("franchises", JSON.stringify(franchises));
        navigate('list');
    }
}
