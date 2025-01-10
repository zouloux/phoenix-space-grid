
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
const screenFrame = Screen.main().flippedVisibleFrame();

let lockScreenListener = false

const allScreenNames = Object.keys(configDefault.screens)

// Extract all registered apps that are tied to a screen
const allRegisteredAppNames = Object.values( configDefault.screens ).map( s => s.apps.flat(1) ).flat(1);

const screenModalAppearances = ["dark", "light"]

// ----------------------------------------------------------------------------- STATE

const state = {
	// Selected screen index
	screenIndex: 0,
	// State of all screens
	screens: Object.keys( configDefault.screens ).map( name => ({
		// Copy screen name
		name,
		// Copy apps names array from config ( top and bottom )
		apps: [ ...configDefault.screens[ name ].apps ],
		// All apps names of this screen
		allApps: configDefault.screens[ name ].apps.flat( 1 ),
		// Index of the current top layer app
		topAppIndex: 0,
		// Index of the current bottom layer app
		bottomAppIndex: 0,
		// If current is top or bottom
		// FIXME : On dual screens setup, this should behave differently
		//					Matbe keep the vertical position, but move automatically apps to their screens
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
		selectScreenFromAppName( name )
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

// When an app is focused, move to its screen
Event.on('appDidActivate', (app) => {
	if ( lockScreenListener )
		return
	const appName = app.name()
	// Special case, do not return to omni app screen
	if ( configDefault.omniApps.indexOf( appName ) !== -1 )
		return
	selectScreenFromAppName( appName )
})

// -----------------------------------------------------------------------------

function selectScreenFromAppName ( appName ) {
	let foundScreenIndex = -1
	let foundPosition = -1
	let foundAppIndex = -1
	state.screens.forEach( (screen, i) => {
		screen.apps.forEach( (apps, ii) => {
			apps.forEach( (app, iii) => {
				if ( app !== appName )
					return
				foundScreenIndex = i
				foundPosition = ii
				foundAppIndex = iii
			})
		})
	})
	log("selectScreenFromAppName", {
		appName, foundScreenIndex, foundPosition, foundAppIndex
	})
	const foundScreen = state.screens[ foundScreenIndex ]
	if ( !foundScreen )
		return
	state.screenIndex = foundScreenIndex
	foundScreen.verticalPosition = foundPosition
	if ( foundPosition === 0 )
		foundScreen.topAppIndex = foundAppIndex
	else
		foundScreen.bottomAppIndex = foundAppIndex
	showSmallGrid( foundScreen.name )
}

// ----------------------------------------------------------------------------- SMALL GRID

// Distance between grid modals
const _smallGridScreenDistance = 170
const _smallGridAppDistance = 44
const _smallGridAppMargin = 14

let _smallGridDelays = []

function buildSmallGridModals () {
	const margin = {
		x: configDefault.grid.marginRight ?? 100,
		y: configDefault.grid.marginBottom ?? 100
	}
	const totalScreens = allScreenNames.length
	state.screens.forEach( (screen, i) => {
		const position = {
			x: screenFrame.width - margin.x - ( totalScreens - i) * _smallGridScreenDistance,
			y: margin.y,
		}
		screenModalAppearances.forEach( appearance => {
			screen.modals[ appearance ] = Modal.build({
				appearance,
				animationDuration: 0,
				hasShadow: false,
				text: screen.name,
				weight: 18,
				textAlignment: 'center',
				// Place on bottom right
				origin: ( frame ) => ({
					x: position.x - frame.width / 2,
					y: position.y - frame.height / 2,
				}),
			})
		})
		screen.apps.forEach( (apps, verticalPosition) => {
			const direction = verticalPosition === 0 ? +1 : -1
			apps.forEach( (app, i) => {
				screen.modals.apps[ app ] = Modal.build({
					appearance: "dark",
					animationDuration: 0,
					hasShadow: false,
					text: app,
					weight: 8,
					textAlignment: 'center',
					// Place on bottom right
					origin: ( frame ) => ({
						x: position.x - frame.width / 2,
						y: position.y + (i + 1) * direction * _smallGridAppDistance + _smallGridAppMargin * direction - frame.height / 2,
					}),
				})
			})
		})
	})
}

function showSmallGrid ( highlightScreenName, duration = 1 ) {
	_smallGridDelays.forEach( d => Timer.off( d ) )
	_smallGridDelays = []
	state.screens.forEach( screen => {
		const screenName = screen.name
		const isCurrentScreen = screenName === highlightScreenName
		screenModalAppearances.forEach( appearance => {
			const show = (
				(!isCurrentScreen && appearance === 'dark')
				|| (isCurrentScreen && appearance === 'light')
			)
			const modal = screen.modals[ appearance ]
			if ( show )
				modal.show()
			else
				modal.close()
			_smallGridDelays.push( Timer.after(duration, () => modal.close() ) )
		})
		Object.keys(screen.modals.apps).forEach( appName => {
			const modal = screen.modals.apps[ appName ]
			// if ( !isCurrentScreen ) {
			// 	modal.close()
			// }
			// else {
			// }
			const isTop = !!screen.apps[0].find( a => a === appName)
			const vTop = screen.verticalPosition
			const isCurrentVerticalPosition = vTop === 0 && isTop || vTop === 1 && !isTop
			const isCurrentVerticalApp = appName === screen.apps[ vTop ][ vTop === 0 ? screen.topAppIndex : screen.bottomAppIndex ]
			const isCurrentApp = isCurrentScreen && isCurrentVerticalPosition && isCurrentVerticalApp
			const isAppStarted = !!getRunningAppByName(appName)
			modal.appearance = isCurrentApp ? "light" : "dark"
			let color = isCurrentApp ? 0 : 255
			if ( !isAppStarted )
				color = 100
			modal.setTextColor( color, color, color, 1 )
			modal.show()
			_smallGridDelays.push( Timer.after(duration, () => modal.close() ) )
		})
	})
}

// ----------------------------------------------------------------------------- SELECT SCREEN

function selectScreen ( screenName ) {
	// Get screen index from name
	const newScreenIndex = allScreenNames.indexOf( screenName )
	log("newScreenIndex", newScreenIndex)
	if ( newScreenIndex === -1 )
		return
	// Update state
	state.screenIndex = newScreenIndex
	const currentScreen = state.screens[ state.screenIndex ]
	const currentScreenAppNames = currentScreen.allApps
	// Get app name to focus
	const vPos = currentScreen.verticalPosition
	const appNameToFocus = currentScreen.apps[ vPos ]?.[ vPos === 0 ? currentScreen.topAppIndex : currentScreen.bottomAppIndex ]
	// Browse all running apps, and hide those that are not in the screen
	log( "getAllRunningAppsNames", getAllRunningAppsNames() );
	let appsToHide = []
	getAllRunningAppsNames().forEach( appName => {
		// If this is an omni app, do not alter it
		if ( configDefault.omniApps.indexOf(appName) !== -1 )
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
		// Check if this app is in the screen to select
		const isInScreen = currentScreenAppNames.indexOf( appName ) !== -1
		// Last focused app of this screen will go back in focus
		if ( appNameToFocus === appName )
			runningApp.focus()
		// Other apps of this screen will be shown
		else if ( isInScreen )
			runningApp.show()
		// All other registered apps ( in other screens ) will be hidden
		else
			appsToHide.push( runningApp )
	})
	// Hide other apps after, to avoid having 0 app focused, even for 1ms.
	// Because MacOS will switch to Finder if no app is focused.
	Timer.after(0.1, () => {
		appsToHide.forEach( app => {
			app.hide()
		})
	})
}

function moveToScreen ( delta ) {
	// Compute new position and corresponding screen
	const newScreenIndex = Math.max(0, Math.min( state.screenIndex + delta, allScreenNames.length - 1))
	const newScreenName = state.screens[ newScreenIndex ].name
	// Lock app focus listener while we change screen
	// Otherwise we could have an infinite loop of focusing, getting notified, etc
	lockScreenListener = true
	selectScreen( newScreenName )
	Timer.after(.1, () => { lockScreenListener = false })
	// Update small grid on screen
	showSmallGrid( newScreenName )
}


// ----------------------------------------------------------------------------- SWITCH APP

function switchApp ( verticalPosition, limit = 10 ) {
	if ( limit === 0 )
		return
	log("switchApp", verticalPosition)
	const screen = state.screens[ state.screenIndex ]
	if ( !screen )
		return
	if ( verticalPosition === screen.verticalPosition ) {
		if ( verticalPosition === 0 ) {
			++screen.topAppIndex
			if ( screen.topAppIndex > screen.apps[0].length - 1 )
				screen.topAppIndex = 0
		}
		else if ( verticalPosition === 1 ) {
			++screen.bottomAppIndex
			if ( screen.bottomAppIndex > screen.apps[1].length - 1 )
				screen.bottomAppIndex = 0
		}
	}
	else {
		screen.verticalPosition = verticalPosition
	}
	const vPos = screen.verticalPosition
	const appNameToFocus = screen.apps[ vPos ][ vPos === 0 ? screen.topAppIndex : screen.bottomAppIndex ]
	const appToFocus = getRunningAppByName( appNameToFocus )
	if ( !appToFocus ) {
		switchApp( verticalPosition, --limit )
		return
	}
	if ( !appToFocus )
		return
	appToFocus.focus()
}

// ----------------------------------------------------------------------------- KEYS

const fourFingersMetakeys = ['control', 'option', 'command', 'shift']

// Shortcut to open cross modal
Key.on('tab', ['option'], () => {
	// _escapeListener = Key.on('escape', [], closeCrossModal);
	console.log('TAB')
});
Key.on('space', fourFingersMetakeys, () => {
	// _escapeListener = Key.on('escape', [], closeCrossModal);
	console.log('SPACE')
})

// Horizontal four finger keystroke to change screen
Key.on('right', fourFingersMetakeys, () => moveToScreen(+1) )
Key.on('left', 	fourFingersMetakeys, () => moveToScreen(-1) )

// Vertical four finger keystroke to change app in screen
Key.on('up', 	fourFingersMetakeys, () => switchApp(0) )
Key.on('down', 	fourFingersMetakeys, () => switchApp(1) )


// ----------------------------------------------------------------------------- INIT

// Build small screen modals
buildSmallGridModals()

// Select current screen from focused app at start
const focusedAppAtStart = App.focused()
if ( focusedAppAtStart ) {
	selectScreenFromAppName( focusedAppAtStart.name() )
}

// Init Phoenix
Phoenix.set({
	daemon: false,
	openAtLogin: true,
});
Phoenix.notify('Phoenix reloaded');

log("state", state);
log("running apps", allRegisteredAppNames);
info("READY");
