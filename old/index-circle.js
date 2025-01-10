
// ----------------------------------------------------------------------------- CONFIG

const circle = {
	// ↑ - TOP
	0: ['Google Chrome', 'Figma'],
	// ↗ - TOP RIGHT
	45: ['Spotify'],
	// → - RIGHT
	90: ['Arc', 'Ferdium'],
	// ↘ - BOTTOM RIGHT
	// 135: 'Notes',
	// ↓ - BOTTOM
	180: ['PhpStorm', 'Finder'],
	// ↙ - BOTTOM LEFT
	225: ["KeePassXC", "Anybox"],
	// ← - LEFT
	270: ["Notes", "Calendar"],
	// ↖ - TOP LEFT
	315: ["SoundCloud"],
}

const baseDistance = 140

const secondStageDistanceFactor = 0.7

// ----------------------------------------------------------------------------- HELPERS


// Build and show a modal in the middle of the main screen
const screenFrame = Screen.main().flippedVisibleFrame();


function calculateDistance (point1, point2) {
	const deltaX = point2.x - point1.x;
	const deltaY = point2.y - point1.y;
	return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

// ----------------------------------------------------------------------------- CROSS MODAL

let _escapeListener
let _modalInterval
let _isCrossModalOpened = false
let _openedCrossModals = []

function closeCrossModal () {
	if ( !_isCrossModalOpened )
		return

	Key.off( _escapeListener )
	_escapeListener = null

	clearInterval( _modalInterval )
	_modalInterval = null

	_openedCrossModals.forEach( m => m.close() )
	_isCrossModalOpened = false
}

function createCrossModal ( center, highlightApp ) {

	const common = {
		duration: highlightApp ? 0.5 : null,
		animationDuration: 0,//0.1,
		weight: 8,
		appearance: 'dark',
		hasShadow: false,
	}
	let centerModal = Modal.build({
		...common,
		text: ' ',
		origin: (frame) => ({
			x: center.x - frame.width / 2,
			y: center.y + frame.height / 2,
		}),
	})

	const allModals = [centerModal]

	Object.keys(circle).map( angle => {
		const appNames = circle[ angle ]
		const correctedAngle = angle / 360 * Math.PI * 2
		appNames.forEach( (appName, appDistanceIndex) => {
			const appDistance = (1 + appDistanceIndex * secondStageDistanceFactor) * baseDistance
			const applicationInstance = App.get( appName )

			let totalWindows = "-"
			if ( applicationInstance ) {
				const applicationWindows = applicationInstance.windows()
				totalWindows = applicationWindows.length
			}
			const isSelected = appName === highlightApp
			let appearance = 'dark'
			if ( appName )
				appearance = isSelected ? 'dark' : 'transparent'
			const icon = applicationInstance ? applicationInstance.icon() : null
			const appModal = Modal.build({
				...common,
				appearance,//: isSelected ? 'light' : 'dark',
				icon,
				hasShadow: isSelected,
				text: icon ? `[${totalWindows}]` : `${appName} [${totalWindows}]`,
				// text: `[${totalWindows}]`,
				weight: 8,
				origin: (frame) => ({
					x: center.x + Math.sin( correctedAngle ) * appDistance - frame.width / 2,
					y: center.y + Math.cos( correctedAngle ) * appDistance + frame.height / 2,
				}),
			})

			allModals.push(appModal)
		})
	})

	return allModals
}

function openCrossModal () {
	if ( _isCrossModalOpened )
		return

	const mousePosition = Mouse.location();
	const center = {
		x: mousePosition.x,
		y: screenFrame.height - mousePosition.y,
	}
	_openedCrossModals = createCrossModal( center )
	_openedCrossModals.forEach( m => m.show() )
	_isCrossModalOpened = true

	// let oldPosition = {...mousePosition}
	_modalInterval = setInterval(function () {
		const newPosition = Mouse.location();
		const delta = {
			x: newPosition.x - mousePosition.x,
			y: newPosition.y - mousePosition.y,
		}
		// oldPosition = {...newPosition}
		const angle = Math.atan2( delta.y, delta.x ) / Math.PI * 180
		console.log( angle );
		Mouse.move( mousePosition )

		// const distance = calculateDistance( mousePosition, newPosition )
		// if ( distance > 10 ) {
		// 	closeSelectModal()
		//
		// }
		//console.log( distance )
	}, 200)
}

// ----------------------------------------------------------------------------- FOUR FINGERS

let previousAngle = null
let previousDirection = null
let currentHorizontalDeepIndex = 0
let currentVerticalDeepIndex = 0

const getDirectionFromAngle = angle => angle === 0 || angle === 180 ? 'vertical' : 'horizontal'

function invertAngle (angle) {
	if (angle === 0)
		return 180
	else if ( angle === 180)
		return 0
	else if ( angle === 90)
		return 270
	else if ( angle === 270)
		return 90
}

function selectApp ( appName ) {
	const applicationInstance = App.get( appName )
	console.log("SELECT APP", appName, applicationInstance)
	if ( applicationInstance ) {
		applicationInstance.activate()
		// applicationInstance.focus()
		// const allApps = App.all()
		// allApps.forEach( app => {
			// console.log(app.name(), app === applicationInstance)
			// if ( app.windows().length === 0 )
			// 	return
			// const isCurrent = app.name() === applicationInstance.name()
			// if ( isCurrent ) {
			// 	app.focus()
			// }
			// else {
			// 	app.hide()
			// }
			/*if ( app === applicationInstance ) {
				// applicationInstance.activate()
				// applicationInstance.show()
				app.focus()
			}
			else {
				app.hide()

			}*/
		// })
		//applicationInstance.hide()

		Modal.build({
			duration: 0.5,
			weight: 12,
			text: appName,
			apparence: 'transparent',
			origin: (frame) => ({
				x: screenFrame.width / 2 - frame.width / 2,
				y: screenFrame.height / 2 - frame.height / 2,
			}),
		}).show();
	}

	// const center = {
	// 	x: screenFrame.width / 2,
	// 	y: screenFrame.height / 2,
	// }
	// const modals = createCrossModal( center, appName )
	// modals.forEach( m => m.show() )
}

function selectFourFinger ( angle ) {
	console.log('>', angle)
	const direction = getDirectionFromAngle( angle )
	if ( angle !== previousAngle ) {
		previousAngle = angle
		currentHorizontalDeepIndex = 0
		currentVerticalDeepIndex = 0
	}
	let deepDirection = 1
	// if ( direction !== previousDirection ) {
	// 	previousDirection = direction
	// 	currentHorizontalDeepIndex = 0
	// 	currentVerticalDeepIndex = 0
	// }
	// else if ( angle !== previousAngle ) {
	// 	previousAngle = angle
	// 	if ( direction === "horizontal" && currentHorizontalDeepIndex > 0 ) {
	// 		angle = invertAngle( angle )
	// 		deepDirection = -1
	// 	}
	// 	else if ( direction === "vertical" && currentVerticalDeepIndex > 0 ) {
	// 		angle = invertAngle( angle )
	// 		deepDirection = -1
	// 	}
	// }
	if ( !circle[angle] ) {
		console.log(`No app on angle ${angle}`)
	}
	const angleApps = circle[angle]
	let deep = 0
	if ( direction === "horizontal" ) {
		currentHorizontalDeepIndex = Math.min( currentHorizontalDeepIndex + deepDirection, angleApps.length )
		deep = currentHorizontalDeepIndex - 1
	}
	else {
		currentVerticalDeepIndex = Math.min( currentVerticalDeepIndex + deepDirection, angleApps.length )
		deep = currentVerticalDeepIndex - 1
	}
	console.log(deep)
	selectApp(circle[angle][deep])

	// if ( circle[angle] && circle[angle][0] )
}

// ----------------------------------------------------------------------------- KEYS

// Shortcut to open cross modal
Key.on('tab', ['option'], (a) => {
	// console.log(a)
	openCrossModal()
	_escapeListener = Key.on('escape', [], closeCrossModal);
});

// Four finger keystroke
const fourFingersMetakeys = ['control', 'option', 'command', 'shift']
Key.on('up', 	fourFingersMetakeys, () => selectFourFinger(0) )
Key.on('right', fourFingersMetakeys, () => selectFourFinger(90) )
Key.on('down', 	fourFingersMetakeys, () => selectFourFinger(180) )
Key.on('left', 	fourFingersMetakeys, () => selectFourFinger(270) )


// Loaded modal
Modal.build({
	duration: 0.3,
	text: 'Reloaded',
	origin: (frame) => ({
		x: screenFrame.width / 2 - frame.width / 2,
		y: screenFrame.height / 2 - frame.height / 2,
	}),
}).show();


