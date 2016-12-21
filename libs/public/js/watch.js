$(() => {

	cKey = "SJxexNuNl"

	hit = (cKey) => {
		data = {"key": cKey, "page": window.location.href}
		console.log('called hit');
		callAJAX('/endpoint/hits', 'POST', data)
	}

	callAJAX = (url, type, data) => {
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
		data = {"key": cKey, "tracker": $(this).attr('data-watch')}
		console.log(data);
		callAJAX('/endpoint/clicks', 'POST', data)
	})
})
