// Betöltési overlay elrejtése
        function hideLoading(loadingId) {
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                setTimeout(() => {
                    loadingElement.style.opacity = '0';
                    setTimeout(() => {
                        loadingElement.style.display = 'none';
                    }, 300);
                }, 500);
            }
        }

        // Hiba üzenet megjelenítése
        function showError(errorId) {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.style.display = 'block';
            }
        }

        // Iframe frissítése
        function refreshFrame(frameId) {
            const frame = document.getElementById(frameId);
            if (frame) {
                const src = frame.src;
                frame.src = '';
                // Loading overlay megjelenítése
                let loadingId = '';
                if (frameId.startsWith('docs-frame')) {
                    loadingId = frameId.replace('docs-frame', 'docs-loading');
                } else if (frameId.startsWith('drive-frame')) {
                    loadingId = frameId.replace('drive-frame', 'drive-loading');
                }
                const loadingElement = document.getElementById(loadingId);
                if (loadingElement) {
                    loadingElement.style.display = 'flex';
                    loadingElement.style.opacity = '1';
                }
                setTimeout(() => {
                    frame.src = src;
                }, 100);
            }
        }

        // Automatikus betöltési timeout
        setTimeout(() => {
            const loadingElements = document.querySelectorAll('.loading-overlay');
            loadingElements.forEach(element => {
                if (element.style.display !== 'none') {
                    element.style.display = 'none';
                    // Hiba üzenet megjelenítése, ha a betöltés túl sokáig tart
                    const frameId = element.id.includes('docs') ? 'docs-error' : 'drive-error';
                    showError(frameId);
                }
            });
        }, 15000); // 15 másodperc timeout

        // Responsive iframe magasság beállítása
        function adjustIframeHeight() {
            const iframes = document.querySelectorAll('.iframe-container');
            const viewportHeight = window.innerHeight;
            
            if (viewportHeight < 600) {
                iframes.forEach(container => {
                    container.style.height = '400px';
                });
            } else if (viewportHeight < 800) {
                iframes.forEach(container => {
                    container.style.height = '500px';
                });
            } else {
                iframes.forEach(container => {
                    container.style.height = '600px';
                });
            }
        }

        // Ablak átméretezésére reagálás
        window.addEventListener('resize', adjustIframeHeight);
        window.addEventListener('load', adjustIframeHeight);

        // Portrait orientation warning
        function handleOrientationChange() {
            const warningElement = document.querySelector('.portrait-warning');
            if (window.matchMedia('(orientation: portrait)').matches) {
                warningElement.style.display = 'flex';
            } else {
                warningElement.style.display = 'none';
            }
        }


        		// Flex switcher gomb működése
		const switcherBtn = document.getElementById('flex-switcher');
		const switcherIcon = document.getElementById('flex-switcher-icon');
		let flexIsRow = true;
		switcherBtn.addEventListener('click', function() {
			document.querySelectorAll('.iframe-row').forEach(row => {
				if (flexIsRow) {
					row.style.flexDirection = 'column';
				} else {
					row.style.flexDirection = 'row';
				}
			});
			flexIsRow = !flexIsRow;
			switcherIcon.textContent = flexIsRow ? '🔀' : '↕️';
		});

        // Add event listener for orientation changes
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('load', handleOrientationChange);

        // Kezdeti beállítás
        adjustIframeHeight();

        // Konzol üzenet
        console.log('📚 Google Dokumentumok Megjelenítő betöltve');
        console.log('🔗 Docs link: https://docs.google.com/document/d/1x6brP_3EOoj85gPqCmhnlI4VYzOp5uhXqanKUydOQXE/preview');
        console.log('� PDF link: ../tankonyvek/TERMÉSZETTUDOMÁNY_TK_OH-TER06TA__teljes.pdf');
