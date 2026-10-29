export const escapeHTML = (value) =>
    String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[char],
    );
export const normalize = (value) =>
    String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("id")
        .trim();
export const shortDate = (value) =>
    new Intl.DateTimeFormat("id", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
export const isRecord = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);
export const boundedText = (value, max = 500) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";
let announcementTimer;

export function announce(message) {
    const region = document.querySelector("#announcement");
    region.textContent = message;
    region.classList.add("visible");
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(
        () => region.classList.remove("visible"),
        6000,
    );
}

export function storageWarning(message) {
    const warning = document.querySelector("#storage-warning");
    warning.hidden = false;
    warning.replaceChildren(document.createTextNode(message + " "));
    const backup = document.createElement("button");
    backup.type = "button";
    backup.textContent = "Ekspor data sesi ini";
    backup.addEventListener("click", () =>
        window.dispatchEvent(new CustomEvent("export-session")),
    );
    warning.append(backup, document.createTextNode(" "));
    const link = document.createElement("a");
    link.href = "/pengaturan";
    link.textContent = "Buka pengaturan data";
    warning.append(link);
}

export function createStore(app, defaults, validate) {
    const key = `${app}-data-v1`;
    let value = structuredClone(defaults);
    let persistent = true;
    let blocked = false;
    let lastRaw = null;
    try {
        const raw = localStorage.getItem(key);
        lastRaw = raw;
        if (raw !== null) {
            const parsed = JSON.parse(raw);
            if (!isRecord(parsed) || parsed.version !== 1)
                throw new Error("Format data tidak dikenali");
            value = validate(parsed.data);
        }
    } catch {
        persistent = false;
        blocked = true;
        storageWarning(
            "Data tersimpan tidak bisa dibaca atau penyimpanan dibatasi. Data lama tidak ditimpa; perubahan sesi ini bersifat sementara.",
        );
    }
    return {
        get data() {
            return value;
        },
        get persistent() {
            return persistent;
        },
        save(next = value) {
            value = validate(next);
            if (blocked) return false;
            try {
                if (localStorage.getItem(key) !== lastRaw) {
                    blocked = true;
                    persistent = false;
                    storageWarning(
                        "Data berubah di tab lain. Ekspor perubahan sesi ini lalu muat ulang sebelum mengedit lagi.",
                    );
                    return false;
                }
                const serialized = JSON.stringify({ version: 1, data: value });
                localStorage.setItem(key, serialized);
                lastRaw = serialized;
                persistent = true;
                return true;
            } catch {
                persistent = false;
                storageWarning(
                    "Browser tidak bisa menyimpan perubahan. Ekspor cadangan sebelum menutup halaman.",
                );
                return false;
            }
        },
        reset() {
            try {
                localStorage.removeItem(key);
                lastRaw = null;
                blocked = false;
                value = structuredClone(defaults);
                return this.save();
            } catch {
                storageWarning(
                    "Browser menolak penghapusan data. Hapus data situs melalui pengaturan browser.",
                );
                return false;
            }
        },
        export() {
            download(
                `${app}-cadangan-${new Date().toISOString().slice(0, 10)}.json`,
                {
                    app,
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    data: value,
                },
            );
        },
        async import(file) {
            if (!file || file.size > 1_000_000)
                throw new Error("Pilih file JSON berukuran maksimal 1 MB.");
            let parsed;
            try {
                parsed = JSON.parse(await file.text());
            } catch {
                throw new Error(
                    "File bukan JSON yang valid. Pilih cadangan yang diekspor dari aplikasi ini.",
                );
            }
            if (!isRecord(parsed) || parsed.app !== app || parsed.version !== 1)
                throw new Error(
                    "File ini bukan cadangan yang sesuai untuk aplikasi ini.",
                );
            const replacement = validate(parsed.data);
            blocked = false;
            try {
                lastRaw = localStorage.getItem(key);
            } catch {
                lastRaw = null;
            }
            return this.save(replacement);
        },
        key,
    };
}

