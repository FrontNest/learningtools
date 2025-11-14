

window.addEventListener('DOMContentLoaded', function() {
	var header = document.querySelector('.header');
	var mainContent = document.querySelector('.main-content');
	var frame01 = document.getElementById('docsFrame01');
	var frame02 = document.getElementById('docsFrame02');
	var toggleBtn = document.getElementById('toggleFrame01');

	function updateToggleBtnVisibility() {
		if (window.innerWidth <= 600) {
			if (toggleBtn) toggleBtn.style.display = 'inline-block';
		} else {
			if (toggleBtn) toggleBtn.style.display = 'none';
			document.body.classList.remove('show-frame01');
		}
	}

	if (header && mainContent) {
		var headerHeight = header.offsetHeight;
		var newHeight = 'calc(100vh - ' + headerHeight + 'px)';
		mainContent.style.height = newHeight;
		mainContent.style.maxHeight = newHeight;
		mainContent.style.overflowY = 'auto';
	}

	if (toggleBtn) {
		toggleBtn.addEventListener('click', function() {
			if (document.body.classList.contains('show-frame01')) {
				document.body.classList.remove('show-frame01');
			} else {
				document.body.classList.add('show-frame01');
			}
		});
	}
	
	// Add listeners for TK, MF, Jegyzet buttons to show navigation
	var tkBtn = document.getElementById('tkBtn');
	var mfBtn = document.getElementById('mfBtn');
	var nBtn = document.getElementById('nBtn');
	var aBtn = document.getElementById('aBtn');
	
	function toggleNavigation() {
		if (document.body.classList.contains('show-frame01')) {
			document.body.classList.remove('show-frame01');
		} else {
			document.body.classList.add('show-frame01');
		}
	}
	
	if (tkBtn) {
		tkBtn.addEventListener('click', toggleNavigation);
	}
	if (mfBtn) {
		mfBtn.addEventListener('click', toggleNavigation);
	}
	if (nBtn) {
		nBtn.addEventListener('click', toggleNavigation);
	}
	if (aBtn) {
		aBtn.addEventListener('click', toggleNavigation);
	}

	window.addEventListener('resize', updateToggleBtnVisibility);
	updateToggleBtnVisibility();
});


