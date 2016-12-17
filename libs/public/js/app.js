$(() => {
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
