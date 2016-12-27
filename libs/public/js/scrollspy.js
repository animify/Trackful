let lastId = null
const docMenu = $("#doc-menu")
const docMenuHeight = docMenu.outerHeight() + 15

const menuItems = docMenu.find("a")

const scrollItems = menuItems.map(function(){
	let item = $($(this).attr("href"))
	if (item.length) { return item }
})

menuItems.click(function(e){
	const href = $(this).attr("href")
	const offsetTop = href === "#" ? 0 : $(href).offset().top - 1
	$('html, body').stop().animate({
		scrollTop: offsetTop
	}, 300)
	e.preventDefault()
})

$(window).scroll(function(){
	var fromTop = $(this).scrollTop()

	let cur = scrollItems.map(function(){
		if ($(this).offset().top < fromTop + 85) return this
	})

	cur = cur[cur.length-1]
	const id = cur && cur.length ? cur[0].id : ""

	if (lastId !== id) {
		lastId = id
		menuItems.parent().removeClass("active").end().filter("[href='#"+id+"']").parent().addClass("active")
	 }
})
