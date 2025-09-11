//--- Anime Search Function ---//
function fetchItems(){
	const query = document.getElementById("animeSearchInput").value.trim();
	if (!query) return;
	const endpoint = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`;
	const search_items = [];
	
	fetch(endpoint)
		.then(res => res.json())
		.then(data => {
			data.data.forEach(item => {
				if (item.type!="CM" && item.type!="Music"){
					search_items.push({
						id: item.mal_id,
						name: item.title_english || item.title,
						image: item.images.jpg.image_url
					});
				}
			});
			updateSearchCards(search_items);
		})
		.catch(err => console.error("Fetch error:", err));
}

//--- Show Results ---//
function updateSearchCards(items){
	const container = document.getElementById("SearchCardContainer");
	container.innerHTML = ""; // Clear previous cards
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