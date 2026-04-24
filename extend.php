<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Resofire\PWA;

use Flarum\Extend;
use Flarum\Frontend\Document;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Support\Arr;
use Resofire\PWA\Forum\Controller\OfflineController;
use Resofire\PWA\Forum\Controller\ServiceWorkerController;
use Resofire\PWA\Forum\Controller\WebManifestController;

$metaClosure = function (Document $document) {
    $forumApiDocument = $document->getForumApiDocument();
    $basePath = rtrim(Arr::get($forumApiDocument, 'data.attributes.basePath'), '/');

    $settings = resolve(SettingsRepositoryInterface::class);
    $appName = $settings->get('resofire-pwa.shortName', $settings->get('resofire-pwa.longName', $settings->get('forum_title')));

    $document->head[] = "<link rel='manifest' href='$basePath/webmanifest'>";
    $document->head[] = "<meta name='apple-mobile-web-app-capable' content='yes'>";
    $document->head[] = "<meta id='apple-style' name='apple-mobile-web-app-status-bar-style' content='default'>";
    $document->head[] = "<meta id='apple-title' name='apple-mobile-web-app-title' content='" . htmlspecialchars($appName, ENT_QUOTES, 'UTF-8') . "'>";
};

return [
    // -------------------------------------------------------------------------
    // Forum routes
    // -------------------------------------------------------------------------
    (new Extend\Routes('forum'))
        ->get('/webmanifest', 'resofire-pwa.webmanifest', WebManifestController::class)
        ->get('/sw', 'resofire-pwa.sw', ServiceWorkerController::class)
        ->get('/offline', 'resofire-pwa.offline', OfflineController::class),

    // -------------------------------------------------------------------------
    // Frontend assets and meta tags
    // -------------------------------------------------------------------------
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less')
        ->content($metaClosure),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/less/admin.less')
        ->content($metaClosure),

    // -------------------------------------------------------------------------
    // Translations
    // -------------------------------------------------------------------------
    new Extend\Locales(__DIR__ . '/locale'),

    // -------------------------------------------------------------------------
    // Views (offline page template)
    // -------------------------------------------------------------------------
    (new Extend\View())
        ->namespace('resofire-pwa', __DIR__ . '/views'),

    // -------------------------------------------------------------------------
    // Settings defaults
    // -------------------------------------------------------------------------
    (new Extend\Settings())
        ->default('resofire-pwa.longName', '')
        ->default('resofire-pwa.shortName', '')
        ->default('resofire-pwa.themeColor', '')
        ->default('resofire-pwa.backgroundColor', '')
        ->default('resofire-pwa.logoBackgroundColor', '')
        ->default('resofire-pwa.useLogoBackground', false)
        ->default('resofire-pwa.forcePortrait', false)
        ->default('resofire-pwa.windowControlsOverlay', false)
        ->default('resofire-pwa.startUrl', '/')
        ->default('resofire-pwa.statusBarStyle', 'default')
        ->default('resofire-pwa.iosPromptEnabled', true)
        ->default('resofire-pwa.iosPromptDelay', 10000)
        ->default('resofire-pwa.androidBannerEnabled', true)
        ->default('resofire-pwa.androidSheetEnabled', true)
        ->default('resofire-pwa.androidSheetDelay', 1500)
        ->default('resofire-pwa.pushPromptEnabled', true)
        ->default('resofire-pwa.pushPromptTitle', '')
        ->default('resofire-pwa.pushPromptBody', '')
        ->default('resofire-pwa.pushPromptDelay', 2000)
        ->default('resofire-pwa.userMaxSubscriptions', 20),
];
