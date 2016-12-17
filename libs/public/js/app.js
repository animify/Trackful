$(() => {
	$('.create').bind('click', function() {
		data = {name: $('#appname').val()}
		call('/create/key', 'POST', data)
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
