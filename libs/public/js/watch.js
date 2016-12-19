$(() => {

	cKey = "S1wyRur4x"

	hit = (cKey) => {
		data = {"key": cKey, "page": window.location.href}
		console.log('called hit');
		call('/endpoint/hits', 'POST', data)
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
		data = {"key": cKey, "tracker": $(this).attr('data-watch')}
		console.log(data);
		call('/endpoint/clicks', 'POST', data)
	})
})
