# Anime Franchises Watchlist
Anime Franchises Watchlist (AFW) is a single-page web app that helps you explore and organize anime series into cohesive franchises using data from the [JIKAN API](https://jikan.moe/). It fetches related titles, visualizes them as interactive cards, and lets you curate and save custom franchises with cover images, watch tracking, and completion status.

## Features
- Fetch full relation trees for anime titles (prequels, sequels, side stories, etc.)
- Interactive card view with auto-selection and visual feedback
- Track watched status per title and auto-detect franchise completion
- Save franchises in browser storage with persistent state
- Export and Import franchise lists for easy transfer.

## Built With
- Vanilla JavaScript (modular structure)
- Jikan REST API
- Bootstrap for layout and styling
- LocalStorage for persistence

## Live Demo
You can try the app directly in your browser:
👉 [Anime Franchises Watchlist](https://labrat142.github.io/AFW/)

No installation needed - just open the link and start exploring anime relations, building franchises, and tracking your watch progress.

## Usage Instructions
The app consists of two sections:
- Search section - searching for anime and related titles
- List section - viewing and updating your current list of franchises

1. Search section
- Use the search bar to look up anime titles by name.
- Once you select a title, the app will fetch related content (prequels, sequels, side stories, etc.) and bundle them into a single franchise.
- When the franchise is fully built, the Save Franchise button will become active.
- Before saving, you can click on any of the anime cards to choose a cover image for the franchise.

2. List section
- View and manage the list of franchises you've built. 
- You can:
	- Change how franchises are displayed
	- Click on a franchise to view its details
	- Edit the franchise name and track watch progress for each title
- At the bottom of the list, there's an Update Franchises button. This will:
	- Re-check all saved franchises for updates
	- Fetch any new related anime that should be included
	- Update existing entries with the latest data
- Once the update process is complete, a button will appear allowing you to apply the changes.
