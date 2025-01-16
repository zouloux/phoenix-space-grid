
// ----------------------------------------------------------------------------- HELPERS

function log (a, b) {
	console.log("FILTER$$", `[LOG] ${a}`, b ? JSON.stringify(b) : "")
}
function info (a, b) {
	console.log("FILTER$$", `[INFO] ${a}`, b)
}

// ----------------------------------------------------------------------------- STATE

// Build and show a modal in the middle of the main screen
// FIXME : Should be responsive, what about multiple screens ?
// We measure it once at app launch, but it should change each time Screen configuration changes
const screenFrame = Screen.main().flippedVisibleFrame()

// Extract all space names and count them
const allSpaceNames = Object.keys(config.spaces)
const totalSpaces = allSpaceNames.length

// Extract all registered apps that are tied to a space
const allRegisteredAppNames = Object.values( config.spaces ).map( s => s.apps.flat(1) ).flat(1)

// ----------------------------------------------------------------------------- STATE

const state = {
	// Selected space index
	spaceIndex: 0,
	// State of all spaces
	spaces: Object.keys( config.spaces ).map( name => ({
		// Copy space name
		name,
		// Copy apps names array from config ( top and bottom )
		apps: [ ...config.spaces[ name ].apps ],
		// All apps names of this space
		allApps: config.spaces[ name ].apps.flat( 1 ),
		// Index of the current top layer app
		topAppIndex: 0,
		// Index of the current bottom layer app
		bottomAppIndex: 0,
		// If current is top or bottom
		// FIXME : On dual spaces setup, this should behave differently
		//					Matbe keep the vertical position, but move automatically apps to their spaces
		verticalPosition: 0, // 0: top, 1: bottom
		// Little grid modals instances
		modals: {
			dark: null,
			light: null,
			apps: {},
		}
	})),
}

// ----------------------------------------------------------------------------- RUNNING APPS

// List of all running apps objects with name as key
const _runningApps = {}

// Get a running app instance by name, can be null if app is not launched
const getRunningAppByName = ( appName ) => _runningApps[ appName ]

// Get list of all running apps names
const getAllRunningAppsNames = () => Object.keys( _runningApps )

// Get all apps that are running
allRegisteredAppNames.forEach( appName => {
	const app = App.get( appName )
	if ( app )
		_runningApps[ appName ] = app
})

// Listen when app start and stops
Event.on('appDidLaunch', ( app ) => {
	const name = app.name()
	// Register this app instance
	if ( allRegisteredAppNames.indexOf(name) !== -1 ) {
		info('App did launch', name)
		_runningApps[ name ] = app
		selectSpaceFromAppNames( name, true )
	}
})
Event.on('appDidTerminate', ( app ) => {
	const name = app.name()
	// Delete this app instance if terminated
	if ( allRegisteredAppNames.indexOf(name) !== -1 ) {
		info('App did terminate', name)
		delete _runningApps[ name ]
	}
})

// This lock prevent switching twice to an app when already switching from this script
let lockAppDidActivate = false
let currentAppName = null

// When an app is focused, move to its space
Event.on('appDidActivate', (app) => {
	// Remember app name to detect changes from omni app
	let previousAppName = currentAppName
	const appName = app.name()
	currentAppName = appName
	// Do not switch to the new focused app if we are switch from this script
	if ( lockAppDidActivate )
		return
	// Special case, do not return to omni app space
	if ( config.omniApps.indexOf( appName ) !== -1 )
		return
	// Show grid only if not coming from an omni app
	const doShowGrid = !previousAppName || config.omniApps.indexOf( previousAppName ) === -1
	selectSpaceFromAppNames( appName, doShowGrid, true )
})

// ----------------------------------------------------------------------------- GRID

// Config defaults for the small grid
const gridConfig = {
	x: config.grid.marginRight ?? 100,
	y: config.grid.marginBottom ?? 100,
	spacesDistance: config.grid.spacesDistance ?? 170,
	appsDistance: config.grid.appsDistance ?? 44,
	appsMargin: config.grid.appsMargin ?? 14,
	hasShadow: config.grid.hasShadow ?? false,
	spaceFontSize: config.grid.spaceFontSize ?? 18,
	appFontSize: config.grid.appFontSize ?? 8,
	visibilityDuration: config.grid.visibilityDuration ?? 1,
}

// Two appearances for spaces in grid
const spaceModalAppearances = ["dark", "light"]

// Register all delays to be able to cancel them when spacess switching fast
let _smallGridDelays = []

