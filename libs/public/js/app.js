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
	if ($('.graph .sparkline').highcharts != undefined) {
		const dataKey = {key: opt.key}
		const hitValues = []
		const hitCat = []
		const clickValues = []
		const clickCat = []
		let options = {
				chart: {
					type: 'areaspline',
					backgroundColor: null,
					style: {"fontFamily":"\"myriad-pro\", sans-serif","fontSize":"12px"},
					margin: [0,0,0,0],
					spacingLeft: 0
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
					lineWidth: 0,
					tickmarkPlacement: 'on',
					minPadding:0,
					maxPadding:0
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
					areaspline: {
						fillColor: "rgba(255,255,255,.3)",
						marker: {
							enabled: false,
							radius: 1,
							states: {
								hover: {
									enabled: false
								}
							}
						}
					}
				},
				series: [{
					color: "#fff"
				}],
				legend: {
					enabled: false
				},
				noData: {
					style: {"color": "#fff"},
					useHTML: true
				}
		}

		opt.hitOptions = JSON.parse(JSON.stringify(options))
		opt.clickOptions = JSON.parse(JSON.stringify(options))

		updateDataHits = () => {
			call('/endpoint/data/hits', 'GET', dataKey, (res) => {
				if (res) {
					let l = ''

					for (val in res) {
						l = Object.keys(res[val])[0]
						let m = moment(Object.keys(res[val])[0] * 1000)
						let s = m.format("M/D/YYYY H:mm")
						hitCat.push(s)
						hitValues.push(Object.values(res[val])[0])
					}

					opt.hitLast = Object.values(res[res.length - 1])[0]

					let xMin = .5
					let xMax = (hitCat.length - 1.5)
					opt.hitOptions.xAxis.min = xMin
					opt.hitOptions.xAxis.max = xMax
					opt.hitOptions.xAxis.categories = hitCat
					opt.hitOptions.series[0].name = 'Page hits'
					opt.hitOptions.series[0].data = hitValues
					opt.hitOptions.chart.renderTo = 'chart_h'
					opt.hitChart = new Highcharts.Chart(opt.hitOptions)
					opt.lastTime = l
					updateTimes()
					updateIncreases(true, false)
				}
			})
		}

		updateDataClicks = () => {
			call('/endpoint/data/clicks', 'GET', dataKey, (res) => {
				if(res) {
					let l = ''

					for (val in res) {
						l = Object.keys(res[val])[0]
						let m = moment(l * 1000)
						let s = m.format("M/D/YYYY H:mm")
						clickCat.push(s)
						clickValues.push(Object.values(res[val])[0])
					}

					opt.clickLast = Object.values(res[res.length - 1])[0]

					let xMin = .5
					let xMax = (clickCat.length - 1.5)
					opt.clickOptions.xAxis.min = xMin
					opt.clickOptions.xAxis.max = xMax
					opt.clickOptions.xAxis.categories = clickCat
					opt.clickOptions.series[0].name = 'Clicks'
					opt.clickOptions.series[0].data = clickValues
					opt.clickOptions.chart.renderTo = 'chart_c'
					opt.clickChart = new Highcharts.Chart(opt.clickOptions)
					opt.lastTime = l
					updateTimes()
					updateIncreases(false, true)
				}
			})
		}

		updateTimes = () => {
			$('.graph_clicks span .updated, .graph_hits span .updated').text(`Last updated ${moment(opt.lastTime * 1000).fromNow()}`)
		}

		updateCharts = (r) => {
			if (opt.clickChart || opt.hitChart) {
				epoch = moment(r.xAxis * 1000).format("M/D/YYYY H:mm")
				opt.clickChart.destroy()

				if (opt.clickOptions.series[0].data.length > 19) {
					opt.clickOptions.xAxis.categories.shift()
					opt.clickOptions.series[0].data.shift()
				}

				opt.clickOptions.xAxis.categories.push(epoch)
				opt.clickLast = r.yClicks
				opt.clickOptions.series[0].data.push(r.yClicks)
				opt.clickOptions.xAxis.max = opt.clickOptions.series[0].data.length - 1.5
				opt.clickChart = new Highcharts.Chart(opt.clickOptions)

				opt.hitChart.destroy()
				if (opt.clickOptions.series[0].data.length > 19) {
					opt.hitOptions.xAxis.categories.shift()
					opt.hitOptions.series[0].data.shift()
				}
				opt.hitOptions.xAxis.categories.push(epoch)
				opt.hitLast = r.yHits
				opt.hitOptions.series[0].data.push(r.yHits)
				opt.hitOptions.xAxis.max = opt.hitOptions.series[0].data.length - 1.5
				opt.hitChart = new Highcharts.Chart(opt.hitOptions)

				opt.lastTime = r.xAxis

				updateTimes()
				updateIncreases(true, true)
			}
		}
	}

	if (typeof io == 'function') {
		let socket = io(opt.trackR)
		socket.on('change', function(r) {
			switch (r.type) {
				case "click":
					updateClickTrackers(r.change)
					break
				case "hit":
					updateHitTrackers(r.change)
					break
			}
			if ($('#empty').is(":visible")) {
				$('#empty').slideUp('fast')
				$('#clicks').parent().slideDown('fast', () => {
					updateDataClicks()
				})
				$('#hits').parent().slideDown('fast', () => {
					updateDataHits()
				})
			}

		})
		.on('updated', function(r) {
			updateCharts(r)
		})
		.on('connect', function() {
			$('.signal span').addClass('connected')
		})
		.on('disconnect', function() {
			$('.signal span').removeClass('connected')
		})

		updateIncreases = (h, c) => {
			if (h) {
				opt.hitIncrease = parseInt(((opt.hitTotal - opt.hitLast) * 100) / opt.hitLast)
				$('.graph_hits .prc').text(isNaN(opt.hitIncrease) ? '0' : opt.hitIncrease)
			}

			if (c) {
				opt.clickIncrease = parseInt(((opt.clickTotal - opt.clickLast) * 100) / opt.clickLast)
				$('.graph_clicks .prc').text(isNaN(opt.clickIncrease) ? '0' : opt.clickIncrease)
			}
		}

		updateClickTrackers = (trackers) => {
			const trackerName = trackers[0]
			const trackerCount = trackers[1]

			$(`[data-click="${trackerName}"]`).length ? $(`[data-click="${trackerName}"]`).html(`${trackerName} <span>${trackerCount}</span>`) : $('#clicks').append(`<li data-click="${trackerName}">${trackerName} <span>${trackerCount}</span></li>`)

			opt.clickTotal = parseInt(opt.clickTotal + 1)
			$('.graph_clicks h2').text(opt.clickTotal)

			updateIncreases(false, true)

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

			updateIncreases(true, false)

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

	$('.d_key').bind('click', function() {
		data = {key: opt.key}
		call('/endpoint/key/delete', 'POST', JSON.stringify(data), (res) => {
			if (res) {
				window.location.href = '/keys/all'
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

	$('[data-modal]').bind('click', function() {
		$('.confirm').attr('class', 'confirm')
		$('.cancel').attr('class', 'cancel')
		$('.modal').fadeToggle('fast')
		$('.modal .box').slideToggle('fast')

		let type = $(this).attr('data-type')
		if (type="delete") {
			$('.confirm').toggleClass('d_key')
			$('.box h5').html(`Are you sure you want to delete ${opt.keyName}?`)
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

	initialise = () => {
		if ($('.graph .sparkline').highcharts != undefined) {
			updateDataHits()
			updateDataClicks()
			setInterval(updateTimes, 60000);
		}
	}

	initialise()
})
