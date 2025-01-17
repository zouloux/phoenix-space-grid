/**
 * ZoulouX's config, tweak it for your needs
 */

const config = {
	phoenix: {
		// If false, will show Phoenix in the MacOS menu bar
		daemon: true,
		openAtLogin: true,
	},
	events: {
		invertHorizontalSwipes: false,
		invertVerticalSwipes: false,
		// Invert only when multiple screens are connected
		// This feels right to me with this setting :
		// - With one screen, switch vertically like 2D grid spaces
		// - With 2 screens vertically, switch inverted to tell where to swap app
		invertVerticalSwipesOnMultipleScreens: true,
	},
	// Grid is shown when changing app or space
	grid: {
		// Grid is on bottom right of the main screen
		marginRight: 0,
		marginBottom: 320,
		// Horizontal distance between spaces modals in grid
		spacesDistance: 170,
		// Vertical distance between each app
		appsDistance: 44,
		// Vertical distance between apps and screens
		appsMargin: 14,
		// Add shadow to all modals
		hasShadow: false,
		// Font sizes of grid modals
		spaceFontSize: 18,
		appFontSize: 8,
		// Grid visibility duration in seconds
		visibilityDuration: 0.8,
		// When swapping all in same space, do not show grid
		showGridOnlyOnSpaceChange: true,
	},
	// Apps that are on all Virtual Spaces
	// This is highly recommended to have Finder as an omni app
	// Other apps that are not declared will be ignored
	omniApps: ["Finder", "iTerm2", "BoltAI", "System Settings", "Activity Monitor"],
	// Apps that are tied to a specific screen
	spaces: {
		"Organise" : {
			apps: [
				// Top apps
				[ "Notes", "Calendar" ],
				// Bottom apps
				[ "KeePassXC", "Anybox" ],
			]
		},
		"Work" 	: {
			apps: [
				// Top apps
				[ "Google Chrome", "Safari", "Firefox" ],
				// Bottom apps
				[ "PhpStorm", "Sublime Text", "Affinity Photo 2", "DaVinci Resolve" ],
			]
		},
		"Browse" : {
			apps: [
				// Top apps
				["Arc", "Figma"],
				// Bottom apps
				["Ferdium", "Messages"],
			]
		},
	}
}
