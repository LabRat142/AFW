/**
 * @author LabRat
 * @description Commonly used functions.
 */


/**
 * Navigates to a specified page and runs its initializer
 * @param {string} page - Target page ("index" | "search" | "relations" | "list" | "details" | "recalc")
 * @param {any} params - optional parameters to pass to the page initializer
 */
function navigate(page, params){

    // Scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Hide all pages
    document.querySelectorAll(".page").forEach(div => { div.style.display = "none"; });
    // Show page navigated to
    const target = document.getElementById(page);
    if (!target) {
        console.error(`Page "${page}" not found`);
        return;
    }
    target.style.display = "block";

    // Reset global variables
    resetAppState();

    // Page-specific initialization
    switch (page) {
        case "index": index_Init(params); break;
        case "search": search_Init(params); break;
        case "relations": relations_Init(params); break;
        case "list": list_Init(params); break;
        case "details": details_Init(params); break;
        case "recalc": recalc_Init(params); break;
        default:
            console.warn(`No initializer defined for page "${page}"`);
    }
}

/**
 * Displays a confirmation dialog before navigating to a different page
 * @param {string} page - Target page ("index" | "search" | "relations" | "list" | "details" | "recalc")
 * @param {any} [params] - Optional parameters to pass to the page initializer
 * @param {string} [message] - Confirmation message shown to the user.
 */
function confirmNavigate(page, params, message = "Are you sure you want to leave this page?") {
    if (confirm(message)) {
        navigate(page,params);
    }
}

/**
 * Save currently loaded franchises to localstorage
 */
function saveToLocalStorage(items) {
    localStorage.setItem("franchises", JSON.stringify(items));
}

/**
 * Load franchises from localstorage
 * @returns {Array<Object>}
 */
function loadFromLocalStorage() {
    return JSON.parse(localStorage.getItem("franchises") || "[]");
}

function updateFranchiseCompletion(franchise) {
    if (franchise.marked) {
        franchise.completed = true;
    } else {
        const allWatched = franchise.content.every(item => item.watched);
        franchise.completed = allWatched;
        document.getElementById("details-completion").innerText = allWatched ? "Completed" : "Not Completed";
    }
    saveMyList();
}

/**
 * Delay execution of code
 * @param ms - time in milliseconds to delay
 * @returns {Promise<>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}