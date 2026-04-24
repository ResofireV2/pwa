<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1">
    <title>{{ $translator->trans('resofire-pwa.views.offline.title') }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }

        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            text-align: center;
        }

        .card {
            background: #fff;
            border-radius: 12px;
            padding: 40px 32px;
            max-width: 400px;
            width: 100%;
        }

        .icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 20px;
            opacity: 0.4;
        }

        h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 10px;
        }

        p {
            font-size: 14px;
            color: #666;
            margin: 0 0 24px;
        }

        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #1a3a5c;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
        }

        .btn:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="card">
        <svg class="icon" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 28C8 16.95 16.95 8 28 8" stroke="#333" stroke-width="3" stroke-linecap="round"/>
            <path d="M15 28C15 20.27 20.27 15 28 15" stroke="#333" stroke-width="3" stroke-linecap="round"/>
            <circle cx="28" cy="28" r="4" fill="#333"/>
            <line x1="42" y1="14" x2="14" y2="42" stroke="#333" stroke-width="3" stroke-linecap="round"/>
        </svg>

        <h1>{{ $translator->trans('resofire-pwa.views.offline.heading') }}</h1>
        <p>{{ $translator->trans('resofire-pwa.views.offline.body') }}</p>

        <button class="btn" onclick="location.reload()">
            {{ $translator->trans('resofire-pwa.views.offline.retry') }}
        </button>
    </div>

    <script>
        // Auto-reload when connection is restored.
        window.addEventListener('online', function () {
            location.reload();
        });
    </script>
</body>
</html>