export function download(filename, content) {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function confirmAction(title, message, label = "Hapus") {
    const dialog = document.querySelector("#confirm-dialog");
    dialog.querySelector("#dialog-title").textContent = title;
    dialog.querySelector("#dialog-message").textContent = message;
    const confirm = dialog.querySelector('[data-dialog="confirm"]');
    const cancel = dialog.querySelector('[data-dialog="cancel"]');
    confirm.textContent = label;
    return new Promise((resolve) => {
        const finish = (result) => {
            dialog.close();
            resolve(result);
        };
        confirm.onclick = () => finish(true);
        cancel.onclick = () => finish(false);
        dialog.oncancel = (event) => {
            event.preventDefault();
            finish(false);
        };
        dialog.showModal();
        cancel.focus();
    });
}

export function setupChrome(app, store) {
    window.addEventListener("export-session", () => store.export());
    const menu = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#appearance-menu");
    const closeMenu = (restoreFocus = false) => {
        menu.setAttribute('aria-expanded', 'false');
        nav.hidden = true;
        if (restoreFocus) menu.focus();
    };
    menu.addEventListener("click", () => {
        const open = menu.getAttribute("aria-expanded") !== "true";
        menu.setAttribute("aria-expanded", String(open));
        nav.hidden = !open;
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !nav.hidden) closeMenu(true);
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.header-menu')) closeMenu();
    });
    document.addEventListener('focusin', (event) => {
        if (!event.target.closest('.header-menu')) closeMenu();
    });
    bindTheme(app);
    document.querySelectorAll("#main-nav a").forEach((link) => {
        if (
            location.pathname === link.pathname ||
            (link.pathname === "/jalur" &&
                /^\/(jalur|belajar)\//.test(location.pathname)) ||
            (link.pathname === "/resep" &&
                (/^\/(resep\/|mustika-rasa)/.test(location.pathname))) ||
            (link.pathname === "/mustika-rasa" &&
                location.pathname.startsWith("/mustika-rasa/"))
        )
            link.setAttribute("aria-current", "page");
    });
    window.addEventListener("storage", (event) => {
        if (event.key === store.key)
            storageWarning(
                "Data berubah di tab lain. Muat ulang halaman untuk memakai data terbaru sebelum mengedit.",
            );
    });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", () => {
        let pref = "light";
        try {
            pref = localStorage.getItem(`${app}-theme`) || "light";
        } catch {
            /* The session still follows the system preference. */
        }
        if (pref === "system")
            document.documentElement.dataset.theme = media.matches
                ? "dark"
                : "light";
    });
}

export function themeControl() {
    return '<label for="theme">Tampilan</label><select id="theme"><option value="system">Sistem</option><option value="light">Putih</option><option value="dark">Gelap</option></select>';
}

export function bindTheme(app) {
    const controls = () => document.querySelectorAll('#theme, [name="appearance"]');
    const sync = (preference) => controls().forEach((control) => {
        if (control.type === 'radio') control.checked = control.value === preference;
        else control.value = preference;
    });
    let preference = 'light';
    try {
        preference = localStorage.getItem(`${app}-theme`) || 'light';
    } catch {
        preference = document.documentElement.dataset.theme || 'light';
    }
    sync(preference);
    controls().forEach((select) => {
    if (select.dataset.themeBound) return;
    select.dataset.themeBound = 'true';
    select.addEventListener("change", () => {
        document.documentElement.dataset.theme =
            select.value === "system"
                ? matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                : select.value;
        sync(select.value);
        try {
            localStorage.setItem(`${app}-theme`, select.value);
        } catch {
            announce(
                "Tampilan diubah untuk sesi ini. Browser membatasi penyimpanan.",
            );
        }
    });
    });
}

export function emptyState(title, body, action = "") {
    return `<div class="empty-state"><h2>${escapeHTML(title)}</h2><p>${escapeHTML(body)}</p>${action}</div>`;
}

export function bindBackup(store, onRestore) {
    document.querySelector("[data-export]").addEventListener("click", () => {
        store.export();
        announce("Cadangan siap diunduh. Simpan file di tempat yang aman.");
    });
    const input = document.querySelector("#import-data");
    input.addEventListener("change", async () => {
        if (!input.files[0]) return;
        const file = input.files[0];
        if (
            !(await confirmAction(
                "Ganti data dengan cadangan?",
                "Data saat ini akan diganti. Ekspor cadangan terlebih dahulu jika masih diperlukan.",
                "Impor cadangan",
            ))
        ) {
            input.value = "";
            return;
        }
        const result = document.querySelector("#import-result");
        result.className = "notice";
        result.textContent = "Membaca dan memeriksa cadangan…";
        try {
            const saved = await store.import(file);
            result.textContent = saved
                ? "Cadangan berhasil diimpor."
                : "Cadangan dibuka untuk sesi ini. Penyimpanan browser tidak tersedia.";
            result.className = "notice";
            onRestore?.();
        } catch (error) {
            result.textContent = error.message;
            result.className = "notice error";
        }
        input.value = "";
    });
}
