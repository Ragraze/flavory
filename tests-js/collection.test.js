import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, validate } from '../resources/js/model.js';
import { archiveRecipe, recipeGroup, searchText } from '../resources/js/collection.js';
import { readFileSync } from 'node:fs';

test('archive favorites survive backup validation without allowing invalid ids', () => {
    const data = { ...structuredClone(defaults), saved: ['mr-c24e640dcf3f', 'mr-invalid', 'unknown'] };
    assert.deepEqual(validate(data).saved, ['mr-c24e640dcf3f']);
});

test('archive search includes paragraph ingredients and filling ingredients after the first method', () => {
    const book = JSON.parse(readFileSync(new URL('../public/data/mustikarasa.json', import.meta.url)));
    const aron = archiveRecipe(book.recipes.find((recipe) => recipe.id === 'mr-a5a28cfe2786'));
    const arem = archiveRecipe(book.recipes.find((recipe) => recipe.id === 'mr-8d9b155f2a91'));
    assert.ok(searchText(aron.searchContent).includes(searchText('jagung')));
    assert.ok(searchText(arem.searchContent).includes(searchText('bawang')));
});

test('historical recipes use existing category images and preserve quantities as source text', () => {
    assert.equal(recipeGroup('KUE TALAM'), 'Kue & camilan');
    assert.equal(recipeGroup('SAJUR ASAM'), 'Sayuran');
    assert.equal(recipeGroup('ES TJAMPUR'), 'Minuman');
    const recipe = archiveRecipe({ id: 'mr-c24e640dcf3f', title: 'KUE TALAM', pages: [1], blocks: [{ kind: 'row', cells: ['tepung', '½ kg.', 'kelapa', '1 btr.'] }] });
    assert.equal(recipe.minutes, undefined);
    assert.equal(recipe.servings, undefined);
    assert.equal(recipe.ingredients[0].unit, '½ kg.');
    assert.ok(recipe.image.startsWith('/img/'));
    assert.equal(searchText('sajur ajam'), searchText('sayur ayam'));
});
