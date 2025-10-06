//relations
var seenIds = new Set();
var queue = [];
var relations = [];
var selectedImageIndex = null;

//list
var franchises = [];

//details
var currentFranchiseIndex = null;

//recalc
var recalc_relations=[];
var recalc_seenIds = new Set();
var recalc_queue=[];
var franchiseRelations = {}
var stop = false;

//startup initialization
document.addEventListener("DOMContentLoaded", function () {
	//load data from localstorage to "franchises"
	loadMyList();
	//listener for enter key in the Anime Search Page
	searchEnterListener();
});

//--- Main Navigation Function ---//
function navigate(page, id) {
	// reset scroll, swap page visibility, delete unused data
	window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
	document.querySelectorAll("body > div").forEach(div => div.style.display = "none");
	document.getElementById(page).style.display="block";
	resetVariables();
	
	// startup per page
	switch (page){
		case "search":
			const searchInput = document.getElementById("searchInput");
			if (searchInput) { searchInput.focus(); }
			fetchItems();
			break;
		case "relations":
			queue.push(id);
			processQueue().then(() => {
				document.getElementById("addAnimeBtn").disabled = false;
				document.getElementById("loading-img").src = "./images/done.gif";
				document.getElementById("info-title").innerText = "Ready!";
			});
			break;
		case "list":
			loadMyList();
			stop = true;
			updateFranchiseCards(franchises);
			break;
		case "details":
			loadDetails(id);
			break;
		case "recalc":
			recalcFranchises();
			break;
	}
}

// delete unused data
function resetVariables(){
	//search
	document.getElementById("SearchCardContainer").innerHTML = "";
	document.getElementById("animeSearchInput").value="";
	
	//relations
	relations = [];
	seenIds = new Set();
	queue=[];
	selectedImageIndex = null;
	document.getElementById("RelationsCardContainer").innerHTML = "";
	document.getElementById("addAnimeBtn").disabled = true;
	document.getElementById("loading-img").src = "./images/loading.gif";
	document.getElementById("info-title").innerText = "Loading your franchise...";
	
	//list
	document.getElementById("franchisesSearchInput").value="";
	//details
	currentFranchiseIndex = null;
	
	//recalc
	recalc_relations=[];
	recalc_seenIds = new Set();
	recalc_queue=[];
	franchiseRelations = {}
	document.getElementById("RecalcCardContainer").innerHTML = "";
	document.getElementById("recalc-addAnimeBtn").disabled = true;
	document.getElementById("recalc-loading-img").src = "./images/loading.gif";
	document.getElementById("recalc-info-title").innerText = "Loading ...";
	stop = false;
}

// load localstorage data
function loadMyList(){
	franchises = JSON.parse(localStorage.getItem("franchises")) || [];
}

// Anime Search enter key listener
function searchEnterListener(){
	const input = document.getElementById("animeSearchInput");
	if (input) {
		input.addEventListener("keypress", function (e) {
			if (e.key === "Enter") {
				fetchItems();
			}
		});
	}
}

// delay function for rate limiters
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}