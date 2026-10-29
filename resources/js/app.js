import { starterRecipes, categories, seedIds } from "./recipes.js";
import { renderHome } from "./home.js";
import { loadBook, archiveRecipe, collectionCategories, searchText } from './collection.js';
import {
    defaults,
    validate,
    cleanRecipe,
    uniqueId,
    localDate,
    weekDates,
    amount,
    shoppingItems,
} from "./model.js";
import {
    escapeHTML as e,
    normalize,
    shortDate,
    isRecord,
    createStore,
    announce,
    setupChrome,
    themeControl,
    bindTheme,
    bindBackup,
    confirmAction,
    emptyState,
    download,
} from "./common.js";

const store = createStore("flavory", defaults, validate);
const main = document.querySelector("#main");
setupChrome("flavory", store);
const headerSearch = document.querySelector("#header-search");
if (headerSearch) {
    const query = new URLSearchParams(location.search).get("q");
    if (query) headerSearch.value = query;
    document.addEventListener("keydown", (event) => {
        if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey)
            return;
        if (
            ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
            event.target.isContentEditable
        )
            return;
        const field =
            document.querySelector("#book-query, #filters #search") || headerSearch;
        event.preventDefault();
        field.focus();
        field.select();
    });
}
const recipes = () => [...starterRecipes, ...store.data.recipes];
let archiveRecipes = [];
const collection = () => [...recipes(), ...archiveRecipes];
const ensureArchive = async () => {
    try { archiveRecipes = (await loadBook()).recipes.map(archiveRecipe); return true; }
    catch { return false; }
};
const findRecipe = (id) => collection().find((recipe) => recipe.id === id);
const recipeURL = (id) => id.startsWith('mr-') ? `/mustika-rasa/${id}` : `/resep/${id}`;
const isSaved = (id) => store.data.saved.includes(id);
const isPersonalRecipe = (id) => store.data.recipes.some((recipe) => recipe.id === id);
const page = (title, body, className = "") => {
    document.title = `${title} · Flavory`;
    main.innerHTML = `<div class="page-width page ${className}">${body}</div>`;
};
function save(message) {
    const result = store.save();
    if (message)
        announce(
            result
                ? message
                : "Perubahan hanya tersimpan sementara. Ekspor cadangan sebelum menutup halaman.",
        );
    return result;
}
function card(recipe, manage = false) {
    const own = manage;
    return `<article class="recipe-card"><a class="recipe-image" href="${recipeURL(recipe.id)}" aria-label="Buka resep ${e(recipe.title)}">${recipe.image ? `<img src="${e(recipe.image)}" alt="${e(recipe.imageAlt)}" width="450" height="310" loading="lazy">` : '<span class="no-photo">Tanpa foto</span>'}${recipe.archive ? '<span class="image-caption">Ilustrasi</span>' : ''}</a><div class="recipe-card-content"><div class="meta"><span>${e(recipe.category)}</span><span>${recipe.archive ? 'Mustika Rasa' : seedIds.has(recipe.id) ? 'Harian' : 'Resepku'}</span>${isSaved(recipe.id) ? '<span>Favorit</span>' : ''}</div><h2><a href="${recipeURL(recipe.id)}">${e(recipe.title)}</a></h2><div class="meta">${recipe.archive ? `<span>Hal. ${recipe.pages.join(', ')}</span><span>Satuan asli</span>` : `<span>${recipe.minutes} menit</span><span>${recipe.servings} porsi</span><span>${recipe.ingredients.length} bahan</span>`}</div><div class="card-actions"><a class="button" href="${recipeURL(recipe.id)}">${own ? 'Baca' : 'Baca resep'}</a>${own ? `<a class="button" href="/resep/${recipe.id}/edit">Edit</a><button class="danger" type="button" data-delete-recipe="${recipe.id}">Hapus</button>` : ''}<button class="save-button save-icon" type="button" data-save="${recipe.id}" aria-label="${isSaved(recipe.id) ? "Lepas" : "Simpan"} ${e(recipe.title)}" aria-pressed="${isSaved(recipe.id)}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg></button></div></div></article>`;
}
async function deletePersonalRecipe(id) {
    if (!isPersonalRecipe(id)) return null;
    if (!(await confirmAction(
        "Hapus resep ini?",
        "Resep, catatan, serta entri rencana dan belanja yang terkait akan dihapus. Unduh file resep terlebih dahulu jika ingin menyimpannya.",
    ))) return null;
    store.data.recipes = store.data.recipes.filter((item) => item.id !== id);
    store.data.saved = store.data.saved.filter((item) => item !== id);
    store.data.plan = store.data.plan.filter((item) => item.recipeId !== id);
    store.data.basket = store.data.basket.filter((item) => item.recipeId !== id);
    for (const key of ["notes", "ratings", "cooked"]) delete store.data[key][id];
    if (store.data.draft?.editing === id) store.data.draft = null;
    return save();
}
function bindRecipeDeleteButtons() {
    document.querySelectorAll("[data-delete-recipe]").forEach((button) =>
        button.addEventListener("click", async () => {
            const deleted = await deletePersonalRecipe(button.dataset.deleteRecipe);
            if (deleted) renderLibraryResults();
            else if (deleted === false) announce("Penghapusan belum tersimpan. Periksa penyimpanan browser.");
        }),
    );
}
function bindSaveButtons() {
    document.querySelectorAll("[data-save]").forEach((button) =>
        button.addEventListener("click", () => {
            const id = button.dataset.save;
            const wasSaved = isSaved(id);
            store.data.saved = wasSaved
                ? store.data.saved.filter((item) => item !== id)
                : [...store.data.saved, id];
            save(
                wasSaved
                    ? "Resep dilepas dari buku resep."
                    : "Resep disimpan ke buku resepmu.",
            );
            button.setAttribute("aria-pressed", String(!wasSaved));
            button.setAttribute(
                "aria-label",
                `${wasSaved ? "Simpan" : "Lepas"} ${findRecipe(id)?.title || button.dataset.title || ''}`,
            );
            if (!button.classList.contains("save-icon")) button.textContent = wasSaved ? "Simpan resep" : "Tersimpan";
            if (location.pathname === "/koleksi") renderLibraryResults();
            else if (document.querySelector('#collection')?.value === 'saved') {
                document.querySelector('#filters').dispatchEvent(new Event('input'));
            }
        }),
    );
}
function home() {
    renderHome({ page, store, recipes, card, bindSaveButtons });
}
function filtersMarkup(q = new URLSearchParams(location.search)) {
    return `<form id="filters" role="search" aria-label="Cari dan filter resep"><div class="search-box"><label for="search">Cari judul atau bahan</label><div class="search-line"><input id="search" type="search" name="q" value="${e(q.get("q") || "")}" placeholder="Nasi, soto, tomat…"><button class="primary" type="submit">Cari resep</button></div></div><div class="filters"><div><label for="collection">Koleksi</label><select id="collection" name="koleksi"><option value="">Semua resep</option><option value="mustika">Mustika Rasa</option><option value="harian">Harian</option><option value="saved">Favorit</option><option value="own">Resepku</option></select></div><div><label for="category">Kategori</label><select id="category" name="category"><option value="">Semua kategori</option>${collectionCategories.map((category) => `<option>${category}</option>`).join("")}</select></div><div><label for="time">Waktu memasak</label><select id="time" name="time"><option value="">Semua durasi</option><option value="15">Maksimal 15 menit</option><option value="30">Maksimal 30 menit</option><option value="60">Maksimal 60 menit</option></select></div><div><label for="sort">Urutkan</label><select id="sort" name="sort"><option value="title">Nama resep</option><option value="time">Paling cepat</option></select></div></div></form><div id="active-filters" class="active-filters" aria-label="Filter aktif"></div>`;
}
function catalog() {
    const q = new URLSearchParams(location.search);
    page(
        "Buku resep",
        `<header class="page-heading collection-heading"><div><h1>Buku resep</h1></div><div class="actions"><a class="button primary" href="/resep/baru">Tulis resep</a><a class="button" href="/koleksi">Koleksiku</a></div></header><div class="catalog-layout"><aside class="catalog-sidebar" aria-label="Filter resep">${filtersMarkup(q)}</aside><section class="catalog-results" aria-label="Hasil resep"><p id="collection-loading" role="status">Memuat koleksi…</p><div id="recipe-results"></div><nav id="collection-pages" class="book-pagination" aria-label="Halaman resep"></nav></section></div>`,
        'collection-page',
    );
    const form = document.querySelector("#filters");
    let archivePending = true;
    form.elements.koleksi.value = q.get('koleksi') || '';
    form.elements.category.value = q.get("category") || "";
    form.elements.time.value = q.get("time") || "";
    form.elements.sort.value = q.get("sort") || "title";
    let current = Math.max(1, Math.floor(Number(q.get('p'))) || 1);
    const update = () => {
        const search = searchText(form.elements.q.value);
        if (headerSearch) headerSearch.value = form.elements.q.value;
        const tokens = search.split(/\s+/).filter(Boolean);
        const filtered = collection()
            .filter(
                (recipe) =>
                    (!form.elements.koleksi.value ||
                        (form.elements.koleksi.value === 'mustika' && recipe.archive) ||
                        (form.elements.koleksi.value === 'harian' && seedIds.has(recipe.id)) ||
                        (form.elements.koleksi.value === 'saved' && isSaved(recipe.id)) ||
                        (form.elements.koleksi.value === 'own' && !recipe.archive && !seedIds.has(recipe.id))) &&
                    (!form.elements.category.value ||
                        recipe.category === form.elements.category.value) &&
                    (!form.elements.time.value ||
                        (recipe.minutes && recipe.minutes <= Number(form.elements.time.value))) &&
                    tokens.every((token) =>
                        searchText(
                            `${recipe.title} ${recipe.searchContent || recipe.description} ${recipe.ingredients.map((item) => item.name).join(" ")}`,
                        ).includes(token),
                    ),
            )
            .sort((a, b) => {
                const titleMatch = (recipe) => tokens.every((token) => searchText(recipe.title).includes(token));
                const relevance = search ? Number(titleMatch(b)) - Number(titleMatch(a)) : 0;
                return relevance || (form.elements.sort.value === "time"
                    ? (a.minutes || Infinity) - (b.minutes || Infinity) ||
                      a.title.localeCompare(b.title, "id")
                    : a.title.localeCompare(b.title, "id"));
            });
        const total = Math.max(1, Math.ceil(filtered.length / 24));
        if (!archivePending) current = Math.min(current, total);
        document.querySelector("#recipe-results").innerHTML =
            `<p class="filter-count" role="status" tabindex="-1">${filtered.length.toLocaleString('id')} resep ditemukan</p>${filtered.length ? `<div class="recipe-grid">${filtered.slice((current - 1) * 24, current * 24).map((recipe) => card(recipe)).join("")}</div>` : emptyState("Belum ada resep yang cocok", "Coba bahan lain atau ubah filter.", '<a class="button" href="/resep">Hapus pencarian</a>')}`;
        if (archivePending && (!filtered.length || current > total)) {
            document.querySelector('#recipe-results').innerHTML = '<p role="status">Memuat koleksi…</p>';
        }
        document.querySelector('#collection-pages').innerHTML = total > 1 ? `<button type="button" data-page="-1" ${current === 1 ? 'disabled' : ''}>Sebelumnya</button><span>${current} / ${total}</span><button type="button" data-page="1" ${current === total ? 'disabled' : ''}>Berikutnya</button>` : '';
        bindSaveButtons();
        const params = new URLSearchParams(new FormData(form));
        for (const [key, value] of [...params])
            if (!value || (key === "sort" && value === "title"))
                params.delete(key);
        const labels = {
            koleksi: 'Koleksi',
            q: "Pencarian",
            category: "Kategori",
            time: "Durasi",
            sort: "Urutan",
        };
        const display = (key, value) =>
            key === 'koleksi' ? { mustika: 'Mustika Rasa', harian: 'Harian', saved: 'Favorit', own: 'Resepku' }[value] : key === "time"
                ? `Maksimal ${value} menit`
                : key === "sort"
                  ? "Paling cepat"
                  : value;
        const active = [...params];
        document.querySelector("#active-filters").innerHTML = active.length
            ? `<span class="filter-caption">Filter aktif</span>${active
                  .map(
                      ([key, value]) =>
                          `<button type="button" class="filter-chip" data-clear-filter="${key}" aria-label="Hapus filter ${labels[key]}: ${e(display(key, value))}">${labels[key]}: ${e(display(key, value))} <span aria-hidden="true">×</span></button>`,
                  )
                  .join("")}<button type="button" class="filter-clear" data-clear-all>Hapus semua</button>`
            : "";
        if (current > 1) params.set('p', current);
        history.replaceState(
            null,
            "",
            `/resep${params.size ? `?${params}` : ""}`,
        );
    };
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        current = 1;
        update();
    });
    form.addEventListener("input", () => { current = 1; update(); });
    document.querySelector('#collection-pages').addEventListener('click', (event) => {
        const button = event.target.closest('[data-page]');
        if (!button) return;
        current += Number(button.dataset.page); update();
        document.querySelector('#recipe-results .filter-count').focus();
    });
    document
        .querySelector("#active-filters")
        .addEventListener("click", (event) => {
            const chip = event.target.closest(
                "[data-clear-filter], [data-clear-all]",
            );
            if (!chip) return;
            if (chip.hasAttribute("data-clear-all")) {
                form.elements.q.value = "";
                form.elements.category.value = "";
                form.elements.time.value = "";
                form.elements.sort.value = "title";
                form.elements.koleksi.value = '';
            } else {
                const key = chip.dataset.clearFilter;
                form.elements[key].value = key === "sort" ? "title" : "";
            }
            current = 1;
            update();
            form.elements.q.focus();
        });
    update();
    ensureArchive().then((loaded) => {
        archivePending = false;
        document.querySelector('#collection-loading').innerHTML = loaded ? '' : 'Mustika Rasa belum dimuat. Resep harian dan pribadimu tetap tersedia. <a href="/resep">Coba lagi</a>';
        update();
    });
}
function bindRecipeImport() {
    document.querySelector('#import-recipe-button')?.addEventListener('click', () => document.querySelector('#import-recipe').click());
    document.querySelector('#import-recipe')?.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const status = document.querySelector('#recipe-import-status');
        try {
            if (file.size > 1_000_000) throw new Error('Ukuran file maksimal 1 MB.');
            if (store.data.recipes.length >= 30) throw new Error('Buku resep sudah berisi 30 resep pribadi. Ekspor atau hapus satu resep sebelum menambah lagi.');
            let data;
            try { data = JSON.parse(await file.text()); } catch { throw new Error('File bukan JSON yang valid.'); }
            if (!isRecord(data) || data.app !== 'flavory-recipe' || data.version !== 1 || !isRecord(data.recipe)) throw new Error('Pilih file resep Flavory, bukan cadangan seluruh aplikasi.');
            const recipe = cleanRecipe({ ...data.recipe, id: uniqueId() });
            if (!(await confirmAction('Tambahkan resep ini?', `“${recipe.title}” akan ditambahkan sebagai resep pribadi di browser ini.`, 'Tambahkan resep'))) return;
            store.data.recipes.push(recipe);
            const saved = save();
            status.className = 'notice success';
            status.textContent = saved ? 'Resep berhasil ditambahkan ke Resepku.' : 'Resep dibuka untuk sesi ini. Ekspor cadangan sebelum menutup halaman.';
            if (document.querySelector('#library-results')) renderLibraryResults();
        } catch (error) {
            status.className = 'notice error';
            status.textContent = error.message;
        }
        event.target.value = '';
    });
}
function library() {
    page(
        "Buku resep pribadi",
        `<header class="page-heading" id="impor"><h1>Koleksiku</h1><div class="actions"><a class="button" href="/resep">Buku resep</a><a class="button primary" href="/resep/baru">Tulis resep</a></div></header><div class="filters"><div><label for="library-search">Cari koleksi</label><input type="search" id="library-search" placeholder="Judul atau bahan…"></div><div><label for="library-filter">Koleksi</label><select id="library-filter"><option value="saved">Favorit</option><option value="own">Resepku</option></select></div></div><div id="library-results"></div>`,
    );
    bindRecipeImport();
    document.querySelector('#library-search').addEventListener('input', renderLibraryResults);
    document.querySelector('#library-filter').addEventListener('change', renderLibraryResults);
    renderLibraryResults();
    ensureArchive().then(renderLibraryResults);
}
function renderLibraryResults() {
    const q = searchText(document.querySelector("#library-search")?.value || "");
    const filter = document.querySelector('#library-filter')?.value || 'saved';
    const found = collection().filter(
        (recipe) =>
            (filter === 'saved' ? isSaved(recipe.id) : !recipe.archive && !seedIds.has(recipe.id)) &&
            searchText(
                `${recipe.title} ${recipe.searchContent || ''} ${recipe.ingredients.map((item) => item.name).join(" ")}`,
            ).includes(q),
    );
    document.querySelector("#library-results").innerHTML =
        `<p class="filter-count" role="status">${found.length} resep di koleksimu</p>${found.length ? `<div class="recipe-grid">${found.map((recipe) => card(recipe, isPersonalRecipe(recipe.id))).join("")}</div>` : emptyState("Buku resepmu masih punya ruang", "Simpan resep dari katalog atau tulis masakan yang ingin kamu ingat.", '<a class="button" href="/resep">Pilih resep dari katalog</a>')}`;
    bindSaveButtons();
    bindRecipeDeleteButtons();
}
function recipeDetail(id) {
    const recipe = findRecipe(id);
    if (!recipe) return notFound();
    let servings = recipe.servings;
    const own = isPersonalRecipe(id);
    const checkedIngredients = new Set();
    const related = recipes()
        .filter((item) => item.id !== id)
        .sort(
            (a, b) =>
                Number(b.category === recipe.category) -
                    Number(a.category === recipe.category) ||
                a.minutes - b.minutes ||
                a.title.localeCompare(b.title, "id"),
        )
        .slice(0, 3);
    const relatedSection = related.length
        ? `<section class="related-recipes no-print" aria-labelledby="related-heading"><div class="section-heading"><h2 id="related-heading">Resep lain untuk dicoba</h2><a href="/resep">Lihat semua resep</a></div><div class="related-grid">${related
              .map(
                  (item) =>
                      `<a class="related-card" href="${recipeURL(item.id)}">${item.image ? `<img src="${e(item.image)}" alt="" width="120" height="120" loading="lazy">` : '<span class="related-no-photo">Tanpa foto</span>'}<span class="related-copy"><span class="related-category">${e(item.category)} · ${item.minutes} menit</span><strong>${e(item.title)}</strong><span class="related-meta">${item.ingredients.length} bahan · ${item.servings} porsi</span></span></a>`,
              )
              .join("")}</div></section>`
        : "";
    page(
        recipe.title,
        `<div class="recipe-intro"><header><p class="eyeline">${e(recipe.category)} · ${own ? "Resep pribadimu" : "Koleksi awal Flavory"}</p><h1>${e(recipe.title)}</h1><p>${e(recipe.description)}</p><div class="meta"><span>± ${recipe.minutes} menit</span><span>${recipe.ingredients.length} bahan</span><span>${recipe.steps.length} langkah</span></div><div class="actions"><button type="button" class="primary" id="start-cooking">Mulai memasak</button><button type="button" class="save-button" data-save="${id}" aria-pressed="${isSaved(id)}" aria-label="${isSaved(id) ? "Lepas" : "Simpan"} ${e(recipe.title)}">${isSaved(id) ? "Tersimpan" : "Simpan resep"}</button></div><p class="cooked-indicator" id="cooked-status">${store.data.cooked[id] ? `Terakhir kamu masak: ${shortDate(store.data.cooked[id])}` : ""}</p></header><figure class="recipe-detail-photo">${recipe.image ? `<img src="${e(recipe.image)}" alt="${e(recipe.imageAlt)}" width="450" height="340"><figcaption>Foto ilustrasi dari koleksi awal proyek.</figcaption>` : '<div class="no-photo">Resep pribadi · belum ada foto</div>'}</figure></div><div class="recipe-body"><section class="panel"><h2>Siapkan bahannya</h2><div class="servings-control"><label for="servings">Porsi</label><button type="button" id="less-servings" aria-label="Kurangi porsi">−</button><input id="servings" type="number" min="1" max="24" step="1" value="${servings}" aria-describedby="portion-note"><button type="button" id="more-servings" aria-label="Tambah porsi">+</button></div><p id="portion-note" class="small muted">Takaran dihitung proporsional. Sesuaikan bumbu setelah mencicipi; waktu memasak bisa berubah.</p><ul class="ingredient-list" id="ingredients"></ul><div class="readiness"><div class="readiness-copy"><strong id="ingredient-readiness" role="status" aria-live="polite">0 dari ${recipe.ingredients.length} bahan siap</strong><span id="readiness-note" class="small muted">Centang bahan yang sudah disiapkan.</span></div><progress id="readiness-bar" value="0" max="${recipe.ingredients.length}" aria-label="Kesiapan bahan"></progress></div><button type="button" id="add-shopping">Tambahkan ke daftar belanja</button><p class="small muted">Centang berlaku selama halaman terbuka.</p></section><section><div class="section-heading"><h2>Cara memasak</h2><button type="button" id="print-recipe" class="no-print">Cetak resep</button></div><ol class="steps">${recipe.steps.map((step) => `<li><p>${e(step)}</p></li>`).join("")}</ol>${recipe.tip ? `<div class="notice"><h3>Catatan dapur</h3><p>${e(recipe.tip)}</p></div>` : ""}<div class="actions no-print"><button type="button" id="share-recipe">Bagikan teks resep</button><button type="button" id="export-recipe">Unduh file resep</button><a class="button" href="/resep/baru?salin=${id}">Buat versiku</a></div><section class="recipe-note no-print"><h2>Catatan rasamu</h2><form id="recipe-note-form"><div class="field"><label for="personal-rating">Penilaian pribadi</label><select id="personal-rating"><option value="0">Belum dinilai</option>${[1, 2, 3, 4, 5].map((value) => `<option value="${value}">${value} dari 5</option>`).join("")}</select></div><label for="recipe-note">Apa yang ingin diubah saat memasak lagi?</label><textarea id="recipe-note" maxlength="2000" placeholder="Kurangi garam, tambah sayur, atau catat versi kesukaanmu…">${e(store.data.notes[id] || "")}</textarea><button type="submit">Simpan catatan rasa</button><p id="note-status" class="small muted" role="status">Catatan pribadi, tersimpan di browser ini.</p></form></section></section></div>${relatedSection}<dialog id="cooking-dialog" class="cooking-dialog" aria-labelledby="cooking-title"><div class="dialog-heading"><div><p class="eyeline">Mode memasak</p><h2 id="cooking-title">${e(recipe.title)}</h2></div><button type="button" id="close-cooking">Tutup</button></div><p id="step-label" class="muted small" role="status"></p><progress id="step-progress" max="${recipe.steps.length}" value="1" aria-label="Langkah memasak"></progress><div class="cooking-step" id="cooking-step" aria-live="polite"></div><div class="cooking-controls"><button type="button" id="previous-step">Langkah sebelumnya</button><button type="button" class="primary" id="next-step">Langkah berikutnya</button></div><section class="timer"><h3>Pengingat dapur</h3><p class="small muted">Tetap awasi masakan. Pengingat hanya aktif selama halaman ini terbuka.</p><output id="timer-output" class="timer-output" aria-label="Sisa waktu">05:00</output><div class="timer-controls"><div><label for="timer-minutes">Menit (1–180)</label><input type="number" id="timer-minutes" value="5" min="1" max="180"></div><button type="button" id="timer-toggle">Mulai pengingat</button><button type="button" id="timer-reset">Atur ulang</button></div><p id="timer-status" role="status" aria-live="polite" class="small muted"></p></section></dialog>`,
    );
    const updateReadiness = () => {
        const total = recipe.ingredients.length;
        const ready = checkedIngredients.size;
        document.querySelector("#ingredient-readiness").textContent =
            `${ready} dari ${total} bahan siap`;
        document.querySelector("#readiness-note").textContent =
            ready === total
                ? "Semua bahan siap. Kamu bisa mulai memasak."
                : ready
                  ? `Tersisa ${total - ready} bahan lagi.`
                  : "Centang bahan yang sudah disiapkan.";
        document.querySelector("#readiness-bar").value = ready;
    };
    const renderIngredients = () => {
        document.querySelector("#ingredients").innerHTML = recipe.ingredients
            .map(
                (item, index) =>
                    `<li><label><input type="checkbox" data-ingredient="${index}" aria-label="Siapkan ${e(item.name)}" ${checkedIngredients.has(index) ? "checked" : ""}><span><strong>${amount((item.quantity * servings) / recipe.servings)} ${e(item.unit)}</strong> ${e(item.name)}</span></label></li>`,
            )
            .join("");
        document
            .querySelectorAll("#ingredients input[data-ingredient]")
            .forEach((input) =>
                input.addEventListener("change", () => {
                    const index = Number(input.dataset.ingredient);
                    if (input.checked) checkedIngredients.add(index);
                    else checkedIngredients.delete(index);
                    updateReadiness();
                }),
            );
        updateReadiness();
    };
    const setServings = (value) => {
        if (!Number.isInteger(value) || value < 1 || value > 24) return;
        servings = value;
        document.querySelector("#servings").value = value;
        document.querySelector("#less-servings").disabled = value <= 1;
        document.querySelector("#more-servings").disabled = value >= 24;
        renderIngredients();
    };
    document
        .querySelector("#less-servings")
        .addEventListener("click", () => setServings(servings - 1));
    document
        .querySelector("#more-servings")
        .addEventListener("click", () => setServings(servings + 1));
    document.querySelector("#servings").addEventListener("change", (event) => {
        const value = Number(event.target.value);
        if (Number.isInteger(value) && value >= 1 && value <= 24)
            setServings(value);
        else {
            event.target.value = servings;
            announce("Porsi harus berupa angka bulat dari 1 sampai 24.");
        }
    });
    setServings(servings);
    bindSaveButtons();
    document.querySelector("#add-shopping").addEventListener("click", () => {
        const existing = store.data.basket.find((item) => item.recipeId === id);
        if (existing) existing.servings = servings;
        else store.data.basket.push({ recipeId: id, servings });
        store.data.checked = [];
        save(
            `Bahan untuk ${servings} porsi ditambahkan. Buka Rencana belanja untuk melihatnya.`,
        );
    });
    document
        .querySelector("#print-recipe")
        .addEventListener("click", () => window.print());
    document.querySelector("#export-recipe").addEventListener("click", () => {
        download(`flavory-${id}.json`, {
            app: "flavory-recipe",
            version: 1,
            recipe,
        });
        announce(
            "File resep siap diunduh dan bisa diimpor ke Flavory di perangkat lain.",
        );
    });
    document
        .querySelector("#share-recipe")
        .addEventListener("click", async () => {
            const text = `${recipe.title}\n${servings} porsi · ± ${recipe.minutes} menit\n\nBahan:\n${recipe.ingredients.map((item) => `- ${amount((item.quantity * servings) / recipe.servings)} ${item.unit} ${item.name}`).join("\n")}\n\nLangkah:\n${recipe.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}\n\nDibagikan dari Flavory. Foto ilustrasi tidak disertakan.`;
            try {
                if (navigator.share)
                    await navigator.share({ title: recipe.title, text });
                else {
                    await navigator.clipboard.writeText(text);
                    announce(
                        "Teks resep disalin. Tempel di pesan untuk membagikannya.",
                    );
                }
            } catch (error) {
                if (error.name !== "AbortError")
                    announce(
                        "Browser membatasi berbagi atau salin. Gunakan “Unduh file resep” untuk membagikannya.",
                    );
            }
        });
    document.querySelector("#personal-rating").value =
        store.data.ratings[id] || 0;
    document
        .querySelector("#recipe-note-form")
        .addEventListener("submit", (event) => {
            event.preventDefault();
            const text = document.querySelector("#recipe-note").value.trim();
            if (text) store.data.notes[id] = text;
            else delete store.data.notes[id];
            const rating = Number(
                document.querySelector("#personal-rating").value,
            );
            if (rating) store.data.ratings[id] = rating;
            else delete store.data.ratings[id];
            document.querySelector("#note-status").textContent = save()
                ? "Catatan rasa dan penilaian pribadi tersimpan."
                : "Catatan tersimpan sementara. Ekspor cadangan sebelum menutup halaman.";
        });
    bindCooking(recipe);
}
function bindCooking(recipe) {
    const dialog = document.querySelector("#cooking-dialog");
    let step = 0;
    let remaining = 300;
    let endsAt = null;
    let timer;
    const display = () => {
        document.querySelector("#step-label").textContent =
            `Langkah ${step + 1} dari ${recipe.steps.length}`;
        document.querySelector("#step-progress").value = step + 1;
        document.querySelector("#cooking-step").textContent =
            recipe.steps[step];
        document.querySelector("#previous-step").disabled = step === 0;
        document.querySelector("#next-step").textContent =
            step === recipe.steps.length - 1
                ? "Selesai memasak"
                : "Langkah berikutnya";
    };
    document.querySelector("#start-cooking").addEventListener("click", () => {
        display();
        dialog.showModal();
        document.querySelector("#close-cooking").focus();
    });
    document
        .querySelector("#close-cooking")
        .addEventListener("click", () => dialog.close());
    document.querySelector("#previous-step").addEventListener("click", () => {
        if (step > 0) step--;
        display();
    });
    document.querySelector("#next-step").addEventListener("click", () => {
        if (step < recipe.steps.length - 1) {
            step++;
            display();
        } else {
            store.data.cooked[recipe.id] = new Date().toISOString();
            save("Selesai memasak. Catat penyesuaian rasamu untuk lain kali.");
            document.querySelector("#cooked-status").textContent =
                `Terakhir kamu masak: ${shortDate(store.data.cooked[recipe.id])}`;
            dialog.close();
            step = 0;
        }
    });
    const updateTimer = () => {
        if (endsAt)
            remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        document.querySelector("#timer-output").textContent =
            `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
        if (endsAt && remaining === 0) {
            clearInterval(timer);
            endsAt = null;
            document.querySelector("#timer-toggle").textContent = "Mulai lagi";
            document.querySelector("#timer-minutes").disabled = false;
            document.querySelector("#timer-status").textContent =
                "Waktu pengingat selesai. Periksa masakanmu.";
            announce("Waktu pengingat dapur selesai. Periksa masakanmu.");
        }
    };
    document.querySelector("#timer-toggle").addEventListener("click", () => {
        if (endsAt) {
            updateTimer();
            endsAt = null;
            clearInterval(timer);
            document.querySelector("#timer-toggle").textContent = "Lanjutkan";
            document.querySelector("#timer-status").textContent =
                "Pengingat dijeda.";
        } else {
            const input = document.querySelector("#timer-minutes");
            if (!input.checkValidity()) {
                input.reportValidity();
                return;
            }
            if (remaining === 0) remaining = Number(input.value) * 60;
            endsAt = Date.now() + remaining * 1000;
            timer = setInterval(updateTimer, 250);
            input.disabled = true;
            document.querySelector("#timer-toggle").textContent = "Jeda";
            document.querySelector("#timer-status").textContent =
                "Pengingat berjalan selama halaman ini terbuka.";
            updateTimer();
        }
    });
    document
        .querySelector("#timer-minutes")
        .addEventListener("change", (event) => {
            if (!endsAt && event.target.checkValidity()) {
                remaining = Number(event.target.value) * 60;
                updateTimer();
            }
        });
    document.querySelector("#timer-reset").addEventListener("click", () => {
        clearInterval(timer);
        endsAt = null;
        const input = document.querySelector("#timer-minutes");
        input.disabled = false;
        remaining = Math.max(1, Math.min(180, Number(input.value) || 5)) * 60;
        document.querySelector("#timer-toggle").textContent = "Mulai pengingat";
        document.querySelector("#timer-status").textContent =
            "Pengingat diatur ulang.";
        updateTimer();
    });
    window.addEventListener("pagehide", () => clearInterval(timer), {
        once: true,
    });
}
function recipeForm(id) {
    if (id && (seedIds.has(id) || !findRecipe(id))) return notFound();
    if (!id && store.data.recipes.length >= 30)
        return page(
            "Buku resep penuh",
            emptyState(
                "Sudah ada 30 resep pribadi",
                "Ekspor atau hapus satu resep yang tidak diperlukan sebelum menambah resep baru.",
                '<a class="button" href="/koleksi">Kelola buku resep</a>',
            ),
        );
    const copiedId = new URLSearchParams(location.search).get("salin");
    const original = id
        ? findRecipe(id)
        : copiedId
          ? findRecipe(copiedId)
          : null;
    const canResume =
        store.data.draft &&
        (id
            ? store.data.draft.editing === id
            : !store.data.draft.editing && !copiedId);
    let working = canResume
        ? structuredClone(store.data.draft)
        : original
          ? {
                ...structuredClone(original),
                id: id || uniqueId(),
                title: id
                    ? original.title
                    : `${original.title} versiku`.slice(0, 120),
                editing: id || null,
            }
          : {
                id: uniqueId(),
                title: "",
                description: "",
                category: categories[0],
                minutes: 15,
                servings: 2,
                image: "",
                imageAlt: "",
                tip: "",
                ingredients: [{ name: "", quantity: 1, unit: "" }],
                steps: [""],
                editing: null,
            };
    let dirty = false;
    let draftTimer;
    page(
        id ? "Edit resep" : "Tulis resep",
        `<header class="page-heading" id="impor-resep"><h1>${id ? "Edit resep" : "Tulis resep"}</h1>${!id ? '<div class="recipe-import-action"><button type="button" id="import-recipe-button">Impor resep</button><label class="visually-hidden" for="import-recipe">Pilih file resep Flavory</label><input class="visually-hidden" id="import-recipe" type="file" accept="application/json,.json"><p id="recipe-import-status" role="status" aria-live="polite"></p></div>' : ""}${canResume ? '<p class="notice">Draft terakhir dipulihkan. Kamu bisa melanjutkan menulis.</p>' : ""}</header><form id="recipe-form" class="recipe-form"><div class="recipe-form-details"><section class="panel"><h2>Detail resep</h2><div class="field"><label for="recipe-title">Nama resep</label><input id="recipe-title" maxlength="120" required value="${e(working.title)}" placeholder="Contoh: Tumis tahu kesukaan rumah"></div><div class="field"><label for="description">Cerita singkat</label><textarea id="description" maxlength="600" required placeholder="Rasa, tekstur, atau kapan kamu biasa memasaknya…">${e(working.description)}</textarea></div><div class="form-two"><div class="field"><label for="recipe-category">Kategori</label><select id="recipe-category">${categories.map((category) => `<option ${working.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div><div class="field"><label for="recipe-minutes">Perkiraan waktu (menit)</label><input id="recipe-minutes" type="number" min="1" max="240" step="1" required value="${working.minutes}"></div><div class="field"><label for="recipe-servings">Porsi dasar</label><input id="recipe-servings" type="number" min="1" max="24" step="1" required value="${working.servings}"><small>Takaran bahan di bawah untuk jumlah porsi ini.</small></div></div></section><section class="panel"><h2>Catatan tambahan</h2><label for="recipe-tip">Tips, pengganti bahan, atau alergen (opsional)</label><textarea id="recipe-tip" maxlength="600" placeholder="Apa yang perlu diingat saat mencoba resep ini?">${e(working.tip)}</textarea></section></div><div class="recipe-form-method"><fieldset class="panel"><legend>Bahan-bahan</legend><p class="small muted">Maksimal 20 bahan. Takaran mengikuti porsi.</p><div id="ingredient-editor" class="ingredient-editor"></div><button type="button" id="add-ingredient">Tambah bahan</button></fieldset><fieldset class="panel"><legend>Langkah memasak</legend><p class="small muted">Maksimal 16 langkah, 600 karakter per langkah.</p><div id="step-editor" class="step-editor"></div><button type="button" id="add-step">Tambah langkah</button></fieldset></div><div id="form-error" role="alert"></div><div class="actions"><button type="submit" class="primary">Simpan resep</button><button type="button" id="discard-draft">Buang draft</button></div><p id="draft-status" class="form-status" role="status">Draft otomatis tersimpan di browser ini.</p></form>`,
    );
    bindRecipeImport();
    const form = document.querySelector("#recipe-form");
    const readForm = () => {
        working.title = document.querySelector("#recipe-title").value;
        working.description = document.querySelector("#description").value;
        working.category = document.querySelector("#recipe-category").value;
        working.minutes = Number(
            document.querySelector("#recipe-minutes").value,
        );
        working.servings = Number(
            document.querySelector("#recipe-servings").value,
        );
        working.tip = document.querySelector("#recipe-tip").value;
        working.ingredients = [
            ...document.querySelectorAll(".ingredient-row"),
        ].map((row) => ({
            name: row.querySelector('[data-field="name"]').value,
            quantity: Number(
                row.querySelector('[data-field="quantity"]').value,
            ),
            unit: row.querySelector('[data-field="unit"]').value,
        }));
        working.steps = [...document.querySelectorAll("[data-step-text]")].map(
            (input) => input.value,
        );
    };
    const saveDraft = () => {
        clearTimeout(draftTimer);
        draftTimer = null;
        readForm();
        store.data.draft = { ...working, editing: id || null };
        const saved = save();
        dirty = !saved;
        document.querySelector("#draft-status").textContent = saved
            ? "Draft tersimpan di browser ini."
            : "Draft sementara. Browser membatasi penyimpanan; jangan tutup halaman sebelum menyalin resepmu.";
    };
    const renderEditors = () => {
        document.querySelector("#ingredient-editor").innerHTML =
            working.ingredients
                .map(
                    (item, i) =>
                        `<div class="ingredient-row"><div class="ingredient-name"><label for="ingredient-name-${i}">Bahan ${i + 1}</label><input id="ingredient-name-${i}" data-field="name" required maxlength="100" value="${e(item.name)}" placeholder="Nama bahan"></div><div><label for="ingredient-qty-${i}">Jumlah</label><input id="ingredient-qty-${i}" data-field="quantity" type="number" required min="0.01" max="10000" step="any" value="${item.quantity}"></div><div><label for="ingredient-unit-${i}">Satuan</label><input id="ingredient-unit-${i}" data-field="unit" required maxlength="20" value="${e(item.unit)}" placeholder="g, ml, sdm…"></div><button type="button" data-remove-ingredient="${i}" aria-label="Hapus bahan ${i + 1}" ${working.ingredients.length <= 1 ? "disabled" : ""}>Hapus</button></div>`,
                )
                .join("");
        document.querySelector("#step-editor").innerHTML = working.steps
            .map(
                (step, i) =>
                    `<div class="step-row"><label for="step-${i}">Langkah ${i + 1}</label><textarea id="step-${i}" data-step-text required maxlength="600">${e(step)}</textarea><button type="button" data-remove-step="${i}" ${working.steps.length <= 1 ? "disabled" : ""}>Hapus langkah ${i + 1}</button></div>`,
            )
            .join("");
        document.querySelector("#add-ingredient").disabled =
            working.ingredients.length >= 20;
        document.querySelector("#add-step").disabled =
            working.steps.length >= 16;
        document
            .querySelectorAll("[data-remove-ingredient]")
            .forEach((button) =>
                button.addEventListener("click", () => {
                    readForm();
                    working.ingredients.splice(
                        Number(button.dataset.removeIngredient),
                        1,
                    );
                    renderEditors();
                    saveDraft();
                    document.querySelector("#add-ingredient").focus();
                }),
            );
        document.querySelectorAll("[data-remove-step]").forEach((button) =>
            button.addEventListener("click", () => {
                readForm();
                working.steps.splice(Number(button.dataset.removeStep), 1);
                renderEditors();
                saveDraft();
                document.querySelector("#add-step").focus();
            }),
        );
    };
    renderEditors();
    document.querySelector("#add-ingredient").addEventListener("click", () => {
        readForm();
        if (working.ingredients.length < 20)
            working.ingredients.push({ name: "", quantity: 1, unit: "" });
        renderEditors();
        saveDraft();
        document
            .querySelector(`#ingredient-name-${working.ingredients.length - 1}`)
            .focus();
    });
    document.querySelector("#add-step").addEventListener("click", () => {
        readForm();
        if (working.steps.length < 16) working.steps.push("");
        renderEditors();
        saveDraft();
        document.querySelector(`#step-${working.steps.length - 1}`).focus();
    });
    form.addEventListener("input", () => {
        dirty = true;
        document.querySelector("#draft-status").textContent =
            "Menyimpan draft…";
        clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraft, 400);
    });
    form.addEventListener("change", saveDraft);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearTimeout(draftTimer);
        draftTimer = null;
        readForm();
        try {
            const recipe = cleanRecipe(working);
            store.data.recipes = store.data.recipes.some(
                (item) => item.id === recipe.id,
            )
                ? store.data.recipes.map((item) =>
                      item.id === recipe.id ? recipe : item,
                  )
                : [...store.data.recipes, recipe];
            if (!store.data.saved.includes(recipe.id))
                store.data.saved.push(recipe.id);
            store.data.draft = null;
            if (save()) {
                dirty = false;
                location.assign(recipeURL(recipe.id));
            } else
                document.querySelector("#form-error").innerHTML =
                    '<p class="notice error">Resep belum tersimpan permanen. Jangan tutup halaman; salin bahan dan langkahmu sebelum mencoba lagi.</p>';
        } catch (error) {
            document.querySelector("#form-error").innerHTML =
                `<p class="notice error">${e(error.message)}</p>`;
        }
    });
    document
        .querySelector("#discard-draft")
        .addEventListener("click", async () => {
            if (
                await confirmAction(
                    "Buang draft ini?",
                    "Tulisan yang belum disimpan sebagai resep akan dihapus. Resep yang sudah tersimpan tetap ada.",
                    "Buang draft",
                )
            ) {
                clearTimeout(draftTimer);
                draftTimer = null;
                store.data.draft = null;
                if (save()) {
                    dirty = false;
                    location.assign("/koleksi");
                }
            }
        });
    window.addEventListener("beforeunload", (event) => {
        if (draftTimer) saveDraft();
        if (dirty) {
            event.preventDefault();
            event.returnValue = "";
        }
    });
}
async function planner() {
    await ensureArchive();
    const menuRecipes = collection().filter((recipe) => isSaved(recipe.id));
    const week = weekDates(new URLSearchParams(location.search).get("week"));
    const fmt = (value) =>
        new Intl.DateTimeFormat("id", {
            day: "numeric",
            month: "short",
        }).format(new Date(`${value}T12:00:00`));
    const moveWeek = (direction) => {
        const day = new Date(`${week[0]}T12:00:00`);
        day.setDate(day.getDate() + direction * 7);
        return `/rencana?week=${localDate(day)}`;
    };
    const renderWeek = () => {
        document.querySelector("#week-list").innerHTML = week
            .map((date) => {
                const items = store.data.plan
                    .filter((item) => item.date === date)
                    .sort(
                        (a, b) =>
                            ["Pagi", "Siang", "Malam"].indexOf(a.slot) -
                            ["Pagi", "Siang", "Malam"].indexOf(b.slot),
                    );
                return `<section class="day ${date === localDate() ? "today" : ""}"><header><h3>${new Intl.DateTimeFormat("id", { weekday: "long" }).format(new Date(`${date}T12:00:00`))}</h3><small>${fmt(date)}${date === localDate() ? " · Hari ini" : ""}</small></header>${items.length ? `<ul>${items.map((item) => `<li><span><a href="${recipeURL(item.recipeId)}">${e(findRecipe(item.recipeId)?.title || "")}</a><small>${item.slot} · ${item.servings} porsi</small></span><button type="button" data-remove-plan="${date}|${item.slot}" aria-label="Hapus menu ${item.slot} ${fmt(date)}">Hapus</button></li>`).join("")}</ul>` : '<p class="day-empty">Belum ada menu</p>'}</section>`;
            })
            .join("");
        document.querySelectorAll("[data-remove-plan]").forEach((button) =>
            button.addEventListener("click", () => {
                const [date, slot] = button.dataset.removePlan.split("|");
                store.data.plan = store.data.plan.filter(
                    (item) => item.date !== date || item.slot !== slot,
                );
                save(
                    "Menu dihapus dari rencana. Resep tetap ada di buku resepmu.",
                );
                renderWeek();
            }),
        );
    };
    page(
        "Rencana masak",
        `<header class="page-heading"><h1>Rencana masak</h1></header><div class="planner-layout"><section class="panel planner-compose"><h2>Tambah menu</h2><p class="small muted">Menu di waktu yang sama akan diganti.</p><form id="plan-form" class="plan-form"><div><label for="plan-recipe">Resep</label><select id="plan-recipe" required>${menuRecipes.length ? '' : '<option value="">Simpan resep terlebih dahulu</option>'}${menuRecipes
            .map(
                (recipe) =>
                    `<option value="${recipe.id}">${e(recipe.title)}</option>`,
            )
            .join(
                "",
            )}</select></div><div><label for="plan-date">Tanggal</label><input id="plan-date" type="date" required value="${week.includes(localDate()) ? localDate() : week[0]}"></div><div><label for="plan-slot">Waktu makan</label><select id="plan-slot"><option>Pagi</option><option>Siang</option><option>Malam</option></select></div><div><label for="plan-servings">Porsi</label><input id="plan-servings" type="number" min="1" max="24" step="1" value="2" required></div><div class="actions"><button type="submit" class="primary" ${menuRecipes.length ? "" : "disabled"}>Simpan menu</button><span id="plan-status" role="status" class="small muted"></span></div></form></section><div class="planner-agenda"><nav class="week-nav" aria-label="Pilih minggu"><a class="button" href="${moveWeek(-1)}">Minggu sebelumnya</a><h2>${fmt(week[0])} – ${fmt(week[6])}</h2><a class="button" href="${moveWeek(1)}">Minggu berikutnya</a></nav><div id="week-list" class="week-list"></div><div class="notice"><h2>Belanja minggu ini</h2><p>Bahan resep harian dijumlahkan sesuai porsi. Bahan Mustika Rasa perlu ditambahkan manual.</p><div class="actions"><button type="button" id="plan-shopping">Buat daftar belanja minggu ini</button><a class="button" href="/rencana">Kembali ke minggu ini</a></div><p id="shopping-plan-status" role="status"></p></div></div></div>`,
    );
    renderWeek();
    document.querySelector('#plan-servings').value = menuRecipes[0]?.servings || 2;
    if (!menuRecipes.length) document.querySelector('#plan-status').innerHTML = '<a href="/resep">Pilih dan simpan resep</a>';
    document
        .querySelector("#plan-recipe")
        .addEventListener("change", (event) => {
            document.querySelector("#plan-servings").value = findRecipe(
                event.target.value,
            )?.servings || 2;
        });
    document.querySelector("#plan-form").addEventListener("submit", (event) => {
        event.preventDefault();
        if (!menuRecipes.some((recipe) => recipe.id === document.querySelector('#plan-recipe').value)) return;
        const date = document.querySelector("#plan-date").value;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        const slot = document.querySelector("#plan-slot").value;
        store.data.plan = store.data.plan.filter(
            (item) => item.date !== date || item.slot !== slot,
        );
        if (store.data.plan.length >= 180) {
            document.querySelector("#plan-status").textContent =
                "Rencana sudah berisi 180 menu. Hapus menu lama sebelum menambah lagi.";
            return;
        }
        store.data.plan.push({
            recipeId: document.querySelector("#plan-recipe").value,
            date,
            slot,
            servings: Number(document.querySelector("#plan-servings").value),
        });
        const saved = save();
        document.querySelector("#plan-status").textContent = saved
            ? `Menu untuk ${fmt(date)} tersimpan.${week.includes(date) ? "" : " Tanggal tersebut berada di minggu lain."}`
            : "Menu sementara. Penyimpanan browser dibatasi.";
        renderWeek();
    });
    document
        .querySelector("#plan-shopping")
        .addEventListener("click", async () => {
            const items = store.data.plan.filter((item) =>
                week.includes(item.date),
            );
            const status = document.querySelector("#shopping-plan-status");
            if (!items.length) {
                status.textContent =
                    "Tambahkan setidaknya satu menu pada minggu ini terlebih dahulu.";
                return;
            }
            if (
                store.data.basket.length &&
                !(await confirmAction(
                    "Susun ulang bahan belanja?",
                    "Bahan dari resep sebelumnya diganti dengan menu minggu ini. Item yang ditambahkan manual tetap ada.",
                    "Susun daftar",
                ))
            )
                return;
            const grouped = new Map();
            if (items.every((item) => item.recipeId.startsWith('mr-'))) {
                status.textContent = 'Bahan Mustika Rasa perlu ditambahkan manual di Rencana belanja.';
                return;
            }
            items.filter((item) => !item.recipeId.startsWith('mr-')).forEach((item) =>
                grouped.set(
                    item.recipeId,
                    (grouped.get(item.recipeId) || 0) + item.servings,
                ),
            );
            store.data.basket = [...grouped].map(([recipeId, servings]) => ({
                recipeId,
                servings,
            }));
            store.data.checked = [];
            if (save()) location.assign("/belanja");
            else
                status.textContent =
                    "Daftar tersusun sementara. Penyimpanan browser dibatasi.";
        });
}
function shopping() {
    page(
        "Rencana belanja",
        `<header class="page-heading"><h1>Rencana belanja</h1><div class="actions no-print"><button type="button" id="print-shopping">Cetak daftar</button><button type="button" class="danger" id="clear-shopping">Kosongkan daftar</button></div></header><div class="shopping-layout"><section class="panel no-print"><h2>Tambah bahan</h2><form id="manual-item" class="shopping-add"><div><label for="item-name">Nama bahan</label><input id="item-name" maxlength="100" required placeholder="Contoh: Beras"></div><div><label for="item-quantity">Jumlah</label><input id="item-quantity" type="number" min="0.01" max="10000" step="any" value="1" required></div><div><label for="item-unit">Satuan</label><input id="item-unit" maxlength="20" required placeholder="kg, g, buah…"></div><button type="submit">Tambah bahan</button></form><p id="manual-status" role="status" class="small muted"></p></section><section id="shopping-results" aria-label="Daftar bahan"></section></div>`,
    );
    const render = () => {
        const items = shoppingItems(store.data, recipes());
        const checked = items.filter((item) =>
            store.data.checked.includes(item.key),
        ).length;
        document.querySelector("#shopping-results").innerHTML = items.length
            ? `<div class="shopping-summary"><h2>Bahan belanja</h2><p class="muted small" role="status">${checked} dari ${items.length} bahan sudah siap</p></div><p class="shopping-sources">${store.data.basket.length} resep · ${store.data.manual.length} tambahan</p><ul class="shopping-list">${items.map((item) => `<li><label><input type="checkbox" data-check="${e(item.key)}" ${store.data.checked.includes(item.key) ? "checked" : ""}><span><strong>${e(item.name)}</strong><br><small>${amount(item.quantity)} ${e(item.unit)}</small></span></label>${item.manual ? `<button class="no-print" type="button" data-remove-item="${item.id}" aria-label="Hapus ${e(item.name)}">Hapus</button>` : ""}</li>`).join("")}</ul><p class="small muted">Nama bahan yang berbeda tidak digabung otomatis. Sesuaikan daftar dengan kebutuhan dan alergi yang kamu ketahui.</p>`
            : emptyState(
                  "Rencana belanja masih kosong",
                  "Pilih resep atau tambahkan bahan.",
                  '<a class="button primary" href="/resep">Pilih resep</a> <button type="button" data-build-plan>Susun</button>',
              );
        document.querySelector('[data-build-plan]')?.addEventListener('click', async () => {
            const week = weekDates();
            const planned = store.data.plan.filter((item) => week.includes(item.date));
            if (!planned.length) {
                announce('Tambahkan menu di Rencana masak terlebih dahulu.');
                return;
            }
            if (store.data.basket.length && !(await confirmAction('Susun ulang bahan belanja?', 'Bahan dari resep sebelumnya diganti dengan menu minggu ini. Item yang ditambahkan manual tetap ada.', 'Susun daftar'))) return;
            const grouped = new Map();
            planned.filter((item) => !item.recipeId.startsWith('mr-')).forEach((item) => grouped.set(item.recipeId, (grouped.get(item.recipeId) || 0) + item.servings));
            if (!grouped.size) {
                announce('Bahan Mustika Rasa perlu ditambahkan manual.');
                return;
            }
            store.data.basket = [...grouped].map(([recipeId, servings]) => ({ recipeId, servings }));
            store.data.checked = [];
            if (save()) render();
            else announce('Daftar tersusun sementara. Penyimpanan browser dibatasi.');
        });
        document.querySelectorAll("[data-check]").forEach((input) =>
            input.addEventListener("change", () => {
                const key = input.dataset.check;
                store.data.checked = input.checked
                    ? [...store.data.checked, key]
                    : store.data.checked.filter((item) => item !== key);
                save();
                render();
                document
                    .querySelector(`[data-check="${CSS.escape(key)}"]`)
                    ?.focus();
            }),
        );
        document.querySelectorAll("[data-remove-item]").forEach((button) =>
            button.addEventListener("click", () => {
                store.data.manual = store.data.manual.filter(
                    (item) => item.id !== button.dataset.removeItem,
                );
                save("Bahan manual dihapus.");
                render();
            }),
        );
    };
    document
        .querySelector("#manual-item")
        .addEventListener("submit", (event) => {
            event.preventDefault();
            const status = document.querySelector("#manual-status");
            if (store.data.manual.length >= 100) {
                status.textContent =
                    "Daftar sudah berisi 100 bahan manual. Hapus bahan yang tidak diperlukan.";
                return;
            }
            const name = document.querySelector("#item-name").value.trim();
            const unit = document.querySelector("#item-unit").value.trim();
            if (!name || !unit) {
                status.textContent =
                    "Nama bahan dan satuan tidak boleh hanya berisi spasi.";
                return;
            }
            store.data.manual.push({
                id: uniqueId().replace("recipe-", "item-"),
                name,
                unit,
                quantity: Number(
                    document.querySelector("#item-quantity").value,
                ),
            });
            const saved = save();
            event.currentTarget.reset();
            status.textContent = saved
                ? "Bahan ditambahkan."
                : "Bahan ditambahkan untuk sesi ini. Penyimpanan dibatasi.";
            render();
            document.querySelector("#item-name").focus();
        });
    document
        .querySelector("#print-shopping")
        .addEventListener("click", () => window.print());
    document
        .querySelector("#clear-shopping")
        .addEventListener("click", async () => {
            if (!store.data.basket.length && !store.data.manual.length) {
                announce("Rencana belanja sudah dikosongkan.");
                return;
            }
            if (
                await confirmAction(
                    "Kosongkan Rencana belanja?",
                    "Semua bahan dan centang dihapus. Resep dan Rencana masak tetap tersimpan.",
                    "Kosongkan daftar",
                )
            ) {
                store.data.basket = [];
                store.data.manual = [];
                store.data.checked = [];
                save("Rencana belanja dikosongkan.");
                render();
            }
        });
    render();
}
function settings() {
    page(
        "Pengaturan",
        `<header class="page-heading"><h1>Pengaturan</h1></header><div class="settings-grid"><section class="panel"><h2>Tampilan</h2><div class="field">${themeControl().replace("<label", '<label class="visually-hidden"')}</div></section><section class="panel"><h2>Isi buku resepmu</h2><p>${store.data.recipes.length} resep pribadi, ${store.data.saved.length} favorit, ${store.data.plan.length} menu Rencana masak.</p><p class="small">Maksimal 30 resep pribadi.</p><a href="/resep">Buka buku resep</a></section><section class="panel wide"><h2>Cadangan koleksi</h2><p>Simpan cadangan sebagai JSON. Impor akan mengganti seluruh data di browser ini; tema tetap.</p><button type="button" data-export>Ekspor cadangan</button><label class="import-label" for="import-data">Impor cadangan Flavory (.json, maksimal 1 MB)</label><input id="import-data" type="file" accept="application/json,.json"><p id="import-result" role="status" aria-live="polite"></p></section><section class="panel wide"><h2>Hapus data di perangkat ini</h2><p>Resep pribadi, draft, favorit, menu, belanja, dan catatan akan dihapus. Ekspor cadangan terlebih dahulu.</p><button class="danger" type="button" id="reset-data">Hapus data Flavory</button></section></div>`,
    );
    bindTheme("flavory");
    bindBackup(store, () => {
        document.querySelector(".settings-grid .panel:nth-child(2) p").textContent =
            `${store.data.recipes.length} resep pribadi, ${store.data.saved.length} favorit, ${store.data.plan.length} menu Rencana masak.`;
    });
    document
        .querySelector("#reset-data")
        .addEventListener("click", async () => {
            if (
                await confirmAction(
                    "Hapus seluruh data Flavory?",
                    "Resep pribadi dan semua data di browser ini akan dihapus. File cadangan yang sudah kamu unduh tidak ikut terhapus.",
                )
            ) {
                if (store.reset()) {
                    settings();
                    announce(
                        "Data pribadi Flavory dihapus. Koleksi awal tetap tersedia.",
                    );
                }
            }
        });
}
function privacy() {
    page(
        "Data & privasi",
        `<div class="prose"><h1>Data & privasi</h1><p>Tanpa akun. Data buku masak tersimpan di browser ini.</p><h2>Data yang disimpan</h2><p>Resep, draft, favorit, menu, belanja, catatan, penilaian, riwayat memasak, dan tema disimpan lewat localStorage.</p><h2>Tidak otomatis pindah perangkat</h2><p>Data hanya tersedia di browser dan alamat situs ini. Menghapus data situs atau memakai mode privat bisa menghilangkannya. Gunakan cadangan untuk pindah perangkat.</p><h2>Berbagi dengan sengaja</h2><p>File satu resep tidak menyertakan catatan dan penilaian pribadi. Cadangan lengkap memuat keduanya; periksa sebelum membagikannya.</p><h2>Koleksi awal dan keamanan memasak</h2><p>Resep bawaan ditulis sebagai pengantar penggunaan Flavory; foto merupakan ilustrasi dari repository awal. Durasi dan takaran adalah perkiraan, bukan hasil uji dapur atau rekomendasi medis. Periksa alergen pada bahan dan kemasan, jaga kebersihan, serta sesuaikan kematangan dan bumbu dengan kebutuhanmu.</p><h2>Jejak kunjungan</h2><p>Tanpa analytics, iklan, atau pelacak. Isi buku masak tidak dikirim ke server. Hosting dapat menyimpan log kunjungan, termasuk alamat IP dan waktu akses.</p><a class="button" href="/pengaturan">Kelola data Flavory</a></div>`,
    );
}
function notFound() {
    page(
        "Resep tidak ditemukan",
        emptyState(
            "Resep ini belum ada di buku ini.",
            "Resep pribadi hanya tersedia di browser tempat resep itu disimpan. Impor file resep atau pilih dari katalog.",
            '<a class="button primary" href="/resep">Buka katalog resep</a> <a class="button" href="/resep">Buku resep</a>',
        ),
    );
}
try {
    const segments = location.pathname.split("/").filter(Boolean);
    if (!segments.length) home();
    else if (segments[0] === 'mustika-rasa' && !segments[1] && !new URLSearchParams(location.search).has('halaman')) catalog();
    else if (segments[0] === "mustika-rasa") {
        import('./mustikarasa.js').then(({ renderMustikarasa }) => renderMustikarasa({ page, id: segments[1], bindSaveButtons, isSaved })).catch((error) => {
            console.error(error);
            page('Buku belum terbuka', '<h1>Buku belum bisa dibuka.</h1><a href="/mustika-rasa">Coba lagi</a>');
        });
    }
    else if (segments[0] === "resep" && !segments[1]) catalog();
    else if (segments[0] === "resep" && segments[1] === "baru") recipeForm();
    else if (segments[0] === "resep" && segments[2] === "edit")
        recipeForm(segments[1]);
    else if (segments[0] === "resep") recipeDetail(segments[1]);
    else if (segments[0] === "koleksi") library();
    else if (segments[0] === "rencana") planner();
    else if (segments[0] === "belanja") shopping();
    else if (segments[0] === "pengaturan") settings();
    else if (segments[0] === "privasi") privacy();
    else notFound();
} catch (error) {
    console.error(error);
    page(
        "Buku masak belum terbuka",
        emptyState(
            "Buku masak belum bisa dibuka.",
            "Muat ulang halaman. Bila masih bermasalah, pulihkan cadangan melalui pengaturan data.",
            '<a class="button" href="/">Muat ulang beranda</a> <a class="button" href="/pengaturan">Pengaturan data</a>',
        ),
    );
}
