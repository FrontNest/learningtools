(() => {
	const STORAGE_KEY = "kbAdministratorBookmarksV1";
	const PUBLIC_CSS_FILE = "kb-public.css";
	const PUBLIC_VIEW_JS_FILE = "kb-public-view.js";

	const STYLE_PRESETS = {
		normal: { label: "Alap", className: "doc-normal" },
		note: { label: "Megjegyzés", className: "doc-note" },
		focus: { label: "Kiemelt", className: "doc-focus" },
		compact: { label: "Kompakt", className: "doc-compact" },
	};

	const bookmarksFrame = document.getElementById("bookmarksFrame");
	const mainContentFrame = document.getElementById("mainContentFrame");

	if (!bookmarksFrame || !mainContentFrame) {
		return;
	}

	const state = {
		bookmarks: [],
		selectedId: null,
		pendingImportMode: "merge",
		statusMessage: "Készen áll a szerkesztésre.",
		statusAt: Date.now(),
	};

	const escapeHtml = (value) =>
		String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#039;");

	const getSafeFileName = (value) => {
		const cleaned = String(value || "knowledgebase")
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9\-\s_]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-");

		return cleaned || "knowledgebase";
	};

	const formatStatusTime = (timestamp) =>
		new Date(timestamp).toLocaleTimeString("hu-HU", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});

	const getTitleKey = (value) => String(value || "").trim().toLocaleLowerCase("hu-HU");

	const serializeState = () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookmarks));
	};

	const normalizeBookmarkArray = (items) => {
		if (!Array.isArray(items)) {
			return [];
		}

		return items
			.map((item) => ({
				id: typeof item?.id === "string" && item.id.trim() ? item.id : crypto.randomUUID(),
				title: String(item?.title || "Névtelen").slice(0, 120),
				content: String(item?.content || ""),
				style: STYLE_PRESETS[item?.style] ? item.style : "normal",
				updatedAt: Number(item?.updatedAt) || Date.now(),
			}))
			.filter((item) => item.title.trim().length > 0)
			.sort((a, b) => b.updatedAt - a.updatedAt);
	};

	const createDefaultBookmarks = () => [
		{
			id: crypto.randomUUID(),
			title: "Bevezetés",
			content:
				"Ez egy minta tartalom. A bal oldalon tudsz új bookmarkot létrehozni és szerkeszteni.\n\nVálassz stílust, majd mentsd el.",
			style: "normal",
			updatedAt: Date.now(),
		},
		{
			id: crypto.randomUUID(),
			title: "Kiemelt megjegyzés",
			content:
				"Ezt a blokkot 'Kiemelt' stílussal látod.\n\nA későbbiekben ide kerülhetnek fontos figyelmeztetések vagy tanulási tippek.",
			style: "focus",
			updatedAt: Date.now(),
		},
	];

	const getBookmarksDoc = () => bookmarksFrame.contentDocument;
	const getMainDoc = () => mainContentFrame.contentDocument;

	const getSelectedBookmark = () => state.bookmarks.find((item) => item.id === state.selectedId) || null;

	const setStatus = (message) => {
		state.statusMessage = String(message || "").trim() || "Készen áll.";
		state.statusAt = Date.now();
		renderStatus();
	};

	const renderStatus = () => {
		const doc = getBookmarksDoc();
		if (!doc) return;
		const messageNode = doc.getElementById("statusMessage");
		const timeNode = doc.getElementById("statusTime");
		if (messageNode) messageNode.textContent = state.statusMessage;
		if (timeNode) timeNode.textContent = formatStatusTime(state.statusAt);
	};

	const loadState = () => {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			state.bookmarks = createDefaultBookmarks();
			state.selectedId = state.bookmarks[0]?.id || null;
			serializeState();
			return;
		}

		try {
			const parsed = JSON.parse(raw);
			state.bookmarks = normalizeBookmarkArray(parsed);
			if (!state.bookmarks.length) {
				state.bookmarks = createDefaultBookmarks();
			}
			state.selectedId = state.bookmarks[0]?.id || null;
		} catch {
			state.bookmarks = createDefaultBookmarks();
			state.selectedId = state.bookmarks[0]?.id || null;
			serializeState();
		}
	};

	const renderStyleOptions = () => {
		const doc = getBookmarksDoc();
		if (!doc) return;
		const select = doc.getElementById("bookmarkStyle");
		if (!(select instanceof HTMLSelectElement)) return;

		select.innerHTML = "";
		Object.entries(STYLE_PRESETS).forEach(([key, preset]) => {
			const option = doc.createElement("option");
			option.value = key;
			option.textContent = preset.label;
			select.append(option);
		});
	};

	const renderBookmarksList = () => {
		const doc = getBookmarksDoc();
		if (!doc) return;

		const list = doc.getElementById("bookmarksOrderedList");
		if (!(list instanceof HTMLOListElement)) return;
		list.innerHTML = "";

		if (!state.bookmarks.length) {
			const item = doc.createElement("li");
			item.textContent = "Nincs még mentett bookmark.";
			list.append(item);
			return;
		}

		state.bookmarks.forEach((bookmark) => {
			const item = doc.createElement("li");
			const button = doc.createElement("button");
			button.type = "button";
			button.className = `bookmark-btn ${bookmark.id === state.selectedId ? "active" : ""}`.trim();
			button.dataset.action = "select";
			button.dataset.id = bookmark.id;
			button.textContent = bookmark.title;
			item.append(button);
			list.append(item);
		});
	};

	const renderActiveInfo = () => {
		const doc = getBookmarksDoc();
		if (!doc) return;
		const info = doc.getElementById("activeInfoList");
		if (!(info instanceof HTMLUListElement)) return;
		info.innerHTML = "";

		const selected = getSelectedBookmark();
		if (!selected) {
			const item = doc.createElement("li");
			item.textContent = "Nincs kiválasztott bookmark.";
			info.append(item);
			return;
		}

		const item1 = doc.createElement("li");
		item1.innerHTML = `Aktív: <strong>${escapeHtml(selected.title)}</strong>`;
		const item2 = doc.createElement("li");
		item2.textContent = `Stílus: ${STYLE_PRESETS[selected.style].label}`;
		const item3 = doc.createElement("li");
		item3.textContent = `Karakterek: ${selected.content.length}`;

		info.append(item1, item2, item3);
	};

	const fillEditorFromSelected = () => {
		const doc = getBookmarksDoc();
		const selected = getSelectedBookmark();
		if (!doc || !selected) return;

		const title = doc.getElementById("bookmarkTitle");
		const style = doc.getElementById("bookmarkStyle");
		const content = doc.getElementById("bookmarkContent");

		if (title instanceof HTMLInputElement) title.value = selected.title;
		if (style instanceof HTMLSelectElement) style.value = selected.style;
		if (content instanceof HTMLTextAreaElement) content.value = selected.content;
	};

	const clearEditor = () => {
		const doc = getBookmarksDoc();
		if (!doc) return;
		const title = doc.getElementById("bookmarkTitle");
		const style = doc.getElementById("bookmarkStyle");
		const content = doc.getElementById("bookmarkContent");
		if (title instanceof HTMLInputElement) title.value = "";
		if (style instanceof HTMLSelectElement) style.value = "normal";
		if (content instanceof HTMLTextAreaElement) content.value = "";
	};

	const getEditorValues = () => {
		const doc = getBookmarksDoc();
		if (!doc) return null;
		const title = doc.getElementById("bookmarkTitle");
		const style = doc.getElementById("bookmarkStyle");
		const content = doc.getElementById("bookmarkContent");

		if (!(title instanceof HTMLInputElement)) return null;
		if (!(style instanceof HTMLSelectElement)) return null;
		if (!(content instanceof HTMLTextAreaElement)) return null;

		return {
			title: title.value.trim(),
			style: STYLE_PRESETS[style.value] ? style.value : "normal",
			content: content.value,
		};
	};

	const renderMainContent = () => {
		const doc = getMainDoc();
		if (!doc) return;

		const selected = getSelectedBookmark();
		const shell = doc.getElementById("docShell");
		const title = doc.getElementById("docTitle");
		const body = doc.getElementById("docBody");
		const styleBadge = doc.getElementById("docStyleBadge");
		const updatedBadge = doc.getElementById("docUpdatedBadge");

		if (!shell || !title || !body || !styleBadge || !updatedBadge) return;

		if (!selected) {
			shell.className = "doc-shell doc-normal";
			title.textContent = "Fő tartalom";
			styleBadge.textContent = "Stílus: Alap";
			updatedBadge.textContent = "Frissítve: -";
			body.innerHTML = "";
			const p = doc.createElement("p");
			p.textContent = "Nincs kiválasztott bookmark.";
			body.append(p);
			return;
		}

		shell.className = `doc-shell ${STYLE_PRESETS[selected.style].className}`;
		title.textContent = selected.title;
		styleBadge.textContent = `Stílus: ${STYLE_PRESETS[selected.style].label}`;
		updatedBadge.textContent = `Frissítve: ${new Date(selected.updatedAt).toLocaleString("hu-HU")}`;
		body.innerHTML = "";

		const normalized = String(selected.content || "").replace(/\r\n/g, "\n").trim();
		if (!normalized) {
			const empty = doc.createElement("p");
			empty.textContent = "Üres tartalom. Adj meg szöveget a bal oldali szerkesztőben.";
			body.append(empty);
			return;
		}

		normalized.split(/\n\s*\n/g).forEach((block) => {
			const p = doc.createElement("p");
			const lines = block.split("\n");
			lines.forEach((line, index) => {
				p.append(doc.createTextNode(line));
				if (index < lines.length - 1) p.append(doc.createElement("br"));
			});
			body.append(p);
		});
	};

	const rerender = ({ keepEditorValues = false } = {}) => {
		const values = keepEditorValues ? getEditorValues() : null;
		renderStyleOptions();
		renderBookmarksList();
		renderActiveInfo();
		renderMainContent();
		renderStatus();

		if (values) {
			const doc = getBookmarksDoc();
			if (doc) {
				const title = doc.getElementById("bookmarkTitle");
				const style = doc.getElementById("bookmarkStyle");
				const content = doc.getElementById("bookmarkContent");
				if (title instanceof HTMLInputElement) title.value = values.title;
				if (style instanceof HTMLSelectElement) style.value = values.style;
				if (content instanceof HTMLTextAreaElement) content.value = values.content;
			}
		} else {
			fillEditorFromSelected();
		}
	};

	const mergeBookmarks = (existingBookmarks, incomingBookmarks) => {
		const merged = [...existingBookmarks];
		const idIndex = new Map();
		const titleIndex = new Map();

		merged.forEach((bookmark, index) => {
			idIndex.set(bookmark.id, index);
			titleIndex.set(getTitleKey(bookmark.title), index);
		});

		let added = 0;
		let updated = 0;

		incomingBookmarks.forEach((incoming) => {
			const exactIdIndex = idIndex.get(incoming.id);
			const sameTitleIndex = titleIndex.get(getTitleKey(incoming.title));

			if (typeof exactIdIndex === "number") {
				const current = merged[exactIdIndex];
				merged[exactIdIndex] = {
					...current,
					title: incoming.title,
					content: incoming.content,
					style: incoming.style,
					updatedAt: Math.max(current.updatedAt || 0, incoming.updatedAt || 0),
				};
				updated += 1;
				return;
			}

			if (typeof sameTitleIndex === "number") {
				const current = merged[sameTitleIndex];
				merged[sameTitleIndex] = {
					...current,
					content: incoming.content,
					style: incoming.style,
					updatedAt: Math.max(current.updatedAt || 0, incoming.updatedAt || 0),
				};
				updated += 1;
				return;
			}

			const newBookmark = { ...incoming, id: idIndex.has(incoming.id) ? crypto.randomUUID() : incoming.id };
			const newIndex = merged.push(newBookmark) - 1;
			idIndex.set(newBookmark.id, newIndex);
			titleIndex.set(getTitleKey(newBookmark.title), newIndex);
			added += 1;
		});

		merged.sort((a, b) => b.updatedAt - a.updatedAt);
		return { merged, added, updated };
	};

	const createPublicHtml = (bookmarks, selectedId) => {
		const payload = JSON.stringify({ bookmarks, selectedId }).replace(/<\//g, "<\\/");
		return `<!doctype html>
<html lang="hu">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Knowledgebase dokumentum export">
	<title>Knowledgebase</title>
	<link rel="stylesheet" href="./${PUBLIC_CSS_FILE}">
	<script src="./${PUBLIC_VIEW_JS_FILE}" defer></script>
</head>
<body class="kb-export-body">
	<header class="kb-export-header">
		<h1>Knowledgebase</h1>
	</header>
	<main class="kb-export-layout" aria-label="Publikus tudásbázis elrendezés">
		<section class="kb-export-panel kb-export-bookmarks" aria-label="Bookmarkok">
			<iframe id="kbExportBookmarksFrame" title="Bookmarkok" loading="lazy"></iframe>
		</section>
		<section class="kb-export-panel kb-export-content" aria-label="Tartalom">
			<iframe id="kbExportContentFrame" title="Fő tartalom" loading="lazy"></iframe>
		</section>
	</main>
	<script id="kbExportData" type="application/json">${payload}</script>
</body>
</html>`;
	};

	const downloadTextFile = (fileName, text, mimeType) => {
		const blob = new Blob([text], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 10000);
	};

	const createPublicCssBundle = () => `:root {
	--bg: #fff7ef;
	--surface: #f3dfcb;
	--ink: #3f281b;
	--accent: #b2692f;
	--focus-bg: #ffe9cc;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body { font-family: "Segoe UI", "Inter", system-ui, sans-serif; background: linear-gradient(160deg, #f4e4d2, #ebccad); color: var(--ink); padding: 1rem; }
.kb-export-body { min-height: 100dvh; }
.kb-export-header { text-align: center; padding: clamp(.85rem,2.4vw,1.5rem) clamp(1rem,2.8vw,2rem) clamp(.55rem,1.8vw,1rem); }
.kb-export-header h1 { margin: 0; font-size: clamp(1.5rem,3.8vw,2.35rem); color: #7b4621; }
.kb-export-layout { width: min(1300px, calc(100% - clamp(1rem, 3vw, 2.5rem))); margin: 0 auto; display: flex; gap: clamp(.65rem,1.6vw,1.1rem); }
.kb-export-panel { background: linear-gradient(180deg,#fff8f0,#f2dfcc); border: 1px solid rgba(139,74,29,.2); border-radius: 1rem; box-shadow: 0 8px 24px rgba(76,44,20,.14); padding: .55rem; }
.kb-export-bookmarks { flex: 0 0 20%; max-width: 20%; min-width: 14rem; }
.kb-export-content { flex: 1 1 auto; min-width: 0; }
.kb-export-panel iframe { width: 100%; min-height: clamp(24rem,72vh,56rem); border: 1px solid rgba(139,74,29,.24); border-radius: .8rem; background: #fff8f1; }
.doc-shell { background: linear-gradient(180deg,var(--bg),var(--surface)); border: 1px solid rgba(130,74,38,.25); border-radius: 1rem; box-shadow: 0 8px 20px rgba(94,54,26,.15); padding: 1rem 1.1rem; }
.doc-meta { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; margin-bottom: .8rem; color: #6e4428; font-size: clamp(.8rem,1.6vw,.95rem); }
.badge { border: 1px solid rgba(130,74,38,.35); border-radius: 999px; padding: .18rem .55rem; background: #fff1e2; }
h2 { margin: 0 0 .9rem; color: #7b4621; font-size: clamp(1.1rem,3.2vw,1.7rem); line-height: 1.2; }
.doc-body p { margin: 0 0 .85rem; line-height: 1.65; font-size: clamp(.95rem,2vw,1.06rem); }
.doc-note { border-left: .45rem solid var(--accent); padding-left: .8rem; background: linear-gradient(180deg,#fff9f2,#fcead5); border-radius: .75rem; }
.doc-focus { background: linear-gradient(180deg,#fff6ea,var(--focus-bg)); border: 1px dashed #c27e42; border-radius: .85rem; padding: .9rem; }
.doc-compact p { margin-bottom: .55rem; line-height: 1.4; font-size: clamp(.9rem,1.8vw,1rem); }
body.bookmarks-doc { margin: 0; padding: .75rem; background: linear-gradient(180deg,#f6e8db,#f0d8c1); }
.bookmarks-doc h2 { margin: 0 0 .65rem; font-size: 1.02rem; text-align: center; }
.bookmarks-doc .group { margin-bottom: .7rem; border: 1px solid rgba(130,74,38,.2); border-radius: .8rem; padding: .55rem; background: #fff7ef; }
.bookmarks-doc ol, .bookmarks-doc ul { margin: 0; padding-left: 1.2rem; }
.bookmarks-doc li { margin-bottom: .35rem; }
.kb-export-link { width: 100%; border: 1px solid rgba(130,74,38,.34); border-radius: .65rem; padding: .4rem .5rem; text-align: left; background: linear-gradient(180deg,#fff8f1,#f0dbc9); color: #5e3f2b; cursor: pointer; font: inherit; }
.kb-export-link.active { border-color: rgba(155,90,42,.7); background: linear-gradient(180deg,#ffeedc,#f7d6b2); }
body.content-doc { margin: 0; padding: 1rem; }
@media (max-width: 980px) {
	.kb-export-layout { flex-direction: column; }
	.kb-export-bookmarks, .kb-export-content { flex: 1 1 auto; max-width: 100%; min-width: 0; }
	.kb-export-panel iframe { min-height: clamp(18rem,50vh,32rem); }
}`;

	const createPublicViewJsBundle = () => `(function(){
	const STYLE={normal:{label:"Alap",className:"doc-normal"},note:{label:"Megjegyzés",className:"doc-note"},focus:{label:"Kiemelt",className:"doc-focus"},compact:{label:"Kompakt",className:"doc-compact"}};
	const dataNode=document.getElementById("kbExportData");
	const bookmarksFrame=document.getElementById("kbExportBookmarksFrame");
	const contentFrame=document.getElementById("kbExportContentFrame");
	if(!dataNode||!bookmarksFrame||!contentFrame){return;}
	const esc=function(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\\\"/g,"&quot;").replace(/'/g,"&#039;");};
	const state={bookmarks:[],selectedId:null};
	try{const payload=JSON.parse(dataNode.textContent||"{}");const arr=Array.isArray(payload.bookmarks)?payload.bookmarks:[];state.bookmarks=arr.map(function(it){return{id:String(it&&it.id||crypto.randomUUID()),title:String(it&&it.title||"Névtelen"),content:String(it&&it.content||""),style:STYLE[it&&it.style]?it.style:"normal",updatedAt:Number(it&&it.updatedAt)||Date.now()};}).sort(function(a,b){return b.updatedAt-a.updatedAt;});state.selectedId=state.bookmarks.some(function(it){return it.id===payload.selectedId;})?payload.selectedId:(state.bookmarks[0]&&state.bookmarks[0].id)||null;}catch(e){state.bookmarks=[];state.selectedId=null;}
	const selected=function(){return state.bookmarks.find(function(it){return it.id===state.selectedId;})||null;};
	const toBody=function(t){const n=String(t||"").replace(/\\r\\n/g,"\\n").trim();if(!n){return"<p>Üres tartalom.</p>";}return n.split(/\\n\\s*\\n/g).filter(Boolean).map(function(b){return"<p>"+esc(b).replace(/\\n/g,"<br>")+"</p>";}).join("\\n");};
	const renderBookmarks=function(){const s=selected();const items=state.bookmarks.map(function(b){const a=b.id===state.selectedId?"active":"";return"<li><button class=\"kb-export-link "+a+"\" type=\"button\" data-id=\""+esc(b.id)+"\">"+esc(b.title)+"</button></li>";}).join("\\n");const info=s?"<ul><li>Aktív: <strong>"+esc(s.title)+"</strong></li><li>Stílus: "+esc(STYLE[s.style].label)+"</li><li>Karakterek: "+s.content.length+"</li></ul>":"<ul><li>Nincs kiválasztott bookmark.</li></ul>";bookmarksFrame.srcdoc='<!doctype html><html lang="hu"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bookmarkok</title><link rel="stylesheet" href="./kb-public.css"></head><body class="bookmarks-doc"><section class="group"><h2>Bookmarkok</h2><ol>'+(items||"<li>Nincs elérhető bookmark.</li>")+'</ol></section><section class="group"><h2>Aktív info</h2>'+info+'</section></body></html>';bookmarksFrame.addEventListener("load",function(){const d=bookmarksFrame.contentDocument;if(!d){return;}d.body.addEventListener("click",function(e){const t=e.target;if(!(t instanceof HTMLElement)){return;}const b=t.closest("[data-id]");if(!(b instanceof HTMLElement)){return;}const nextId=b.getAttribute("data-id");if(!nextId){return;}state.selectedId=nextId;render();});},{once:true});};
	const renderContent=function(){const s=selected();if(!s){contentFrame.srcdoc='<!doctype html><html lang="hu"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fő tartalom</title><link rel="stylesheet" href="./kb-public.css"></head><body class="content-doc"><article class="doc-shell doc-normal"><h2>Fő tartalom</h2><div class="doc-body"><p>Nincs kiválasztott bookmark.</p></div></article></body></html>';return;}const style=STYLE[s.style];const upd=new Date(s.updatedAt).toLocaleString("hu-HU");contentFrame.srcdoc='<!doctype html><html lang="hu"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+esc(s.title)+'</title><link rel="stylesheet" href="./kb-public.css"></head><body class="content-doc"><article class="doc-shell '+style.className+'"><div class="doc-meta"><span class="badge">Knowledgebase export</span><span class="badge">Stílus: '+esc(style.label)+'</span><span class="badge">Frissítve: '+esc(upd)+'</span></div><h2>'+esc(s.title)+'</h2><div class="doc-body">'+toBody(s.content)+'</div></article></body></html>';};
	const render=function(){renderBookmarks();renderContent();};
	render();
})();`;

	const tryLoadTextFromFile = async (fileName) => {
		try {
			const response = await fetch(`./${fileName}`, { cache: "no-store" });
			if (!response.ok) {
				return null;
			}
			return await response.text();
		} catch {
			return null;
		}
	};

	const createBookmark = () => {
		const values = getEditorValues();
		if (!values || !values.title) {
			alert("Adj meg egy címet az új bookmark mentéséhez.");
			return;
		}

		const newBookmark = {
			id: crypto.randomUUID(),
			title: values.title,
			content: values.content,
			style: values.style,
			updatedAt: Date.now(),
		};

		state.bookmarks.unshift(newBookmark);
		state.selectedId = newBookmark.id;
		serializeState();
		setStatus(`Új bookmark mentve: ${newBookmark.title}`);
		rerender();
	};

	const updateBookmark = () => {
		const values = getEditorValues();
		const selected = getSelectedBookmark();
		if (!values || !selected) {
			alert("Válassz ki egy bookmarkot a frissítéshez.");
			return;
		}
		if (!values.title) {
			alert("A cím nem lehet üres.");
			return;
		}

		selected.title = values.title;
		selected.content = values.content;
		selected.style = values.style;
		selected.updatedAt = Date.now();
		state.bookmarks.sort((a, b) => b.updatedAt - a.updatedAt);
		state.selectedId = selected.id;
		serializeState();
		setStatus(`Bookmark frissítve: ${selected.title}`);
		rerender();
	};

	const deleteBookmark = () => {
		const selected = getSelectedBookmark();
		if (!selected) {
			alert("Nincs kijelölt bookmark.");
			return;
		}

		if (!confirm(`Biztosan törlöd ezt: "${selected.title}"?`)) {
			return;
		}

		state.bookmarks = state.bookmarks.filter((item) => item.id !== selected.id);
		state.selectedId = state.bookmarks[0]?.id || null;
		serializeState();
		setStatus(`Bookmark törölve: ${selected.title}`);
		rerender();
	};

	const selectBookmark = (id) => {
		if (!state.bookmarks.some((item) => item.id === id)) return;
		state.selectedId = id;
		const selected = getSelectedBookmark();
		if (selected) setStatus(`Kiválasztva: ${selected.title}`);
		rerender();
	};

	const exportBookmarksToJson = () => {
		const payload = {
			version: 1,
			exportedAt: new Date().toISOString(),
			count: state.bookmarks.length,
			bookmarks: state.bookmarks,
		};

		const selected = getSelectedBookmark();
		const baseName = selected ? selected.title : "knowledgebase";
		const fileName = `${getSafeFileName(baseName)}-bookmarks.json`;
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 10000);
		setStatus(`JSON export elkészült: ${fileName}`);
	};

	const exportSelectedToHtml = () => {
		const selected = getSelectedBookmark();
		if (!selected) {
			alert("Nincs kiválasztott bookmark a HTML exporthoz.");
			return;
		}

		const html = createPublicHtml(state.bookmarks, selected.id);
		const fileName = `knowledgebase-${getSafeFileName(selected.title)}.html`;
		const blob = new Blob([html], { type: "text/html;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 10000);
		setStatus(`HTML export elkészült: ${fileName} (tedd mellé: ${PUBLIC_CSS_FILE}, ${PUBLIC_VIEW_JS_FILE})`);
	};

	const exportPackageFiles = async () => {
		const selected = getSelectedBookmark();
		if (!selected) {
			alert("Nincs kiválasztott bookmark az export csomaghoz.");
			return;
		}

		const htmlName = `knowledgebase-${getSafeFileName(selected.title)}.html`;
		const htmlText = createPublicHtml(state.bookmarks, selected.id);
		const loadedCss = await tryLoadTextFromFile(PUBLIC_CSS_FILE);
		const loadedJs = await tryLoadTextFromFile(PUBLIC_VIEW_JS_FILE);
		const cssText = loadedCss || createPublicCssBundle();
		const jsText = loadedJs || createPublicViewJsBundle();

		downloadTextFile(htmlName, htmlText, "text/html;charset=utf-8");
		downloadTextFile(PUBLIC_CSS_FILE, cssText, "text/css;charset=utf-8");
		downloadTextFile(PUBLIC_VIEW_JS_FILE, jsText, "text/javascript;charset=utf-8");

		if (!loadedCss || !loadedJs) {
			setStatus(`Csomag export kész (fallback tartalommal): ${htmlName} + ${PUBLIC_CSS_FILE} + ${PUBLIC_VIEW_JS_FILE}`);
		} else {
			setStatus(`Csomag export kész: ${htmlName} + ${PUBLIC_CSS_FILE} + ${PUBLIC_VIEW_JS_FILE}`);
		}
	};

	const importBookmarksFromFile = async (file, mode = "merge") => {
		if (!file) return;

		try {
			const text = await file.text();
			const parsed = JSON.parse(text);
			const rawBookmarks = Array.isArray(parsed) ? parsed : parsed?.bookmarks;
			const normalized = normalizeBookmarkArray(rawBookmarks);

			if (!normalized.length) {
				alert("A kiválasztott JSON nem tartalmaz érvényes bookmark adatokat.");
				return;
			}

			if (mode === "overwrite") {
				state.bookmarks = normalized;
				state.selectedId = state.bookmarks[0]?.id || null;
				serializeState();
				setStatus(`Teljes felülírás import kész (${state.bookmarks.length} elem)`);
				rerender();
				alert(`Teljes visszaállítás kész. Összes elem: ${state.bookmarks.length}`);
				return;
			}

			const mergeResult = mergeBookmarks(state.bookmarks, normalized);
			state.bookmarks = mergeResult.merged;
			if (!state.bookmarks.some((item) => item.id === state.selectedId)) {
				state.selectedId = state.bookmarks[0]?.id || null;
			}
			serializeState();
			setStatus(`Import kész: +${mergeResult.added} új, ${mergeResult.updated} frissített elem`);
			rerender();
			alert(
				`Import kész. Új elemek: ${mergeResult.added} | Frissített elemek: ${mergeResult.updated} | Összes elem: ${state.bookmarks.length}`
			);
		} catch {
			setStatus("Import hiba: hibás vagy sérült JSON fájl.");
			alert("Hibás vagy sérült JSON fájl. Ellenőrizd a formátumot.");
		}
	};

	const bindEvents = () => {
		const doc = getBookmarksDoc();
		if (!doc) return;

		const jsonFilePicker = doc.getElementById("jsonFilePicker");
		if (jsonFilePicker instanceof HTMLInputElement) {
			jsonFilePicker.addEventListener("change", async () => {
				const selectedFile = jsonFilePicker.files?.[0] || null;
				const mode = state.pendingImportMode || "merge";
				await importBookmarksFromFile(selectedFile, mode);
				state.pendingImportMode = "merge";
				jsonFilePicker.value = "";
			});
		}

		doc.body.addEventListener("click", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLElement)) return;
			const actionElement = target.closest("[data-action]");
			if (!(actionElement instanceof HTMLElement)) return;

			const action = actionElement.getAttribute("data-action");
			const id = actionElement.getAttribute("data-id");

			switch (action) {
				case "create":
					createBookmark();
					break;
				case "update":
					updateBookmark();
					break;
				case "delete":
					deleteBookmark();
					break;
				case "clear":
					clearEditor();
					setStatus("Űrlapmezők ürítve.");
					break;
				case "select":
					if (id) selectBookmark(id);
					break;
				case "exportJson":
					exportBookmarksToJson();
					break;
				case "importJson":
					if (jsonFilePicker instanceof HTMLInputElement) {
						state.pendingImportMode = "merge";
						jsonFilePicker.click();
					}
					break;
				case "importJsonOverwrite": {
					const approved = confirm(
						"A teljes felülírás minden jelenlegi bookmarkot lecserél az importált fájl tartalmára. Folytatod?"
					);
					if (approved && jsonFilePicker instanceof HTMLInputElement) {
						state.pendingImportMode = "overwrite";
						jsonFilePicker.click();
					}
					break;
				}
				case "exportHtml":
					exportSelectedToHtml();
					break;
				case "exportPackage":
					exportPackageFiles();
					break;
				default:
					break;
			}
		});
	};

	const waitForFrame = (frame) =>
		new Promise((resolve) => {
			const doc = frame.contentDocument;
			if (doc && doc.readyState === "complete") {
				resolve();
				return;
			}
			frame.addEventListener("load", () => resolve(), { once: true });
		});

	const init = async () => {
		await Promise.all([waitForFrame(bookmarksFrame), waitForFrame(mainContentFrame)]);
		loadState();
		bindEvents();
		rerender();
	};

	init();
})();
