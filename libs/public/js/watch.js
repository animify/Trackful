$(() => {

	cKey = "S1-o5f4Vx"

	hit = (cKey) => {
		data = {"key": cKey, "page": window.location.href}
		console.log('called hit');
		call('/test/hit', 'POST', data)
	}

	call = (url, type, data) => {
		$.ajax({
			url: url,
			type: type,
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(data) {
				console.log(data)
			}
		})
	}

	hit(cKey)

	$('[data-watch]').bind('click', function() {
		console.log(this);
		data = {"key": cKey, "tracker": $(this).attr('data-watch')}
		console.log(data);
		call('/test', 'POST', data)
	})
})
