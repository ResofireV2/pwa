<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1">
    <title>{{ $translator->trans('resofire-pwa.views.offline.title') }} — {{ $forumTitle }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --theme:       {{ $themeColor }};
            --theme-text:  {{ $headerTextColor }};
            --bg:          #f4f5f7;
            --surface:     #ffffff;
            --text:        #1a1a2e;
            --muted:       #6b7280;
            --border:      #e5e7eb;
            --success:     #22c55e;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg:      #0f1117;
                --surface: #1c1f27;
                --text:    #e8eaf0;
                --muted:   #9ca3af;
                --border:  #2d3143;
            }
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            color: var(--text);
            background: var(--bg);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ── Header ── */
        .header {
            background: var(--theme);
            color: var(--theme-text);
            padding: 0 20px;
            height: 52px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }

        .header-logo {
            height: 28px;
            width: auto;
        }

        .header-title {
            font-size: 16px;
            font-weight: 600;
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--theme-text);
            text-decoration: none;
        }

        .header-pill {
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 20px;
            padding: 3px 10px;
            font-size: 12px;
            font-weight: 500;
            flex-shrink: 0;
        }

        .header-pill-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #f59e0b;
            flex-shrink: 0;
        }

        /* ── Main ── */
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 48px 20px 32px;
        }

        .hero {
            text-align: center;
            max-width: 380px;
            width: 100%;
            margin-bottom: 40px;
        }

        .hero-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: var(--surface);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
        }

        .hero-icon svg {
            width: 32px;
            height: 32px;
            opacity: 0.45;
        }

        .hero h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text);
        }

        .hero p {
            font-size: 14px;
            color: var(--muted);
            margin-bottom: 24px;
            line-height: 1.6;
        }

        .btn-retry {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 10px 20px;
            background: var(--theme);
            color: var(--theme-text);
            border: none;
            border-radius: 7px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: opacity 0.15s;
        }

        .btn-retry:hover { opacity: 0.88; }

        .btn-retry svg {
            width: 14px;
            height: 14px;
        }

        /* ── Recent pages ── */
        .recent {
            width: 100%;
            max-width: 540px;
        }

        .recent-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 10px;
        }

        .recent-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .recent-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            text-decoration: none;
            color: var(--text);
            font-size: 13px;
            font-weight: 500;
            transition: border-color 0.12s;
        }

        .recent-item:hover { border-color: var(--theme); }

        .recent-item-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--success);
            flex-shrink: 0;
        }

        .recent-item-title {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .recent-item-badge {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
            background: var(--bg);
            color: var(--muted);
            border: 1px solid var(--border);
            white-space: nowrap;
            flex-shrink: 0;
        }

        .recent-empty {
            font-size: 13px;
            color: var(--muted);
            text-align: center;
            padding: 16px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
        }
    </style>
</head>
<body>

    <header class="header">
        @if ($logoUrl)
            <a href="{{ $forumUrl }}">
                <img class="header-logo" src="{{ $logoUrl }}" alt="{{ $forumTitle }}">
            </a>
        @else
            <a class="header-title" href="{{ $forumUrl }}">{{ $forumTitle }}</a>
        @endif

        @if ($logoUrl)
            <a class="header-title" href="{{ $forumUrl }}">{{ $forumTitle }}</a>
        @endif

        <div class="header-pill">
            <div class="header-pill-dot"></div>
            {{ $translator->trans('resofire-pwa.views.offline.pill') }}
        </div>
    </header>

    <main class="main">

        <div class="hero">
            <div class="hero-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4 16C4 9.37 9.37 4 16 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 16C8 11.58 11.58 8 16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="16" cy="16" r="3" fill="currentColor"/>
                    <line x1="26" y1="6" x2="6" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>

            <h1>{{ $translator->trans('resofire-pwa.views.offline.heading') }}</h1>
            <p>{{ $translator->trans('resofire-pwa.views.offline.body') }}</p>

            <button class="btn-retry" onclick="location.reload()">
                <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7A5 5 0 0 1 10.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M9 1.5l1.5 2-2 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                {{ $translator->trans('resofire-pwa.views.offline.retry') }}
            </button>
        </div>

        <div class="recent">
            <p class="recent-label" id="recent-label" style="display:none;">
                {{ $translator->trans('resofire-pwa.views.offline.recent_heading') }}
            </p>
            <ul class="recent-list" id="recent-list"></ul>
            <p class="recent-empty" id="recent-empty" style="display:none;">
                {{ $translator->trans('resofire-pwa.views.offline.recent_empty') }}
            </p>
        </div>

    </main>

    <script>
        // Auto-reload when connection is restored.
        window.addEventListener('online', function () {
            location.reload();
        });

        // Load recently visited pages from IndexedDB.
        (function () {
            var DB_NAME   = 'keyval-store';
            var STORE     = 'keyval';
            var KEY       = 'resofire-pwa.recentPages';
            var cachedLabel = document.getElementById('recent-label');
            var list      = document.getElementById('recent-list');
            var empty     = document.getElementById('recent-empty');

            var req = indexedDB.open(DB_NAME, 1);

            req.onsuccess = function () {
                var db = req.result;

                if (!db.objectStoreNames.contains(STORE)) {
                    showEmpty();
                    return;
                }

                var tx    = db.transaction(STORE, 'readonly');
                var store = tx.objectStore(STORE);
                var get   = store.get(KEY);

                get.onsuccess = function () {
                    var pages = get.result;
                    if (!pages || !pages.length) {
                        showEmpty();
                        return;
                    }
                    cachedLabel.style.display = '';
                    pages.forEach(function (page) {
                        var li = document.createElement('li');
                        var a  = document.createElement('a');
                        a.className = 'recent-item';
                        a.href      = page.url;

                        var dot = document.createElement('div');
                        dot.className = 'recent-item-dot';

                        var title = document.createElement('span');
                        title.className   = 'recent-item-title';
                        title.textContent = page.title;

                        var badge = document.createElement('span');
                        badge.className   = 'recent-item-badge';
                        badge.textContent = '{{ $translator->trans("resofire-pwa.views.offline.cached_badge") }}';

                        a.appendChild(dot);
                        a.appendChild(title);
                        a.appendChild(badge);
                        li.appendChild(a);
                        list.appendChild(li);
                    });
                };

                get.onerror = showEmpty;
            };

            req.onerror = showEmpty;

            function showEmpty() {
                cachedLabel.style.display = '';
                empty.style.display = '';
            }
        })();
    </script>

</body>
</html>
