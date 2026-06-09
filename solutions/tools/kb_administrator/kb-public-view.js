(() => {
	const STYLE_PRESETS = {
		normal: { label: "Alap", className: "doc-normal" },
		note: { label: "Megjegyzés", className: "doc-note" },
		focus: { label: "Kiemelt", className: "doc-focus" },
		compact: { label: "Kompakt", className: "doc-compact" },
	};

	const dataNode = document.getElementById("kbExportData");
	const bookmarksFrame = document.getElementById("kbExportBookmarksFrame");
	const contentFrame = document.getElementById("kbExportContentFrame");

	if (!dataNode || !bookmarksFrame || !contentFrame) {
		return;
	}

	const safeText = (value) =>
		String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#039;");

	const state = {
		bookmarks: [],
		selectedId: null,
	};

	const parseData = () => {
		try {
			const payload = JSON.parse(dataNode.textContent || "{}");
			const incoming = Array.isArray(payload.bookmarks) ? payload.bookmarks : [];
			state.bookmarks = incoming
				.map((item) => ({
					id: String(item?.id || crypto.randomUUID()),
					title: String(item?.title || "Névtelen"),
					content: String(item?.content || ""),
					style: STYLE_PRESETS[item?.style] ? item.style : "normal",
					updatedAt: Number(item?.updatedAt) || Date.now(),
				}))
				.sort((a, b) => b.updatedAt - a.updatedAt);

			state.selectedId = state.bookmarks.some((item) => item.id === payload.selectedId)
				? payload.selectedId
				: state.bookmarks[0]?.id || null;
		} catch {
			state.bookmarks = [];
			state.selectedId = null;
		}
	};

	const getSelected = () => state.bookmarks.find((item) => item.id === state.selectedId) || null;

	const paragraphs = (text) => {
		const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
		if (!normalized) {
			return "<p>Üres tartalom.</p>";
		}
		return normalized
			.split(/\n\s*\n/g)
			.filter(Boolean)
			.map((block) => `<p>${safeText(block).replace(/\n/g, "<br>")}</p>`)
			.join("\n");
	};

	const renderBookmarksFrame = () => {
		const selected = getSelected();
		const listItems = state.bookmarks
			.map((bookmark) => {
				const isActive = bookmark.id === state.selectedId ? "active" : "";
				return `<li><button class="kb-export-link ${isActive}" type="button" data-id="${safeText(bookmark.id)}">${safeText(bookmark.title)}</button></li>`;
			})
			.join("\n");

		const info = selected
			? `<ul>
				<li>Aktív: <strong>${safeText(selected.title)}</strong></li>
				<li>Stílus: ${safeText(STYLE_PRESETS[selected.style].label)}</li>
				<li>Karakterek: ${selected.content.length}</li>
			</ul>`
			: "<ul><li>Nincs kiválasztott bookmark.</li></ul>";

		bookmarksFrame.srcdoc = `<!doctype html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bookmarkok</title>
  <link rel="stylesheet" href="./kb-public.css">
</head>
<body class="bookmarks-doc">
  <section class="group">
    <h2>Bookmarkok</h2>
    <ol>${listItems || "<li>Nincs elérhető bookmark.</li>"}</ol>
  </section>
  <section class="group">
    <h2>Aktív info</h2>
    ${info}
  </section>
</body>
</html>`;

		bookmarksFrame.addEventListener(
			"load",
			() => {
				const doc = bookmarksFrame.contentDocument;
				if (!doc) return;
				doc.body.addEventListener("click", (event) => {
					const target = event.target;
					if (!(target instanceof HTMLElement)) return;
					const button = target.closest("[data-id]");
					if (!(button instanceof HTMLElement)) return;
					const nextId = button.getAttribute("data-id");
					if (!nextId) return;
					state.selectedId = nextId;
					renderAll();
				});
			},
			{ once: true }
		);
	};

	const renderContentFrame = () => {
		const selected = getSelected();
		if (!selected) {
			contentFrame.srcdoc = `<!doctype html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fő tartalom</title>
  <link rel="stylesheet" href="./kb-public.css">
</head>
<body class="content-doc">
  <article class="doc-shell doc-normal">
    <h2>Fő tartalom</h2>
    <div class="doc-body"><p>Nincs kiválasztott bookmark.</p></div>
  </article>
</body>
</html>`;
			return;
		}

		const styleLabel = STYLE_PRESETS[selected.style].label;
		const styleClass = STYLE_PRESETS[selected.style].className;
		const updated = new Date(selected.updatedAt).toLocaleString("hu-HU");

		contentFrame.srcdoc = `<!doctype html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeText(selected.title)}</title>
  <link rel="stylesheet" href="./kb-public.css">
</head>
<body class="content-doc">
  <article class="doc-shell ${styleClass}">
    <div class="doc-meta">
      <span class="badge">Knowledgebase export</span>
      <span class="badge">Stílus: ${safeText(styleLabel)}</span>
      <span class="badge">Frissítve: ${safeText(updated)}</span>
    </div>
    <h2>${safeText(selected.title)}</h2>
    <div class="doc-body">${paragraphs(selected.content)}</div>
  </article>
</body>
</html>`;
	};

	const renderAll = () => {
		renderBookmarksFrame();
		renderContentFrame();
	};

	parseData();
	renderAll();
})();
