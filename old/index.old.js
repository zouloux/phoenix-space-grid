
// ----------------------------------------------------------------------------- HELPERS

// Build and show a modal in the middle of the main screen
const screenFrame = Screen.main().flippedVisibleFrame();

// ----------------------------------------------------------------------------- STATE

let currentX = 0
let currentY = 0

let screenMaxX = 0
let screenMaxY = 0
screensInSpace.map( s => screenMaxX = Math.max(screenMaxX, s.length) - 1 )
screenMaxY = screensInSpace.length - 1

let listeners = []

let focusByScreens = {}

let currentScreenName = null

let lockScreenListener = false

// -----------------------------------------------------------------------------

function getAllAppNames () {
	return Object.values(appsInScreens).flat(1)
}

function delay ( delay, handler ) {
	setTimeout( handler, delay * 1000 )
}

// -----------------------------------------------------------------------------

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
	currentX = position[0]
	currentY = position[1]
	drawScreens( currentScreenName )
}

Event.on('appDidActivate', (app) => {
	if ( lockScreenListener )
		return
	const appName = app.name()
	selectScreenFromAppName( appName )
})

// Event.on('didLaunch', function () {
// 	console.log("DID LAUNCH")
// })
//
// Event.on('willTerminate', function () {
// 	console.log("WILL TERMINATE")
// })


// ----------------------------------------------------------------------------- DRAW

const gridDistanceX = 140
const gridDistanceY = 80

// const screenModals = []
// screensInSpace.map( (line, invertedY) => {
// 	const center = {
// 		x: screenFrame.width / 2,
// 		y: screenFrame.height / 2,
// 	}
// 	const y = screenMaxY - invertedY
// 	line.map( (screenName, x) => {
// 		// let appearance = highlightScreenName === screenName ? 'light' : 'dark'
// 		const appModal = Modal.build({
// 			// appearance,
// 			duration: 1,
// 			animationDuration: 0,//0.1,
// 			hasShadow: false,
// 			text: screenName,
// 			weight: 12,
// 			textAlignment: 'left',
// 			origin: (frame) => ({
// 				x: center.x + x * gridDistanceX - frame.width / 2,
// 				y: center.y + y * gridDistanceY + frame.height / 2,
// 			}),
// 		})
// 		appModal.screen = screenName
// 		screenModals.push( appModal )
// 	})
// })


function drawScreens ( highlightScreenName, duration = .4 ) {
	const center = {
		x: screenFrame.width / 2,
		y: screenFrame.height / 2,
	}
	const modals = []
	screensInSpace.map( (line, invertedY) => {
		const y = screenMaxY - invertedY
		line.map( (screenName, x) => {
			const isCurrent = highlightScreenName === screenName
			const appModal = Modal.build({
				appearance: isCurrent ? 'light' : 'dark',
				duration,
				animationDuration: 0,//0.1,
				hasShadow: isCurrent,
				text: screenName,
				weight: 14,
				textAlignment: 'left',
				origin: (frame) => ({
					x: center.x + x * gridDistanceX - frame.width / 2,
					y: center.y + y * gridDistanceY + frame.height / 2,
				}),
			})
			appModal.show()
		})
	})
	return modals
}

// -----------------------------------------------------------------------------

function drawSelector () {

}

// ----------------------------------------------------------------------------- SELECT SCREEN

function selectScreen ( screenName ) {
	const newScreenApps = appsInScreens[ screenName ]
	currentScreenName = screenName
	let appsToHide = []
	getAllAppNames().forEach( appName => {
		const isInScreen = newScreenApps.indexOf( appName ) >= 0
		const app = App.get( appName )
		if ( !app ) {
			console.log(`[info] App ${appName} not found`)
			return
		}
		if ( focusByScreens[ screenName ] === appName )
			app.focus()
		else if ( isInScreen )
			app.show()
		else
			appsToHide.push( app )
	})
	delay(0.1, () => {
		appsToHide.forEach( app => {
			// if ( !app.isHidden() )
			app.hide()
		})
	})
}

function moveToScreen ( deltaX, deltaY ) {
	let newX = Math.max(0, Math.min( currentX + deltaX, screenMaxX))
	let newY = Math.max(0, Math.min( currentY + deltaY, screenMaxY))
	currentX = newX
	currentY = newY
	const newScreenName = screensInSpace[newY][newX]
	console.log(">>", newX, newY, newScreenName)
	lockScreenListener = true
	selectScreen( newScreenName )
	drawScreens( newScreenName )
	delay(.2, () => { lockScreenListener = false })
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

// Four finger keystroke
Key.on('up', 	fourFingersMetakeys, () => moveToScreen(0, -1) )
Key.on('right', fourFingersMetakeys, () => moveToScreen(+1, 0) )
Key.on('down', 	fourFingersMetakeys, () => moveToScreen(0, +1) )
Key.on('left', 	fourFingersMetakeys, () => moveToScreen(-1, 0) )



// ----------------------------------------------------------------------------- LOADED

const focusedAppAtStart = App.focused()
if ( focusedAppAtStart ) {
	selectScreenFromAppName( focusedAppAtStart )
}

Phoenix.set({
    daemon: true,
    openAtLogin: true,
});


// Loaded modal
Modal.build({
	duration: 0.3,
	text: 'Reloaded',
	origin: (frame) => ({
		x: screenFrame.width / 2 - frame.width / 2,
		y: screenFrame.height / 2 - frame.height / 2,
	}),
}).show();

