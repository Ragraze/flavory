import { starterRecipes, categories, seedIds } from "./recipes.js";
import { isRecord, boundedText, normalize } from "./common.js";

export const defaults = {
    recipes: [],
    saved: [],
    plan: [],
    basket: [],
    manual: [],
    checked: [],
    notes: {},
    ratings: {},
    cooked: {},
    draft: null,
};
export const uniqueId = () =>
    `recipe-${crypto.randomUUID?.() || [...crypto.getRandomValues(new Uint8Array(16))].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
export const idPattern = /^recipe-[a-z0-9-]{6,60}$/;
export const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const finite = (n, min, max) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const isoDate = (value) =>
    typeof value === "string" &&
    datePattern.test(value) &&
    new Date(`${value}T12:00:00`).toString() !== "Invalid Date" &&
    localDate(new Date(`${value}T12:00:00`)) === value;
const safeImages = new Set(starterRecipes.map((recipe) => recipe.image));
export function cleanRecipe(value, strict = true) {
    if (!isRecord(value)) throw new Error("Struktur resep tidak valid.");
    if (
        strict &&
        (!finite(value.minutes, 1, 240) ||
            !Number.isInteger(value.minutes) ||
            !finite(value.servings, 1, 24) ||
            !Number.isInteger(value.servings))
    )
        throw new Error(
            "Waktu harus 1–240 menit dan porsi harus bilangan bulat 1–24.",
        );
    if (
        strict &&
        (!Array.isArray(value.ingredients) ||
            value.ingredients.length > 20 ||
            value.ingredients.some(
                (item) =>
                    !isRecord(item) || !finite(item.quantity, 0.01, 10000),
            ))
    )
        throw new Error(
            "Gunakan maksimal 20 bahan dengan jumlah positif yang valid.",
        );
    if (
        strict &&
        (!Array.isArray(value.steps) ||
            value.steps.length > 16 ||
            value.steps.some(
                (step) => typeof step !== "string" || step.length > 600,
            ))
    )
        throw new Error(
            "Gunakan maksimal 16 langkah, masing-masing maksimal 600 karakter.",
        );
    const result = {
        id: idPattern.test(value.id) ? value.id : "",
        title: boundedText(value.title, 120),
        description: boundedText(value.description, 600),
        category: categories.includes(value.category)
            ? value.category
            : categories[0],
        minutes: finite(value.minutes, 1, 240) ? Math.round(value.minutes) : 15,
        servings: finite(value.servings, 1, 24)
            ? Math.round(value.servings)
            : 2,
        image: safeImages.has(value.image) ? value.image : "",
        imageAlt: safeImages.has(value.image)
            ? boundedText(value.imageAlt, 150)
            : "",
        tip: boundedText(value.tip, 600),
        tags: [],
        ingredients: Array.isArray(value.ingredients)
            ? value.ingredients
                  .slice(0, 20)
                  .filter(isRecord)
                  .map((item) => ({
                      name: boundedText(item.name, 100),
                      quantity: finite(item.quantity, 0.01, 10000)
                          ? item.quantity
                          : 1,
                      unit: boundedText(item.unit, 20),
                  }))
            : [],
        steps: Array.isArray(value.steps)
            ? value.steps
                  .slice(0, 16)
                  .filter((step) => typeof step === "string")
                  .map((step) => step.trim().slice(0, 600))
            : [],
    };
    if (
        strict &&
        (!result.id ||
            !result.title ||
            !result.description ||
            !result.ingredients.length ||
            result.ingredients.some((item) => !item.name || !item.unit) ||
            !result.steps.length ||
            result.steps.some((step) => !step))
    )
        throw new Error(
            "Resep harus memiliki judul, deskripsi, bahan dengan satuan, dan langkah yang lengkap.",
        );
    return result;
}
export function validate(data) {
    if (
        !isRecord(data) ||
        !Array.isArray(data.recipes) ||
        !Array.isArray(data.saved) ||
        !Array.isArray(data.plan) ||
        !Array.isArray(data.basket) ||
        !Array.isArray(data.manual) ||
        !Array.isArray(data.checked) ||
        !isRecord(data.notes)
    )
        throw new Error(
            "Struktur cadangan Flavory tidak valid. Data saat ini tetap aman.",
        );
    if (data.recipes.length > 30)
        throw new Error("Satu buku resep mendukung maksimal 30 resep pribadi.");
    const recipes = data.recipes.map((recipe) => cleanRecipe(recipe));
    if (new Set(recipes.map((recipe) => recipe.id)).size !== recipes.length)
        throw new Error("Cadangan berisi ID resep duplikat.");
    const ids = new Set([...seedIds, ...recipes.map((recipe) => recipe.id)]);
    const mapping = (value, filter, transform) =>
        isRecord(value)
            ? Object.fromEntries(
                  Object.entries(value)
                      .filter(([key, item]) => ids.has(key) && filter(item))
                      .map(([key, item]) => [key, transform(item)]),
              )
            : {};
    return {
        recipes,
        saved: [...new Set(data.saved.filter((id) => ids.has(id) || (typeof id === 'string' && /^mr-[a-f0-9]{12}$/.test(id))))],
        plan: data.plan
            .slice(0, 180)
            .filter(
                (item) =>
                    isRecord(item) &&
                    (ids.has(item.recipeId) || (typeof item.recipeId === 'string' && /^mr-[a-f0-9]{12}$/.test(item.recipeId))) &&
                    isoDate(item.date) &&
                    ["Pagi", "Siang", "Malam"].includes(item.slot) &&
                    finite(item.servings, 1, 24),
            )
            .map((item) => ({
                recipeId: item.recipeId,
                date: item.date,
                slot: item.slot,
                servings: Math.round(item.servings),
            }))
            .filter(
                (item, i, all) =>
                    all.findIndex(
                        (other) =>
                            other.date === item.date &&
                            other.slot === item.slot,
                    ) === i,
            ),
        basket: data.basket
            .slice(0, 80)
            .filter(
                (item) =>
                    isRecord(item) &&
                    ids.has(item.recipeId) &&
                    finite(item.servings, 1, 10000),
            )
            .map((item) => ({
                recipeId: item.recipeId,
                servings: item.servings,
            })),
        manual: data.manual
            .slice(0, 100)
            .filter(
                (item) =>
                    isRecord(item) &&
                    typeof item.id === "string" &&
                    /^item-[a-z0-9-]{6,60}$/.test(item.id) &&
                    boundedText(item.name, 100) &&
                    finite(item.quantity, 0.01, 10000),
            )
            .map((item) => ({
                id: item.id,
                name: boundedText(item.name, 100),
                quantity: item.quantity,
                unit: boundedText(item.unit, 20) || "buah",
            })),
        checked: [
            ...new Set(
                data.checked.filter(
                    (key) => typeof key === "string" && key.length < 180,
                ),
            ),
        ].slice(0, 800),
        notes: mapping(
            data.notes,
            (item) => typeof item === "string",
            (item) => item.slice(0, 2000),
        ),
        ratings: mapping(
            data.ratings,
            (item) => Number.isInteger(item) && item >= 1 && item <= 5,
            (item) => item,
        ),
        cooked: mapping(
            data.cooked,
            (item) =>
                typeof item === "string" &&
                item.length < 40 &&
                Number.isFinite(Date.parse(item)),
            (item) => item,
        ),
        draft: isRecord(data.draft)
            ? {
                  ...cleanRecipe(data.draft, false),
                  editing: idPattern.test(data.draft.editing)
                      ? data.draft.editing
                      : null,
              }
            : null,
    };
}
export function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function weekDates(value) {
    const date = isoDate(value) ? new Date(`${value}T12:00:00`) : new Date();
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
        const item = new Date(date);
        item.setDate(date.getDate() + i);
        return localDate(item);
    });
}
export function amount(value) {
    return new Intl.NumberFormat("id", { maximumFractionDigits: 2 }).format(
        value,
    );
}
export function shoppingItems(data, recipes) {
    const grouped = new Map();
    for (const entry of data.basket) {
        const recipe = recipes.find((recipe) => recipe.id === entry.recipeId);
        if (!recipe) continue;
        for (const ingredient of recipe.ingredients) {
            const key = `${normalize(ingredient.name)}|${normalize(ingredient.unit)}`;
            const current = grouped.get(key) || {
                ...ingredient,
                key,
                quantity: 0,
            };
            current.quantity +=
                (ingredient.quantity * entry.servings) / recipe.servings;
            grouped.set(key, current);
        }
    }
    return [
        ...grouped.values(),
        ...data.manual.map((item) => ({ ...item, key: item.id, manual: true })),
    ].sort((a, b) => a.name.localeCompare(b.name, "id"));
}
