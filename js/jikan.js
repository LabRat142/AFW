/**
 * @author LabRat
 * @description Functions for working with Jikan REST API.
 */

/* --------- Functions for working with Jikan REST API --------- */

/**
 * Get a list of anime
 * @param {string} [q] - Query to search for.
 * @param {number} [limit] - Number of anime per page (max 25).
 * @param {number} [page] - Page number to retrieve.
 * @param {string} [order_by] - Field to order results by. ("mal_id" | "popularity" | "rank" | "score" | "title" |
 * "start_date" | "end_date" | "episodes" | "scored_by" | "members" | "favorites")
 * @param {string} [sort] - Direction to sort the results. ("desc" | "asc")
 * @returns {Promise<Array<Object>>} Array of anime objects with `id`, `name`, and `image` properties.
 */
async function jikan_GetAnimeSearch(q = "", limit = 25, page = 1, order_by = "popularity", sort = "asc") {
    const endpoint = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=${limit}&page=${page}&order_by=${order_by}&sort=${sort}&t=${Date.now()}`;
    const search_items = [];

    try {
        const res = await fetch(endpoint);
        const data = await res.json();

        let foundTop = false;
        for (const item of data.data) {
            if (!q && !foundTop) {
                if (item.popularity === 1) {
                    foundTop = true;
                } else {
                    continue;
                }
            }
            if (item.type !== "CM" && item.type !== "Music") {
                search_items.push({
                    id: item.mal_id,
                    name: item.title_english || item.title,
                    image: item.images?.jpg?.image_url || ""
                });
            }
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }

    return search_items;
}


/**
 * Get info about an anime from the Jikan API.
 * @param {number} id - Anime ID to search for.
 * @param {string} [type] - Optional subresource type ("full" | "relations" | "streaming" | "episodes" | "characters" |
 * "staff" | "news" | "forum" | "videos" | "videos/episodes" | "pictures" | "statistics" | "moreinfo" |
 * "recommendations" | "userupdates" | "reviews" | "themes" | "external").
 * @returns {Promise<Object|null>}  anime data object or null on error.
 */
async function jikan_GetAnimeData(id, type) {
    if (id === undefined) {
        console.error("Can't get anime data, no ID provided");
        return null;
    }

    const endpoint = `https://api.jikan.moe/v4/anime/${id}${type ? `/${type}` : ""}?t=${Date.now()}`;

    try {
        const res = await fetch(endpoint);
        const data = await res.json();

        if (!data || !data.data) {
            console.warn("Unexpected response format:", data);
            return null;
        }

        return data.data;
    } catch (err) {
        console.error("Fetch error:", err);
        return null;
    }
}

