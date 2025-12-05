/**
 * @author LabRat
 * @description Functions related to the mal import page.
 */

/**
 * Initializes malport page
 */
function malport_Init(){
    AppState.stopFetches = false;

    document.getElementById("MalportListContainer").innerHTML="";
    document.getElementById("malport-start").style.display = "block";
    document.getElementById("malport-loading").style.display = "none";
    document.getElementById("malport-addAnimeBtn").disabled = true;
    document.getElementById("malport-loading-img").src = "./images/loading.gif";
    document.getElementById("malport-info-title").innerText = "Loading Anime..."
}

async function malport_Start(){
    const fileInput = document.getElementById("malFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a MAL XML file first.");
        return;
    }

    // Show loading state
    document.getElementById("malport-start").style.display = "none";
    document.getElementById("malport-loading").style.display = "block";

    const reader = new FileReader();

    reader.onload = async function(e) {
        const xmlText = e.target.result;

        try {
            // Parse XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");

            // Check for parser errors
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Invalid XML file.");
            }

            // Check if it's a valid MAL export (root <myanimelist>)
            const root = xmlDoc.getElementsByTagName("myanimelist")[0];
            if (!root) {
                throw new Error("This file does not appear to be a valid MyAnimeList export.");
            }

            // ✅ At this point you have a valid MAL XML
            console.log("MAL XML loaded successfully");

            // Get all anime entries
            const animeNodes = xmlDoc.getElementsByTagName("anime");
            const animeIds = [];
            for (let i = 0; i < animeNodes.length; i++) {
                const animeNode = animeNodes[i];
                const idNode = animeNode.getElementsByTagName("series_animedb_id")[0];
                if (idNode) {
                    const animeId = parseInt(idNode.textContent);
                    if (!isNaN(animeId) && !AppState.malport.seenIds.has(animeId)) {
                        animeIds.push(animeId);
                        const statusNode = animeNode.getElementsByTagName("my_status")[0];
                        if (statusNode && statusNode.textContent === "Completed") {
                            AppState.malport.completedIds.add(animeId);
                        }
                    }
                }
            }

            // Start fetching franchises based on anime IDs
            for (const id of animeIds) {
                if (AppState.malport.seenIds.has(id) 
                    || AppState.franchises.map(f => f.content.map(a => a.id)).flat().includes(id)) {
                        continue;
                }
                AppState.malport.queue.push(id);
                await malport_ProcessQueue();
                
                const frels = AppState.malport.relations;
                AppState.malport.relations = [];
                AppState.malport.queue = [];

                if (frels.length > 0) {
                    // Flatten all existing franchise IDs
                    const franchiseEntries = Object.entries(AppState.malport.franchiseRelations);
                    // find if ids already exist 
                    let fName = null;
                    for (const [frKey, frList] of franchiseEntries) {
                        const existingIds = new Set(frList.map(r => r.id));
                        if (frels.some(rel => existingIds.has(rel.id))) {
                            fname = frKey;
                            break;
                        }
                    }
                    
                    // if they exist merge
                    if (fName) {
                        const existingIds = new Set(AppState.malport.franchiseRelations[fName].map(r => r.id));
                        const newRelations = frels.filter(rel => !existingIds.has(rel.id));
                        // Merge frels into the existing franchise list
                        AppState.malport.franchiseRelations[fName].push(...newRelations);
                    } 
                    // else create new franchise
                    else {
                        const oldestRelation = frels.filter(r => r.date != null).reduce((oldest, rel) =>new Date(rel.date) < new Date(oldest.date) ? rel : oldest);
                        fName = oldestRelation.name;
                        AppState.malport.franchiseRelations[fName] = [...frels]
                    }
                }

                malport_UpdateList(AppState.malport.franchiseRelations);
            }
            document.getElementById("malport-addAnimeBtn").disabled = false;
            document.getElementById("malport-loading-img").src = "./images/done.gif";
            document.getElementById("malport-info-title").innerText = "Ready!";

        } catch (error) {
            alert("Error parsing XML file: " + error.message);
            // Reset to start state
            navigate("index");
            return;
        }
    };

    reader.readAsText(file);

}

async function malport_ProcessQueue() {
    while (AppState.malport.queue.length > 0) {
        if (AppState.stopFetches) break;
        const aId = AppState.malport.queue.shift();
        if (AppState.malport.seenIds.has(aId)) continue;
        AppState.malport.seenIds.add(aId);

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
            if (!AppState.malport.relations.some(i => i.id === aId) && detail.type !== "CM" && detail.type !== "Music" && detail.type !== "PV") {
                AppState.malport.relations.push({
                    id: detail.mal_id,
                    name: detail.title_english || detail.title,
                    image: detail.images?.jpg?.image_url || "placeholder.jpg",
                    watched: AppState.malport.completedIds.has(detail.mal_id),
                    episodes: detail.episodes,
                    date: detail.aired.from
                });
            }

            // Process relations of the relation
            const subRelations = detail.relations || [];
            for (const rel of subRelations) {
                if (rel.relation === "Character" || rel.relation === "Other" || rel.relation === "Summary") continue;

                for (const entry of rel.entry) {
                    if (entry.type === "anime" && !AppState.malport.seenIds.has(entry.mal_id)) {
                        AppState.malport.queue.push(entry.mal_id);
                    }
                }
            }
        } catch (err) {
            console.error("Fetch error for ID", aId, err);
        }
    }
}

function malport_UpdateList(items){
    const container = document.getElementById("MalportListContainer");
    container.innerHTML = ""; // clear previous content

    Object.entries(items).forEach(([franchiseName, animeList]) => {
        // Franchise wrapper as a card
        const franchiseDiv = document.createElement("div");
        franchiseDiv.className = "card mb-3 franchise-block";

        // Franchise title inside card header
        const title = document.createElement("div");
        title.className = "franchise-title fw-bold";
        title.textContent = franchiseName;
        
        // Anime list inside card body
        const listWrapper = document.createElement("div");
        listWrapper.className = "card-body p-2";

        const list = document.createElement("ul");
        list.className = "anime-list mb-0";
        animeList.forEach(anime => {
            const li = document.createElement("li");
            li.textContent = anime.name;
            list.appendChild(li);
        });

        listWrapper.appendChild(list);

        // Assemble franchise block
        franchiseDiv.appendChild(title);
        franchiseDiv.appendChild(listWrapper);
        container.appendChild(franchiseDiv);
    });
}


function malport_AddFranchises(){
    for (const [fName, entries] of Object.entries(AppState.malport.franchiseRelations)) {
        AppState.franchises.push({
            name: fName,
            content: entries,
            imageUrl: entries.find(e => e.name === fName)?.image || "placeholder.jpg",
            completed: false,
            marked: false
        });
    }
    saveMyList();
    navigate("index");
}