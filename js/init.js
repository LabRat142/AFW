/**
 * @author LabRat
 * @description Initializes the app and sets up global state and event listeners.
 */

// Global Variables
let AppState = {
    franchises: [],
    stopFetches: true,
    search: {
        anime: []
    },
    relations: {
        seenIds: new Set(),
        queue: [],
        anime: [],
        selectedImageIndex: null
    },
    list: {
        isListView: false,
        cardSize: 1,
    },
    details: {
        currentFranchiseIndex: null,
    },
    recalc: {
        relations: [],
        seenIds: new Set(),
        queue: [],
        franchiseRelations: {}
    }
}

// Start App when DOM loads
document.addEventListener("DOMContentLoaded", function () {
    InitApp();
});


/**
 * Initialization
 */
function InitApp(){
    window.AppState = AppState;

    // Open Home Page
    navigate("index");

    resetAppState();
    loadMyList();
    addEnterKeyListenerToSearchBar();

}

/**
 * Load saved data from localstorage into AppState.franchises
 */
function loadMyList(){
    AppState.franchises = loadFromLocalStorage();
}

/**
 * Save data from AppState.franchises to localstorage
 */
function saveMyList(){
    saveToLocalStorage(AppState.franchises);
}

/**
 * Add Listener for enter key in the Search Page
 */
function addEnterKeyListenerToSearchBar(){
    // Get InputField
    const input = document.getElementById("animeSearchInput");
    if (!input) {
        console.warn("Search input not found");
        return;
    }
    // Add Enter Key Listener
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            search_FetchItems();
        }
    });
}

/**
 * Reset all global variables
 */
function resetAppState(){
    AppState = {
        franchises: AppState.franchises,
        stopFetches: true,
        search: {
            anime: []
        },
        relations: {
            seenIds: new Set(),
            queue: [],
            anime: [],
            selectedImageIndex: null
        },
        list: {
            isListView: AppState.list.isListView,
            cardSize: AppState.list.cardSize,
        },
        details: {
            currentFranchiseIndex: null,
        },
        recalc: {
            relations: [],
            seenIds: new Set(),
            queue: [],
            franchiseRelations: {}
        }
    }
}