// Build grid modals once, at init.
// We build them all once and keep their ref to avoid Phoenix memory leaks
function buildGrid () {
	state.spaces.forEach((space, i) => {
		const position = {
			x: (
				screenFrame.width
				- gridConfig.x
				- (totalSpaces - i) * gridConfig.spacesDistance
			),
			y: gridConfig.y,
		}
		spaceModalAppearances.forEach( appearance => {
			space.modals[ appearance ] = Modal.build({
				appearance,
				animationDuration: 0,
				hasShadow: gridConfig.hasShadow,
				text: space.name,
				weight: gridConfig.spaceFontSize,
				textAlignment: 'center',
				// Place on bottom right
				origin: ( frame ) => ({
					x: position.x - frame.width / 2,
					y: position.y - frame.height / 2,
				}),
			})
		})
		space.apps.forEach( (apps, verticalPosition) => {
			const direction = verticalPosition === 0 ? +1 : -1
			apps.forEach( (app, i) => {
				space.modals.apps[ app ] = Modal.build({
					appearance: "dark",
					animationDuration: 0,
					hasShadow: gridConfig.hasShadow,
					text: app,
					weight: gridConfig.appFontSize,
					textAlignment: 'center',
					origin: ( frame ) => ({
						x: position.x - frame.width / 2,
						y: (
							position.y
							+ (i + 1) * direction * gridConfig.appsDistance
							+ gridConfig.appsMargin * direction
							- frame.height / 2
						),
					}),
				})
			})
		})
	})
}

// Show the grid and hide it automatically
function showGrid ( highlightSpaceName ) {
	_smallGridDelays.forEach( d => Timer.off( d ) )
	_smallGridDelays = []
	state.spaces.forEach( space => {
		const spaceName = space.name
		const isCurrentSpace = spaceName === highlightSpaceName
		spaceModalAppearances.forEach( appearance => {
			const show = (
				(!isCurrentSpace && appearance === 'dark')
				|| (isCurrentSpace && appearance === 'light')
			)
			const modal = space.modals[ appearance ]
			// Show the correct modal color and close them all after the delay
			if ( show )
				modal.show()
			else
				modal.close()
			_smallGridDelays.push(
				Timer.after(
					config.grid.visibilityDuration,
					() => modal.close()
				)
			)
		})
		Object.keys(space.modals.apps).forEach( appName => {
			// Get this app state
			const modal = space.modals.apps[ appName ]
			const isTop = !!space.apps[0].find( a => a === appName)
			const vTop = space.verticalPosition
			const isCurrentVerticalPosition = vTop === 0 && isTop || vTop === 1 && !isTop
			const isCurrentVerticalApp = appName === space.apps[ vTop ][ vTop === 0 ? space.topAppIndex : space.bottomAppIndex ]
			const isCurrentApp = isCurrentSpace && isCurrentVerticalPosition && isCurrentVerticalApp
			const isAppStarted = !!getRunningAppByName(appName)
			// Current app is in light, other are in dark
			modal.appearance = isCurrentApp ? "light" : "dark"
			let color = isCurrentApp ? 0 : 255
			// Inactive apps are greyed out
			if ( !isAppStarted )
				color = 100
			modal.setTextColor( color, color, color, 1 )
			// Show modal and close them all after the delay
			modal.show()
			_smallGridDelays.push(
				Timer.after(
					config.grid.visibilityDuration,
					() => modal.close()
				)
			)
		})
	})
}

// ----------------------------------------------------------------------------- SELECT SPACE

// Move to a space from its name
function selectSpace ( spaceName ) {
	// Get space index from name
	const newSpaceIndex = allSpaceNames.indexOf( spaceName )
	//log("newSpaceIndex", newSpaceIndex)
	if ( newSpaceIndex === -1 )
		return
	// Update state
	state.spaceIndex = newSpaceIndex
	const currentSpace = state.spaces[ state.spaceIndex ]
	const currentSpaceAppNames = currentSpace.allApps
	// Get app name to focus
	const vPos = currentSpace.verticalPosition
	const appNameToFocus = currentSpace.apps[ vPos ]?.[ vPos === 0 ? currentSpace.topAppIndex : currentSpace.bottomAppIndex ]
	// Browse all running apps, and hide those that are not in the space
	log( "getAllRunningAppsNames", getAllRunningAppsNames() );
	let appsToHide = []
	getAllRunningAppsNames().forEach( appName => {
		// If this is an omni app, do not alter it
		if ( config.omniApps.indexOf(appName) !== -1 )
			return
		// Get running app instance
		const runningApp = getRunningAppByName( appName )
		// Detect errors on this running app
		if ( !runningApp ) {
			info(`App ${appName} not found`)
			return
		}
		if ( runningApp.isTerminated() ) {
			info(`App ${appName} is terminated`)
			delete _runningApps[ appName ]
			return
		}
		// Check if this app is in the space to select
		const isInCurrentSpace = currentSpaceAppNames.indexOf( appName ) !== -1
		// Last focused app of this space will go back in focus
		if ( appNameToFocus === appName )
			runningApp.focus()
		// Other apps of this space will be shown
		else if ( isInCurrentSpace )
			runningApp.show()
		// All other registered apps ( in other spaces ) will be hidden
		else
			appsToHide.push( runningApp )
	})
	// Hide other apps after, to avoid having 0 app focused, even for 1ms.
	// Because MacOS will switch to Finder if no app is focused.
	Timer.after(0.1, () => {
		appsToHide.forEach( app => app.hide() )
	})
}

