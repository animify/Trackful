$(() => {
	if (typeof io == 'function') {
		var socket = io(trackR)
		socket.on('change', function(r) {
			console.log(r.type);
			switch (r.type) {
				case "click":
					updateClickTrackers(r.change)
					break
				case "hit":
					updateHitTrackers(r.change)
					break
			}
		})

		updateClickTrackers = (trackers) => {
			$.each(trackers, (trackerName, trackerCount) => {
				$(`[data-click="${trackerName}"]`).length ? $(`[data-click="${trackerName}"]`).text(`${trackerName} ${trackerCount}`) : $('#trackers').append(`<li data-click="${trackerName}">${trackerName} ${trackerCount}</li>`)
			})
		}

		updateHitTrackers = (trackers) => {
			$.each(trackers, (trackerName, trackerCount) => {
				$(`[data-hit="${trackerName}"]`).length ? $(`[data-hit="${trackerName}"]`).text(`${trackerName} ${trackerCount}`) : $('#trackers').append(`<li data-hit="${trackerName}">${trackerName} ${trackerCount}</li>`)
			})
		}
	}

	$('.create').bind('click', function() {
		data = {name: $('#appname').val()}
		$.ajax({
			url: '/create/key',
			type: 'POST',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(data) {
				window.location.href = `/key/${data}`
			}
		})
	})

})
