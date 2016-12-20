$(() => {
	call = (url, type, data, callback) => {
		$.ajax({
			url: url,
			type: type,
			data: data,
			contentType: 'application/json',
			success: function(data) {
				callback(data)
			}
		})
	}

	if (typeof io == 'function') {
		const socket = io(opt.trackR)
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

			$(`[data-click="${trackerName}"]`).length ? $(`[data-click="${trackerName}"]`).html(`${trackerName} <span>${trackerCount}</span>`) : $('#clicks').append(`<li data-click="${trackerName}">${trackerName} <span>${trackerCount}</span></li>`)

			opt.clickTotal = parseInt(opt.clickTotal + 1)
			$('.graph_clicks h2').text(opt.clickTotal)

			$(`[data-click="${trackerName}"]`).addClass("flash").delay(1000).queue(function(){
				$(this).removeClass("flash").dequeue()
			})
		}

		updateHitTrackers = (trackers) => {
			const trackerName = trackers[0]
			const trackerCount = trackers[1]

			$(`[data-hit="${trackerName}"]`).length ? $(`[data-hit="${trackerName}"]`).html(`${trackerName} <span>${trackerCount}</span>`).addClass('flash').delay(1000).removeClass('flash') : $('#hits').append(`<li data-hit="${trackerName}">${trackerName} <span>${trackerCount}</span></li>`)

			opt.hitTotal = parseInt(opt.hitTotal + 1)
			$('.graph_hits h2').text(opt.hitTotal)

			$(`[data-hit="${trackerName}"]`).addClass("flash").delay(1000).queue(function(){
				$(this).removeClass("flash").dequeue()
			})
		}
	}

	if ($('.graph .sparkline').highcharts != undefined) {
		const data = {"key": opt.key}
		const hitValues = []
		const clickValues = []
		const options = {
				chart: {
					type: 'spline',
					backgroundColor: null,
					style: {"fontFamily":"\"myriad-pro\", sans-serif","fontSize":"12px"}
				},
				title : {
						text: null
				},
				credits: {
					enabled: false
				},
				xAxis: {
					title: {
							enabled: false
					},
					labels: {
							enabled: false
					},
					tickLength: 0,
					gridLineWidth: 0,
					minorGridLineWidth: 0,
					lineWidth: 0
				},
				yAxis: {
					title: {
							enabled: false
					},
					labels: {
							enabled: false
					},
					gridLineWidth: 0,
					minorGridLineWidth: 0,
					TickLength: 0
				},
				tooltip: {
					enabled: true
				},
				plotOptions: {
					spline: {
						marker: {
							enabled: false,
							radius: 1,
							states: {
								hover: {
									radius: 2,
									radiusPlus: 1
								}
							}
						}
					}
				},
				series: [{
					color: '#fff'
				}],
				legend: {
					enabled: false
				},
				noData: {
					style: {"color": "#fff"},
					useHTML: true
				}
		}
		call('/endpoint/data/hits', 'GET', data, (res) => {
			for (val in res) {
				hitValues.push(Object.values(res[val])[0])
			}
			options.series[0].name = 'Page hits'
			options.series[0].data = hitValues
			$('.graph_hits .sparkline').highcharts(options);
		})

		call('/endpoint/data/clicks', 'GET', data, (res) => {

			for (val in res) {
				clickValues.push(Object.values(res[val])[0])
			}

			options.series[0].name = 'Clicks'
			options.series[0].data = clickValues
			$('.graph_clicks .sparkline').highcharts(options)
		})

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
