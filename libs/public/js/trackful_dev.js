(function() {

	window.TRACKFUL_KEY = window.TRACKFUL_KEY || null

	const trackfulKey = window.TRACKFUL_KEY

	if (trackfulKey != null) {
		hit = (trackfulKey) => {
			hitData = {"key": trackfulKey, "page": window.location.href}
			useSender('/endpoint/hits', hitData)
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

		newTrackMap(null)



		hit(trackfulKey)
	} else {
		console.debug("Trackful: You haven't initalised your track key. Assign it to window.TRACKFUL_KEY")
	}

})()
