import { escapeHTML as e } from './common.js';
import { loadBook, archiveRecipe } from './collection.js';

const sourceURL = (page) => `https://id.wikisource.org/wiki/Halaman:Mustikarasa.pdf/${page}`;

export function renderBookBlocks(blocks) {
    let list = false;
    let markup = '';
    for (const block of blocks) {
        if (block.kind === 'step') {
            if (!list) markup += '<ol class="book-steps">';
            list = true;
            markup += `<li>${e(block.text)}</li>`;
            continue;
        }
        if (list) { markup += '</ol>'; list = false; }
        if (block.kind === 'row') markup += `<div class="book-row">${block.cells.map((cell) => `<span>${e(cell)}</span>`).join('')}</div>`;
        else if (block.kind === 'heading') markup += `<h2>${e(block.text)}</h2>`;
        else markup += `<p>${e(block.text)}</p>`;
    }
    return markup + (list ? '</ol>' : '');
}

export async function renderMustikarasa({ page: renderPage, id, bindSaveButtons, isSaved }) {
    const page = (title, body, className = '') => renderPage(title, body, `book-page ${className}`);
    page('Mustika Rasa', '<p role="status">Membuka resep…</p>');
    try {
        const book = await loadBook();
        const pageNumber = Number(new URLSearchParams(location.search).get('halaman'));
        if (!id) {
            const leaf = book.pages.find((item) => item.page === pageNumber);
            if (!leaf) return page('Halaman tidak ditemukan', '<h1>Halaman tidak ditemukan.</h1><a href="/resep">Kembali ke buku resep</a>');
            page(`Mustika Rasa · halaman ${pageNumber}`, `<h1>Halaman pindai ${pageNumber}</h1><div class="book-reading">${leaf.blocks.length ? renderBookBlocks(leaf.blocks) : '<p>Halaman ini berupa gambar. Buka pindai melalui tautan sumber.</p>'}</div><nav class="book-pagination" aria-label="Halaman buku">${pageNumber > 1 ? `<a class="button" href="?halaman=${pageNumber - 1}">Sebelumnya</a>` : ''}<a href="${sourceURL(pageNumber)}?oldid=${leaf.revision}" target="_blank" rel="noopener noreferrer">Lihat sumber</a>${pageNumber < book.pages.length ? `<a class="button" href="?halaman=${pageNumber + 1}">Berikutnya</a>` : ''}</nav>`, 'narrow');
            return;
        }
        const recipe = book.recipes.find((item) => item.id === id);
        if (!recipe) return page('Resep tidak ditemukan', '<h1>Resep tidak ditemukan.</h1><a href="/resep">Kembali ke buku resep</a>');
        const first = recipe.pages[0];
        const display = archiveRecipe(recipe);
        const methodStart = recipe.blocks.findIndex((block) => block.kind === 'heading' && /(?:tjara|cara|membuat|memasak)/i.test(block.text));
        const stepStart = recipe.blocks.findIndex((block) => block.kind === 'step');
        const split = methodStart >= 0 ? methodStart : stepStart;
        const ingredients = split >= 0 ? recipe.blocks.slice(0, split) : [];
        const method = split >= 0 ? recipe.blocks.slice(split) : recipe.blocks;
        page(recipe.title, `<div class="recipe-intro archive-intro"><header><h1>${e(recipe.title)}</h1><div class="meta"><span>${e(display.category)}</span><span>Halaman ${recipe.pages.join(', ')}</span><span>Satuan asli</span></div><div class="actions"><button type="button" class="save-button" data-save="${id}" data-title="${e(recipe.title)}" aria-pressed="${isSaved(id)}" aria-label="${isSaved(id) ? 'Lepas' : 'Simpan'} ${e(recipe.title)}">${isSaved(id) ? 'Tersimpan' : 'Simpan resep'}</button><button type="button" id="print-book">Cetak resep</button></div><p><a href="/mustika-rasa?halaman=${first}">Baca halaman buku</a></p></header><figure class="recipe-detail-photo archive-photo"><img src="${display.image}" alt="${e(display.imageAlt)}" width="600" height="400"><figcaption>Ilustrasi kelompok makanan.</figcaption></figure></div><div class="recipe-body archive-body"><section class="panel"><h2>Siapkan bahannya</h2><div class="book-reading">${ingredients.length ? renderBookBlocks(ingredients) : '<p class="muted">Bahan tercantum bersama langkah pada teks sumber.</p>'}</div></section><section><h2>Cara memasak</h2><div class="book-reading">${renderBookBlocks(method)}</div></section></div>`);
        document.querySelector('#print-book').addEventListener('click', () => window.print());
        bindSaveButtons();
    } catch (error) {
        console.error(error);
        page('Resep belum terbuka', '<h1>Resep belum bisa dibuka.</h1><p>Periksa koneksi lalu coba lagi.</p><a class="button" href="/resep">Buku resep</a>');
    }
}
