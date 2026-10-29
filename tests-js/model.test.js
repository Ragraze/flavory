import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, validate, cleanRecipe, shoppingItems, weekDates } from '../resources/js/model.js';
import { starterRecipes } from '../resources/js/recipes.js';

test('shopping combines equal ingredients and scales by portions', () => {
    const data = structuredClone(defaults);
    data.basket = [{ recipeId: 'pasta-tomat-bawang', servings: 4 }, { recipeId: 'pasta-tomat-bawang', servings: 2 }];
    const items = shoppingItems(data, starterRecipes);
    assert.equal(items.find(item => item.name === 'Pasta kering').quantity, 540);
    assert.equal(items.filter(item => item.name === 'Pasta kering').length, 1);
    data.basket = [{ recipeId: 'pasta-tomat-bawang', servings: 504 }];
    assert.equal(validate(data).basket[0].servings, 504);
});

test('imports reject malformed recipes, duplicate ids and foreign image URLs', () => {
    assert.throws(() => validate({}), /Struktur cadangan/);
    const recipe = { ...starterRecipes[0], id: 'recipe-abcdef123', image: 'https://attacker.invalid/pixel.png' };
    assert.equal(cleanRecipe(recipe).image, '');
    assert.throws(() => cleanRecipe({ ...recipe, steps: [] }), /langkah/);
    assert.throws(() => cleanRecipe({ ...recipe, servings: 0 }), /porsi/);
    assert.throws(() => cleanRecipe({ ...recipe, ingredients: [{ name: 'Garam', quantity: -5, unit: 'g' }] }), /jumlah positif/);
    assert.throws(() => validate({ ...structuredClone(defaults), recipes: [recipe, recipe] }), /duplikat/);
});

test('orphan meal entries and invalid dates are discarded', () => {
    const data = structuredClone(defaults);
    data.plan = [
        { recipeId: 'pasta-tomat-bawang', date: '2026-02-30', slot: 'Pagi', servings: 2 },
        { recipeId: 'does-not-exist', date: '2026-10-28', slot: 'Pagi', servings: 2 },
        { recipeId: 'pasta-tomat-bawang', date: '2026-10-28', slot: 'Pagi', servings: 2 },
    ];
    assert.equal(validate(data).plan.length, 1);
    assert.deepEqual(weekDates('2026-10-28'), ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
});
