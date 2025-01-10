
// ----------------------------------------------------------------------------- HELPERS

// Build and show a modal in the middle of the main screen
// FIXME : Should be responsive, what about multiple screens ?
const screenFrame = Screen.main().flippedVisibleFrame();

// ----------------------------------------------------------------------------- STATE

let focusByScreens = {}

let currentScreenName = null

let lockScreenListener = false


// ----------------------------------------------------------------------------- SCREENS

let screenCurrentIndex = 0
const screenNames = Object.keys( screens )
const screenMaxIndex = screenNames.length - 1

// ----------------------------------------------------------------------------- REGISTERED APPS

// List of all running apps objects with name as key
const _runningApps = {}

// Compute all registered apps in one array
const allRegisteredAppNames = Object.values(screens).map( s => s.apps.flat(2) );
console.log( allRegisteredAppNames );

// Get app instance by name, can be null if app is not launched
const getAppByName = ( appName ) => _runningApps[ appName ]

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
		console.log('[info] App did launch', name)
		_runningApps[ name ] = app
		selectScreenFromAppName( name )
	}
})
Event.on('appDidTerminate', ( app ) => {
	const name = app.name()
	// Delete this app instance if terminated
	if ( allRegisteredAppNames.indexOf(name) !== -1 ) {
		console.log('[info] App did terminate', name)
		delete _runningApps[ name ]
	}
})


// ----------------------------------------------------------------------------- SELECT SCREEN

function selectScreenFromAppName ( appName ) {
	let screen = null
	let position = []
	screensInSpace.map( (line, y) => {
		line.map( (screenName, x) => {
			const screenApps = appsInScreens[ screenName ]
			if ( screenApps.indexOf(appName) === -1 )
				return
			screen = screenName
			position = [x, y]
		})
	})
	if ( !screen )
		return
	// console.log('App did activate', appName, screen, position)
	focusByScreens[ screen ] = appName
	if ( screen === currentScreenName )
		return
	currentScreenName = screen
	screenCurrentIndex = position[0]
	currentY = position[1]
	showSmallGrid( currentScreenName )
}

// When an app is focused, move to its screen
Event.on('appDidActivate', (app) => {
	if ( lockScreenListener )
		return
	const appName = app.name()
	// Special case, do not return to Finder's screen in case a finder window is selected
	if ( appName === 'Finder' )
		return
	selectScreenFromAppName( appName )
})

// ----------------------------------------------------------------------------- SMALL GRID

const _smallGridDistance = 120

const _smallGridMargin = 100

let _smallGridModals = {
	dark: {},
	light: {},
}

const browseSmallGridModals = ( handler ) => {
	Object.keys( _smallGridModals ).forEach( appearance => {
		Object.keys(_smallGridModals[appearance] ).forEach( key => {
			handler( appearance, key, _smallGridModals[appearance][key] )
		})
	})
}

function buildSmallGridModals () {
	Object.keys( _smallGridModals ).forEach( appearance => {
		screensInSpace.map( (line, y) => {
			line.map( (screenName, x) => {
				_smallGridModals[ appearance ][ screenName ] = Modal.build({
					appearance,
					animationDuration: 0,
					hasShadow: true,
					text: screenName,
					weight: 16,
					textAlignment: 'right',
					// Place on bottom right
					origin: ( frame ) => ( {
						x: screenFrame.width - _smallGridMargin - (screenMaxIndex - x) * _smallGridDistance - frame.width / 2,
						y: frame.height / 2,
					} ),
				})
			})
		})
	})
}

let _smallGridDelays = []

function showSmallGrid ( highlightScreenName, duration = .6 ) {
	_smallGridDelays.forEach( d => Timer.off( d ) )
	_smallGridDelays = []
	browseSmallGridModals((appearance, screenName, modal) => {
		//modal.close()
		if (
			(screenName !== highlightScreenName && appearance === 'dark')
			|| (screenName === highlightScreenName && appearance === 'light')
		) {
			modal.show()
		}
		else {
			modal.close()
		}
		_smallGridDelays.push( Timer.after(duration, () => modal.close() ) )
	})
}

// ----------------------------------------------------------------------------- SELECT SCREEN

function selectScreen ( screenName ) {
	const newScreenApps = appsInScreens[ screenName ]
	currentScreenName = screenName
	let appsToHide = []
	let screenHasNoApps = true
	allRegisteredAppNames.forEach( appName => {
		const isInScreen = newScreenApps.indexOf( appName ) >= 0
		const app = getAppByName( appName )
		if ( !app ) {
			console.log(`[info] App ${appName} not found`)
			return
		}
		if ( app.isTerminated() ) {
			console.log(`[info] App ${appName} is terminated`)
			return
		}
		if ( isInScreen )
			screenHasNoApps = false
		// Last focused app of this screen will go back in focus
		if ( focusByScreens[ screenName ] === appName )
			app.focus()
		// Other apps of this screen will be shown
		else if ( isInScreen )
			app.show()
		// All other registered apps ( in other screens ) will be hidden
		else
			appsToHide.push( app )
		// Note that apps that are not registered will be untouched
	})
	// FIXME : If no screen, should not show finder windows
	if ( screenHasNoApps ) {
		getAppByName("Finder")?.hide()
	}
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
	screenCurrentIndex = Math.max(0, Math.min( screenCurrentIndex + delta, screenMaxIndex))
	const newScreenName = screensInSpace[currentY][screenCurrentIndex]
	// Lock app focus listener while we change screen
	// Otherwise we could have an infinite loop of focusing, getting notified, etc
	lockScreenListener = true
	selectScreen( newScreenName )
	Timer.after(.1, () => { lockScreenListener = false })
	// Update small grid on screen
	showSmallGrid( newScreenName )
}

// ----------------------------------------------------------------------------- SWITCH APP IN SCREEN

function switchAppInScreen ( direction ) {
	console.log("switchAppInScreen", direction)
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
Key.on('up', 	fourFingersMetakeys, () => moveToScreen(-1) )
Key.on('down', 	fourFingersMetakeys, () => moveToScreen(+1) )


// ----------------------------------------------------------------------------- DISPLAYS

// TODO : Update size when a new screen connect
Event.on('screensDidChange', () => {
	const displays = Screen.all()
	console.log(`${displays.length} displays`)
	displays.forEach( display => {
		console.log(display)
	})
})

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