// Move to a new space with an index delta
function moveToSpace ( delta ) {
	// Compute new position and corresponding space
	const newSpaceIndex = Math.max(0, Math.min( state.spaceIndex + delta, allSpaceNames.length - 1))
	const newSpaceName = state.spaces[ newSpaceIndex ].name
	// Lock app focus listener while we change space
	// Otherwise we could have an infinite loop of focusing, getting notified, etc
	lockAppDidActivate = true
	selectSpace( newSpaceName )
	Timer.after(.1, () => { lockAppDidActivate = false })
	// Update small grid on space
	showGrid( newSpaceName )
}

// Update space state to select an app from its name
function selectSpaceFromAppNames ( appName, doShowGrid, showGridOnlyOnSpaceChange = false ) {
	// Search in all spaces for that app
	let foundSpaceIndex = -1
	let foundPosition = -1
	let foundAppIndex = -1
	state.spaces.forEach( ( space, i) => {
		space.apps.forEach( (apps, ii) => {
			apps.forEach( (app, iii) => {
				if ( app !== appName )
					return
				foundSpaceIndex = i
				foundPosition = ii
				foundAppIndex = iii
			})
		})
	})
	log("selectSpaceFromAppName", {
		appName, foundSpaceIndex, foundPosition, foundAppIndex
	})
	const foundSpace = state.spaces[ foundSpaceIndex ]
	if ( !foundSpace )
		return
	// If we changed space
	if ( (config.grid.showGridOnlyOnSpaceChange ?? false) && showGridOnlyOnSpaceChange && foundSpaceIndex === state.spaceIndex )
		doShowGrid = false
	// We found the corresponding space, update state
	state.spaceIndex = foundSpaceIndex
	foundSpace.verticalPosition = foundPosition
	if ( foundPosition === 0 )
		foundSpace.topAppIndex = foundAppIndex
	else
		foundSpace.bottomAppIndex = foundAppIndex
	// Show the grid
	if ( doShowGrid )
		showGrid( foundSpace.name )
}


// ----------------------------------------------------------------------------- SWITCH APP

// Switch top or bottom app
// Limit is there to avoid infinite loop if no running app is found while switching
function switchApp ( verticalPosition, limit = 10 ) {
	if ( limit === 0 )
		return
	log("switchApp", verticalPosition)
	const space = state.spaces[ state.spaceIndex ]
	if ( !space )
		return
	// Switch in current vertical position ( for ex, 4 fingers ups while an "up" app is already focused )
	if ( verticalPosition === space.verticalPosition ) {
		// Go to next app index on top app
		if ( verticalPosition === 0 ) {
			++space.topAppIndex
			if ( space.topAppIndex > space.apps[0].length - 1 )
				space.topAppIndex = 0
		}
		// Go to next app index on bottom app
		else if ( verticalPosition === 1 ) {
			++space.bottomAppIndex
			if ( space.bottomAppIndex > space.apps[1].length - 1 )
				space.bottomAppIndex = 0
		}
	}
	// Changing vertical position, no app index change
	else {
		space.verticalPosition = verticalPosition
	}
	// Find app to focus
	const vPos = space.verticalPosition
	const appNameToFocus = space.apps[ vPos ][ vPos === 0 ? space.topAppIndex : space.bottomAppIndex ]
	const appToFocus = getRunningAppByName( appNameToFocus )
	// App not found, continue switch and decrease limit to avoid infinite loops
	if ( !appToFocus ) {
		switchApp( verticalPosition, --limit )
		return
	}
	// Focus this app, other apps of this space will simply go behind
	appToFocus.focus()
}

// ----------------------------------------------------------------------------- KEYS

// All those meta keys are send by Better Touch Tool
const fourFingersMetakeys = ['control', 'option', 'command', 'shift']

// TODO : Do a better alt-tab than the macos one
// Key.on('tab', ['option'], () => {
// 	console.log('TAB')
// });
Key.on('space', fourFingersMetakeys, () => {
	// TODO : Show grid and wait for click or escape key
	log('SPACE')
})

// Horizontal four finger keystroke to change space
const horizontalSign = (config.events?.invertHorizontalSwipes ?? false) ? -1 : +1
Key.on('right', fourFingersMetakeys, () => moveToSpace( horizontalSign * +1 ) )
Key.on('left', 	fourFingersMetakeys, () => moveToSpace( horizontalSign * -1 ) )

// Vertical four finger keystroke to switch top or bottom app
const invertVerticalSwipes = (config.events?.invertVerticalSwipes ?? false)
Key.on('up', 	fourFingersMetakeys, () => switchApp(invertVerticalSwipes ? 1 : 0) )
Key.on('down', 	fourFingersMetakeys, () => switchApp(invertVerticalSwipes ? 0 : 1) )


// ----------------------------------------------------------------------------- INIT

// Build small space modals
buildGrid()

// Select current space from focused app at start
const focusedAppAtStart = App.focused()
if ( focusedAppAtStart ) {
	selectSpaceFromAppNames( focusedAppAtStart.name(), true )
}

// Init Phoenix
Phoenix.set({
	daemon: config.phoenix.daemon,
	openAtLogin: config.phoenix.openAtLogin,
});
Phoenix.notify('Phoenix reloaded');

log("state", state);
log("running apps", allRegisteredAppNames);
info("READY");
