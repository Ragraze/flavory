import { normalize } from './common.js';

export const collectionCategories = ['Sarapan', 'Hidangan utama', 'Sayuran', 'Kue & camilan', 'Minuman'];
const photos = {
    Sarapan: '/img/messageImage_1685092807648.jpg',
    'Hidangan utama': '/img/messageImage_1685092800868.jpg',
    Sayuran: '/img/messageImage_1685199797861.jpg',
    'Kue & camilan': '/img/messageImage_1685092701658.jpg',
    Minuman: '/img/messageImage_1685092812795.jpg',
};

export function recipeGroup(title) {
    const name = normalize(title);
    if (/^(es |wedang|serbat|sirup|sari |djus|kopi|teh |air |minuman|sekoteng|badjeg|bir |tjao)/.test(name)) return 'Minuman';
    if (/kue|kwee|bolu|dodol|wajik|wajit|lapis|klepon|onde|djenang|dodol|getuk|gethuk|putu|serabi|surabi|lepat|lemper|apem|biskuit|krupuk|kerupuk|keripik|rempejek|pisang goreng/.test(name)) return 'Kue & camilan';
    if (/^(sajur|sayur|urap|lalab|lalap|lotek|gado|petjel|pecel|salad|tumis|oseng|gudeg|kangkung|terong|terung)/.test(name)) return 'Sayuran';
    if (/^(bubur|roti|nasi uduk|nasi gurih|nasi kuning|ketupat|lontong)/.test(name)) return 'Sarapan';
    return 'Hidangan utama';
}

export function archiveRecipe(entry) {
    const firstPage = entry.pages[0];
    // The book's Djadjanan and Minuman chapters start at scan pages 801 and 1147.
    const category = firstPage >= 1147 ? 'Minuman' : firstPage >= 801 ? 'Kue & camilan' : recipeGroup(entry.title);
    const ingredients = [];
    for (const block of entry.blocks) {
        if (block.kind === 'heading' && /tjara|cara/i.test(block.text)) break;
        if (block.kind !== 'row') continue;
        for (let index = 0; index + 1 < block.cells.length; index += 2) {
            ingredients.push({ name: block.cells[index], unit: block.cells[index + 1] });
        }
    }
    const searchContent = entry.blocks.map((block) => block.text || block.cells.join(' ')).join(' ');
    return { ...entry, category, ingredients, searchContent, archive: true, image: photos[category],
        imageAlt: `Ilustrasi kelompok ${category.toLocaleLowerCase('id')}`, description: 'Mustika Rasa · 1967', tags: ['Mustika Rasa'] };
}

export const searchText = (text) => normalize(text).replace(/dj/g, 'j').replace(/tj/g, 'c').replace(/nj/g, 'ny').replace(/sj/g, 'sy').replace(/ch/g, 'kh').replace(/j/g, 'y');

let bookPromise;
export function loadBook() {
    if (!bookPromise) {
        bookPromise = fetch('/data/mustikarasa.json', { signal: AbortSignal.timeout(12000) }).then((response) => {
            if (!response.ok) throw new Error('Koleksi Mustika Rasa belum bisa dimuat.');
            return response.json();
        }).catch((error) => { bookPromise = undefined; throw error; });
    }
    return bookPromise;
}
