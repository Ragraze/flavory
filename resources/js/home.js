import { starterRecipes } from './recipes.js';
import { collectionCategories } from './collection.js';
import { weekDates, localDate } from './model.js';
import { escapeHTML as e, normalize } from './common.js';

export function renderHome({ page, store, recipes, card, bindSaveButtons }) {
    const week = weekDates();
    const planned = store.data.plan.filter((item) => week.includes(item.date));
    const categoryPhotos = [starterRecipes[1].image, '/img/messageImage_1685092800868.jpg', starterRecipes[2].image, '/img/messageImage_1685092701658.jpg', starterRecipes[3].image];
    const pantryChoices = ['Tomat', 'Telur', 'Alpukat', 'Semangka', 'Bawang putih', 'Selada'];
    page('Beranda', `
        <section class="home-hero" aria-labelledby="kitchen-heading">
            <div class="home-hero-inner">
            <div class="home-hero-copy"><h1 id="kitchen-heading">Hari ini,<br>masak apa?</h1><div class="actions"><a class="button primary" href="/resep">Buka buku resep</a><a class="button hero-pantry-link" href="#dari-bahan">Cari dari bahanmu</a></div></div>
            <div class="hero-carousel" role="region" aria-roledescription="carousel" aria-label="Resep harian"><div class="hero-slides" aria-live="off">${starterRecipes.map((recipe, index) => `<figure class="home-hero-photo" role="group" aria-roledescription="slide" aria-label="${index + 1} dari ${starterRecipes.length}" ${index ? 'hidden' : ''}><a href="/resep/${recipe.id}" aria-label="Buka resep ${e(recipe.title)}"><img src="${recipe.image}" width="450" height="450" alt="${e(recipe.imageAlt)}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}></a><figcaption><a href="/resep/${recipe.id}">${e(recipe.title)}</a><span>${recipe.minutes} menit · ${recipe.servings} porsi</span></figcaption></figure>`).join('')}</div></div>
            </div>

        </section>
        <section class="home-section home-category-section" aria-labelledby="category-heading"><div class="home-section-heading"><h2 id="category-heading">Kategori</h2><a href="/resep">Semua resep</a></div><nav class="home-categories" aria-label="Kategori resep">${collectionCategories.map((category, index) => `<a class="home-category" href="/resep?category=${encodeURIComponent(category)}"><img src="${categoryPhotos[index]}" alt="" width="104" height="104" loading="lazy"><span>${category}</span></a>`).join('')}</nav></section>

        <section class="home-section home-recipes" id="pilihan-hari-ini" aria-labelledby="recipe-heading"><div class="home-section-heading"><h2 id="recipe-heading">Resep harian</h2></div><div class="recipe-grid">${starterRecipes.map((recipe) => card(recipe)).join('')}</div></section>
        <section class="home-section home-planner" aria-labelledby="meal-heading"><div><h2 id="meal-heading">Rencana masak</h2><p class="week-preview-heading">${planned.length} menu</p><div class="actions"><a class="button primary" href="/rencana">Rencana masak</a><a class="button" href="/belanja">Rencana belanja</a></div></div><div class="week-preview" aria-label="Ringkasan rencana minggu ini">${week.map((date) => {
            const count = planned.filter((item) => item.date === date).length;
            return `<div class="week-preview-day ${date === localDate() ? 'is-today' : ''}"><span>${new Intl.DateTimeFormat('id', { weekday: 'short' }).format(new Date(`${date}T12:00:00`))}</span><strong>${Number(date.slice(-2))}</strong><small>${count ? `${count} menu` : ''}</small></div>`;
        }).join('')}</div></section>
        <section class="home-section pantry-disclosure" id="dari-bahan" aria-labelledby="pantry-heading"><h2 id="pantry-heading">Cari dari bahan di dapur</h2><div class="pantry-finder"><div class="pantry-intro"><div class="pantry-options" role="group" aria-label="Pilih bahan yang tersedia">${pantryChoices.map((ingredient) => `<button type="button" aria-pressed="false" data-pantry="${ingredient}">${ingredient}</button>`).join('')}</div><form id="pantry-form"><label for="pantry-custom">Bahan lain</label><div class="pantry-add-line"><input id="pantry-custom" maxlength="40" placeholder="Jagung, keju…"><button type="submit">Tambahkan bahan</button></div><p id="pantry-hint" class="small muted" role="status">Maksimal 8 bahan.</p></form><div id="pantry-selected" class="pantry-selected" aria-label="Bahan tambahan"></div><button type="button" id="clear-pantry" class="pantry-clear">Hapus pilihan bahan</button></div><div class="pantry-results"><p id="pantry-status" role="status" aria-live="polite"></p><div id="pantry-matches"></div></div></div></section>
    `, 'home-page');
    bindSaveButtons();
    let heroIndex = 0;
    const slides = [...document.querySelectorAll('.hero-slides > figure')];
    const carousel = document.querySelector('.hero-carousel');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const heroTimer = setInterval(async () => {
        if (!carousel.isConnected) { clearInterval(heroTimer); return; }
        if (document.hidden || reducedMotion.matches || carousel.matches(':hover, :focus-within')) return;
        const previous = slides[heroIndex];
        heroIndex = (heroIndex + 1) % slides.length;
        const next = slides[heroIndex];
        next.hidden = false;
        previous.inert = true;
        const timing = { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
        const outgoing = previous.animate([
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(-40px)' },
        ], timing);
        const incoming = next.animate([
            { opacity: 0, transform: 'translateX(40px)' },
            { opacity: 1, transform: 'translateX(0)' },
        ], timing);
        await Promise.allSettled([outgoing.finished, incoming.finished]);
        previous.hidden = true;
        previous.inert = false;
    }, 5000);
    const selected = new Map();
    const custom = new Set();
    const hint = document.querySelector('#pantry-hint');
    const setHint = (message = 'Maksimal 8 bahan.') => { hint.textContent = message; };
    const renderPantry = () => {
        const found = recipes().filter((recipe) => [...selected.keys()].every((ingredient) => recipe.ingredients.some((item) => normalize(item.name).includes(ingredient))));
        document.querySelector('#pantry-status').textContent = selected.size ? `${found.length} resep memuat ${[...selected.values()].join(', ')}.` : 'Ide dari resep harian.';
        document.querySelector('#pantry-selected').innerHTML = [...custom].filter((key) => selected.has(key)).map((key) => `<button type="button" class="pantry-chip" data-pantry-remove="${e(key)}" aria-label="Hapus bahan ${e(selected.get(key))}">${e(selected.get(key))}<span aria-hidden="true">×</span></button>`).join('');
        document.querySelector('#pantry-matches').innerHTML = found.length ? found.slice(0, 3).map((recipe) => `<article class="pantry-match"><img src="${e(recipe.image)}" alt="" width="56" height="56" loading="lazy"><div><h3><a href="/resep/${recipe.id}">${e(recipe.title)}</a></h3><p>${recipe.minutes} menit · ${e(recipe.category)}</p></div></article>`).join('') : '<div class="pantry-empty"><h3>Belum ada kombinasi yang cocok.</h3><p>Kurangi pilihan bahan atau tulis resep sendiri.</p><a href="/resep/baru">Tulis resep</a></div>';
        document.querySelectorAll('[data-pantry]').forEach((button) => button.setAttribute('aria-pressed', String(selected.has(normalize(button.dataset.pantry)))));
        document.querySelector('#clear-pantry').disabled = !selected.size;
    };
    const addCustom = (raw) => {
        const label = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
        const key = normalize(label);
        if (key.length < 2) { setHint('Tulis nama bahan minimal 2 huruf.'); return false; }
        if (selected.has(key)) { setHint(`${selected.get(key)} sudah ada di pilihanmu.`); return false; }
        if (selected.size >= 8) { setHint('Maksimal 8 bahan.'); return false; }
        selected.set(key, label.charAt(0).toLocaleUpperCase('id') + label.slice(1));
        custom.add(key); renderPantry(); setHint(`${selected.get(key)} ditambahkan ke pilihanmu.`); return true;
    };
    document.querySelectorAll('[data-pantry]').forEach((button) => button.addEventListener('click', () => {
        const key = normalize(button.dataset.pantry);
        if (selected.has(key)) { selected.delete(key); custom.delete(key); }
        else {
            if (selected.size >= 8) { setHint('Maksimal 8 bahan.'); return; }
            selected.set(key, button.dataset.pantry); custom.delete(key);
        }
        renderPantry(); setHint();
    }));
    document.querySelector('#pantry-form').addEventListener('submit', (event) => {
        event.preventDefault(); const input = document.querySelector('#pantry-custom');
        if (addCustom(input.value)) input.value = '';
    });
    document.querySelector('#pantry-selected').addEventListener('click', (event) => {
        const chip = event.target.closest('[data-pantry-remove]'); if (!chip) return;
        selected.delete(chip.dataset.pantryRemove); custom.delete(chip.dataset.pantryRemove); renderPantry(); setHint();
    });
    document.querySelector('#clear-pantry').addEventListener('click', () => { selected.clear(); custom.clear(); renderPantry(); setHint(); });
    renderPantry();
}
