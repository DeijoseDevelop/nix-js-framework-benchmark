import { signal, html, mount, repeat } from "@deijose/nix-js";

let idCounter = 1;
const adjectives = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const nouns = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

function _random(max) {
    return Math.round(Math.random() * 1000) % max;
}

function buildData(count = 1000) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push({
            id: idCounter++,
            label: signal(`${adjectives[_random(adjectives.length)]} ${colours[_random(colours.length)]} ${nouns[_random(nouns.length)]}`),
            selected: signal(false)
        });
    }
    return data;
}

function App() {
    const rows = signal([]);
    let selectedId = null;
    let rowMap = new Map();

    // Métricas individuales
    const metricCreate  = signal("—");
    const metricReplace = signal("—");
    const metricUpdate  = signal("—");
    const metricSelect  = signal("—");
    const metricSwap    = signal("—");
    const metricClear   = signal("—");
    const metricDelete  = signal("—");

    const metricSignals = {
        create:  metricCreate,
        replace: metricReplace,
        update:  metricUpdate,
        select:  metricSelect,
        swap:    metricSwap,
        clear:   metricClear,
        delete:  metricDelete,
    };

    // false = JS Only  |  true = Full Render (comparable al js-framework-benchmark oficial)
    const fullRenderMode = signal(false);
    const measuring = signal(false);

    const measureTime = (metricName, action) => {
        if (measuring.value) return;
        measuring.value = true;

        if (!fullRenderMode.value) {
            // ─── MODO A: JS Only ───────────────────────────────────────────────
            // Mide únicamente el tiempo JS del framework, sin layout ni paint.
            (async () => {
                await new Promise(r => requestAnimationFrame(r));
                const start = performance.now();
                action();
                const end = performance.now();
                requestAnimationFrame(() => {
                    metricSignals[metricName].value = (end - start).toFixed(2);
                    measuring.value = false;
                });
            })();
        } else {
            // ─── MODO B: Full Render ───────────────────────────────────────────
            // MutationObserver + doble rAF para capturar JS + layout + paint.
            // Metodología comparable a: github.com/krausest/js-framework-benchmark
            (async () => {
                await new Promise(r => requestAnimationFrame(r));

                await new Promise(resolve => {
                    let start;
                    let resolved = false;

                    // Timeout de seguridad: si no hay mutaciones en 2s, igual registra
                    const fallback = setTimeout(() => {
                        if (resolved) return;
                        resolved = true;
                        observer.disconnect();
                        metricSignals[metricName].value = (performance.now() - start).toFixed(2);
                        measuring.value = false;
                        resolve();
                    }, 2000);

                    const observer = new MutationObserver(() => {
                        if (resolved) return;
                        observer.disconnect();
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                if (resolved) return;
                                resolved = true;
                                clearTimeout(fallback);
                                metricSignals[metricName].value = (performance.now() - start).toFixed(2);
                                measuring.value = false;
                                resolve();
                            });
                        });
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        attributes: true,
                    });

                    start = performance.now();
                    action();
                });
            })();
        }
    };

    const setRows = (newRows) => {
        rows.value = newRows;
        rowMap = new Map(newRows.map(r => [r.id, r]));
    };

    const runCreate  = () => measureTime('create',  () => { setRows(buildData(1000)); selectedId = null; });
    const runReplace = () => measureTime('replace', () => { setRows(buildData(1000)); selectedId = null; });

    const runUpdate = () => measureTime('update', () => {
        const currentRows = rows.value;
        for (let i = 0; i < currentRows.length; i += 10) {
            currentRows[i].label.value += ' !!!';
        }
    });

    const runSelect = (id) => measureTime('select', () => {
        if (selectedId !== null) {
            const prev = rowMap.get(selectedId);
            if (prev) prev.selected.value = false;
        }
        const next = rowMap.get(id);
        if (next) next.selected.value = true;
        selectedId = id;
    });

    const runSwap = () => measureTime('swap', () => {
        const currentRows = [...rows.value];
        if (currentRows.length > 998) {
            const temp = currentRows[1];
            currentRows[1] = currentRows[998];
            currentRows[998] = temp;
            setRows(currentRows);
        }
    });

    // Clear: elimina TODAS las filas de una vez
    const runClear = () => measureTime('clear', () => {
        setRows([]);
        selectedId = null;
    });

    // Delete: elimina UNA fila por id (un elemento de la lista)
    const runDelete = (id) => measureTime('delete', () => {
        setRows(rows.value.filter(r => r.id !== id));
        if (selectedId === id) selectedId = null;
    });

    const resetMetrics = () => {
        Object.values(metricSignals).forEach(s => s.value = "—");
    };

    return html`
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        
        .benchmark-app { width: 100%; }
        .benchmark-app h2 { color: var(--text); margin-bottom: 0.5rem; font-size: 1.8rem; text-align: left; }
        .benchmark-app .subtitle { color: var(--text-muted); margin-bottom: 2rem; font-size: 1rem; text-align: left; }

        /* Mode toggle bar */
        .mode-bar {
            display: flex; align-items: center; gap: 1rem;
            background: #f8f9fa; border: 1px solid #eee; border-radius: 12px;
            padding: 1rem 1.5rem; margin-bottom: 2rem;
        }
        .mode-label { font-weight: 600; font-size: 0.95rem; color: var(--text); white-space: nowrap; }
        .mode-desc  { font-size: 0.85rem; color: var(--text-muted); flex: 1; }
        .mode-badge {
            font-size: 0.75rem; font-weight: 700;
            padding: 4px 12px; border-radius: 20px; letter-spacing: 0.04em; white-space: nowrap;
        }
        .mode-badge.js   { background: #e8f5e9; color: #2e7d32; }
        .mode-badge.full { background: #e3f2fd; color: #1565c0; }

        /* Toggle switch */
        .toggle-wrap { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; flex-shrink: 0; }
        .toggle-track {
            width: 48px; height: 26px; background: #e0e0e0;
            border-radius: 100px; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .toggle-track.on { background: var(--primary); }
        .toggle-thumb {
            width: 20px; height: 20px; background: #fff; border-radius: 50%;
            position: absolute; top: 3px; left: 3px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-track.on .toggle-thumb { transform: translateX(22px); }

        /* Buttons */
        .btn-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 2rem; }
        .benchmark-btn {
            padding: 12px 20px; cursor: pointer; border: 1px solid #e0e0e0;
            border-radius: 10px; background: white; font-weight: 600; font-size: 0.9rem;
            transition: all 0.2s; color: var(--text);
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .benchmark-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .benchmark-btn:hover:not(:disabled) { 
            border-color: var(--primary); 
            color: var(--primary);
            background: rgba(0, 122, 255, 0.05);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.1);
        }
        .benchmark-btn:active:not(:disabled) { transform: translateY(0); }
        .benchmark-btn.danger-btn { color: var(--danger); }
        .benchmark-btn.danger-btn:hover:not(:disabled) { 
            background: rgba(255, 59, 48, 0.05); 
            border-color: var(--danger); 
            color: var(--danger);
        }

        /* Metrics */
        .metrics-panel {
            background: #fff; border: 1px solid #eee; border-radius: 16px;
            padding: 1.5rem; margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .metrics-header { display: flex; align-items: center; margin-bottom: 1.5rem; }
        .metrics-header h3 { margin: 0; color: var(--text); font-size: 1.1rem; }
        .reset-link { font-size: 0.85rem; color: var(--text-muted); cursor: pointer; margin-left: auto; transition: color 0.2s; }
        .reset-link:hover { color: var(--primary); }

        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
        .metric-item {
            background: #fcfdfe; border: 1px solid #f0f4f8;
            border-radius: 12px; padding: 1rem; transition: all 0.3s;
        }
        .metric-item:hover { border-color: var(--primary); background: white; }
        .metric-item strong { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .metric-value { font-size: 1.6rem; font-weight: 800; color: var(--primary); font-family: 'Outfit', sans-serif; }
        .metric-unit  { font-size: 0.8rem; color: var(--text-muted); margin-left: 2px; font-weight: 500; }

        /* Table */
        .table-wrap { border-radius: 16px; border: 1px solid #eee; overflow: hidden; background: white; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        thead { background: #f8f9fa; }
        th { padding: 16px; border-bottom: 1px solid #eee; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
        .table-row td { padding: 14px 16px; font-size: 0.95rem; color: var(--text); border-bottom: 1px solid #f8f9fa; }
        .table-row { transition: all 0.2s; }
        .table-row:hover:not(.danger) { background: #fcfdfe; }
        .danger { background-color: rgba(255, 59, 48, 0.1) !important; }
        .danger td { color: var(--danger); font-weight: 600; }
        .delete-btn {
            background: transparent; border: none; color: #ccc;
            font-size: 1.2rem; cursor: pointer; padding: 4px 8px;
            border-radius: 6px; transition: all 0.2s;
        }
        .delete-btn:hover { background: rgba(255, 59, 48, 0.1); color: var(--danger); }
    </style>

    <div class="benchmark-app">
        <h2>🏆 Rendimiento de Nix.js</h2>
        <p class="subtitle">Midiendo la velocidad de ejecución en operaciones del DOM con 1,000 registros.</p>


        <!-- Mode Toggle -->
        <div class="mode-bar">
            <span class="mode-label">Modo:</span>
            <span class="mode-desc">
                ${() => fullRenderMode.value
                    ? 'JS + layout + paint del browser — comparable al js-framework-benchmark oficial'
                    : 'Solo tiempo JS del framework, sin layout ni paint del browser'}
            </span>
            <span class=${() => fullRenderMode.value ? 'mode-badge full' : 'mode-badge js'}>
                ${() => fullRenderMode.value ? 'FULL RENDER' : 'JS ONLY'}
            </span>
            <div class="toggle-wrap" @click=${() => { fullRenderMode.value = !fullRenderMode.value; resetMetrics(); }}>
                <div class=${() => fullRenderMode.value ? 'toggle-track on' : 'toggle-track'}>
                    <div class="toggle-thumb"></div>
                </div>
            </div>
        </div>

        <!-- Buttons -->
        <div class="btn-grid">
            <button class="benchmark-btn" disabled=${() => measuring.value} @click=${runCreate}>Crear 1,000</button>
            <button class="benchmark-btn" disabled=${() => measuring.value} @click=${runReplace}>Reemplazar 1,000</button>
            <button class="benchmark-btn" disabled=${() => measuring.value} @click=${runUpdate}>Actualizar 1 de 10</button>
            <button class="benchmark-btn" disabled=${() => measuring.value} @click=${runSwap}>Intercambiar (2 y 998)</button>
            <button class="benchmark-btn danger-btn" disabled=${() => measuring.value} @click=${runClear}>Limpiar todo</button>
        </div>

        <!-- Metrics: 4 columnas, 7 items -->
        <div class="metrics-panel">
            <div class="metrics-header">
                <h3>⏱️ Métricas de Rendimiento</h3>
                <span class="reset-link" @click=${resetMetrics}>resetear</span>
            </div>
            <div class="metrics-grid">
                <div class="metric-item">
                    <strong>Create</strong>
                    <span class="metric-value">${() => metricCreate.value}</span><span class="metric-unit">ms</span>
                </div>
                <div class="metric-item">
                    <strong>Replace</strong>
                    <span class="metric-value">${() => metricReplace.value}</span><span class="metric-unit">ms</span>
                </div>
                <div class="metric-item">
                    <strong>Update</strong>
                    <span class="metric-value">${() => metricUpdate.value}</span><span class="metric-unit">ms</span>
                </div>
                <div class="metric-item">
                    <strong>Select</strong>
                    <span class="metric-value">${() => metricSelect.value}</span><span class="metric-unit">ms</span>
                </div>
                <div class="metric-item">
                    <strong>Swap</strong>
                    <span class="metric-value">${() => metricSwap.value}</span><span class="metric-unit">ms</span>
                </div>
                <div class="metric-item">
                    <strong>Clear</strong>
                    <span class="metric-value">${() => metricClear.value}</span><span class="metric-unit">ms</span>
                </div>
                <div class="metric-item">
                    <strong>Delete (1 fila)</strong>
                    <span class="metric-value">${() => metricDelete.value}</span><span class="metric-unit">ms</span>
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th style="width:10%">ID</th>
                        <th style="width:60%">Elemento (click para seleccionar)</th>
                        <th style="width:30%">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${() => repeat(
                        rows.value,
                        row => row.id,
                        row => html`
                        <tr class=${() => row.selected.value ? 'table-row danger' : 'table-row'}>
                            <td>${row.id}</td>
                            <td style="cursor:pointer" @click=${() => runSelect(row.id)}>
                                ${() => row.label.value}
                            </td>
                            <td>
                                <button class="delete-btn" @click=${() => runDelete(row.id)}>✖</button>
                            </td>
                        </tr>
                    `)}
                </tbody>
            </table>
        </div>
    </div>
    `;
}

mount(App(), "#app");