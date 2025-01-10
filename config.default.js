/**
 * ZoulouX's config
 */

const configDefault = {
	// Grid is on bottom right of the main screen
	grid: {
		marginRight: 0,
		marginBottom: 320,
	},
	// Apps that are on all virtual screens
	omniApps: ["Finder", "iTerm", "BoltAI", "System Settings", "Activity Monitor"],
	// Apps that are tied to a specific screen
	screens: {
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
