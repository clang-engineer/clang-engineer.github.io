(function() {
	var content = document.querySelector('article.post');
	content.innerHTML = content.innerHTML.replace(/\[\[(.+?)\]\]\{(.+?)\}/g, '<a href="../$1">$2</a>');
	content.innerHTML = content.innerHTML.replace(/\[\[(.+?)\]\]/g, '<a href="../$1">$1</a>');
})();
