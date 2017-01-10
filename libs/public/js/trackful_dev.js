(function() {
	window.TRACKFUL_KEY = window.TRACKFUL_KEY || null

	const trackfulKey = window.TRACKFUL_KEY
	let ms = 0

	if (trackfulKey != null) {

		navigator.sendBeacon = navigator.sendBeacon || function (url, data) {
			const xhr = new XMLHttpRequest()
			xhr.open('POST', url, false)
			xhr.setRequestHeader("Content-Type", "application/json")
			xhr.withCredentials = false
			xhr.send(JSON.stringify(data))
		}

		hit = (trackfulKey) => {
			hitData = {"key": trackfulKey, "page": window.location.href}
			useSender('/endpoint/hits', hitData)
		}

		incMS = () => {
			ms = ms + 1000
		}

		useSender = (url, senderData) => {
			let sender = new XMLHttpRequest()
			sender.open("POST", url, true)
			sender.setRequestHeader("Content-Type", "application/json")
			sender.withCredentials = false
			sender.onreadystatechange = function () {
			if (sender.readyState != 4 && sender.status != 200)
				console.error("Trackful: Somethings going wrong with tracking. Visit http://trackful.io to cross check your setup again.")
			}
			sender.send(JSON.stringify(senderData))
		}

		msHandler = (e) => {
			const msData = {"key": trackfulKey, "ms": ms, "page": window.location.href}
			navigator.sendBeacon('/endpoint/session/time', msData)
		}

		trackHandler = (e) => {
			let trackData = {"key": trackfulKey, "tracker": e.target.getAttribute('data-track')}
			useSender('/endpoint/clicks', trackData)
			return true
		}

		newTrackMap = (e) => {
			let trackMap = document.querySelectorAll('[data-track]')
			for (let i = 0; i < trackMap.length; i++) {
				let current = trackMap[i]
				current.addEventListener('click', trackHandler)
			}
		}

		window.trackfulTimer = {
			onFocus: function () {
				clearInterval(timerID)
				timerID = setInterval(incMS, 1000)
			},
			onBlur: function () {
				clearInterval(timerID)
			}
		}

		if(window.addEventListener) {
			window.addEventListener('load', function () {
				window.addEventListener('focus', window.trackfulTimer.onFocus)
				window.addEventListener('blur', window.trackfulTimer.onBlur)
			})
		}
		else if(window.attachEvent) {
			window.attachEvent('onload', function () {
				window.attachEvent('onfocus', window.trackfulTimer.onFocus)
				window.attachEvent('onblur', window.trackfulTimer.onBlur)
			})
		}
		else {
			window.onload = function () {
				window.onfocus = window.trackfulTimer.onFocus
				window.onblur = window.trackfulTimer.onBlur
			}
		}

		let timerID = setInterval(incMS, 1000)
		window.addEventListener('unload', msHandler, false)
		newTrackMap(null)
		hit(trackfulKey)

	} else {
		console.debug("Trackful: You haven't initalised your track key. Assign it to window.TRACKFUL_KEY")
	}

})()
