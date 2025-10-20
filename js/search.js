/**
 * @author LabRat
 * @description Functions related to the search page.
 */

/**
 * Initialize search page
 */
function search_Init(){
    // Focus on searchbar
    const searchInput = document.getElementById("animeSearchInput");
    if (searchInput) { searchInput.focus(); }

    // Fetch and show anime
    search_FetchItems()
}

/**
 * Gets anime list from jikan and presents them to user
 */
async function search_FetchItems(){
    const query = document.getElementById("animeSearchInput").value.trim();
    AppState.search.anime = await jikan_GetAnimeSearch(query)

    search_UpdateCards(AppState.search.anime);
}

/**
 * Presents list of anime to user
 * @param {Array<Object>} items - list of anime to present on screen
 */
function search_UpdateCards(items){
    const container = document.getElementById("SearchCardContainer");
    container.innerHTML = ""; // Clear previous cards

    // Show message if no items
    if (!items.length) {
        container.innerHTML = "<p>No results found.</p>";
        return;
    }

    // Show items
    items.forEach(item => {
        const card = document.createElement("div");
        card.className = "col-md-2 mb-2";

        card.innerHTML = `
			<div class="card h-100">
				<img src="${item.image}" class="card-img-top mx-auto" alt="${item.name}" />
				<div class="card-body">
					<h5 class="card-title">${item.name}</h5>
					<a onclick="navigate('relations',${item.id})" class="btn btn-outline-primary">Add Anime</a>
				</div>
			</div>
		`;

        container.appendChild(card);
    });
}