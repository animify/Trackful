$(() => {
	$('[data-watch]').bind('click', function() {
		console.log(this);
		data = {"key": 10, "tracker": $(this).attr('data-watch')}
		console.log(data);
		call('/test', 'POST', data)
	})

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
})
