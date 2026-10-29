import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const book = JSON.parse(readFileSync(new URL('../public/data/mustikarasa.json', import.meta.url)));

test('archive retains every source page and unique stable recipe IDs', () => {
    assert.equal(book.pages.length, 1215);
    assert.deepEqual(book.pages.map((page) => page.page), Array.from({ length: 1215 }, (_, i) => i + 1));
    assert.ok(book.recipes.length > 1500);
    assert.equal(new Set(book.recipes.map((recipe) => recipe.id)).size, book.recipes.length);
    for (const recipe of book.recipes) {
        assert.match(recipe.id, /^mr-[a-f0-9]{12}$/);
        assert.ok(recipe.title.trim());
        assert.ok(recipe.pages.every((page) => page >= 1 && page <= 1215));
        assert.ok(recipe.blocks.length);
    }
});

test('recipe sections join continuations across pages without altering historical units', () => {
    const recipe = book.recipes.find((item) => item.title === 'GULAI BAGAR');
    assert.ok(recipe.pages.includes(230));
    assert.ok(recipe.pages.includes(231));
    const text = JSON.stringify(recipe.blocks);
    assert.match(text, /daging empuk/);
    assert.match(text, /santan/);
    assert.doesNotMatch(text, /<section|<noinclude|\{\{c\|/);
});
