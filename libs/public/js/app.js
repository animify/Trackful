$(() => {
	if (typeof io == 'function') {
		const socket = io(trackR)
		socket.on('change', function(r) {
			switch (r.type) {
				case "click":
					updateClickTrackers(r.change)
					break
				case "hit":
					updateHitTrackers(r.change)
					break
				default:
					console.log('no type');
			}
		})
		.on('connect', function() {
			console.log('connected to socketio')
		})
		.on('disconnect', function() {
			console.error('disconnected from socketio, attempting to reconnect')
			setTimeout(function () {
				io.connect(null, {force:true})
			}, 5000);
		})


		updateClickTrackers = (trackers) => {
			const trackerName = trackers[0]
			const trackerCount = trackers[1]

			console.log(trackers);
			$(`[data-click="${trackerName}"]`).length ? $(`[data-click="${trackerName}"]`).html(`${trackerName} <span>${trackerCount}</span>`) : $('#clicks').append(`<li data-click="${trackerName}">${trackerName} <span>${trackerCount}</span></li>`)

			$(`[data-click="${trackerName}"]`).addClass("flash").delay(1000).queue(function(){
				$(this).removeClass("flash").dequeue()
			})
		}

		updateHitTrackers = (trackers) => {
			const trackerName = trackers[0]
			const trackerCount = trackers[1]

			$(`[data-hit="${trackerName}"]`).length ? $(`[data-hit="${trackerName}"]`).html(`${trackerName} <span>${trackerCount}</span>`).addClass('flash').delay(1000).removeClass('flash') : $('#hits').append(`<li data-hit="${trackerName}">${trackerName} <span>${trackerCount}</span></li>`)

			$(`[data-hit="${trackerName}"]`).addClass("flash").delay(1000).queue(function(){
				$(this).removeClass("flash").dequeue()
			})
		}
	}

	$('.create').bind('click', function() {
		data = {name: $('#appname').val(), domain: $('#domain').val()}
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

	$('.search').bind('click', function() {
		_this = $(this)
		if (!_this.hasClass('open')) {
			_width = _this.css("width")
			_this.animate({
				width: 200
			}, 200, () => {
				_this.addClass('open')
				_this.find('.filter').removeClass('hidden').focus()
			})
		} else if (_this.find('.filter').is(":empty")){
			_this.removeClass('open')
			_this.find('.filter').addClass('hidden')
			_this.animate({
				width: _width
			}, 200)
		}
	})

	$('.filter').on('input', function () {
		let filterVal = $(this).text()
		$(this).closest('ul').find('li').removeClass("last_li")
		$(this).closest('ul').find('li').each(function() {
			if ($(this).text().indexOf(filterVal) > -1) {
				$(this).stop().slideDown('fast')
			}
			else {
				$(this).stop().slideUp('fast')
			}
		})
	})
})
