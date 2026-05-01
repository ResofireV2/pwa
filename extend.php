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
use Flarum\User\User;
use Illuminate\Support\Arr;
use Resofire\PWA\Api\Controller\DeleteBadgeController;
use Resofire\PWA\Api\Controller\DeleteIconsController;
use Resofire\PWA\Api\Controller\DeletePushSubscriptionController;
use Resofire\PWA\Api\Controller\GenerateVapidKeysController;
use Resofire\PWA\Api\Controller\SavePushSubscriptionController;
use Resofire\PWA\Api\Controller\UploadBadgeController;
use Resofire\PWA\Api\Controller\UploadIconController;
use Resofire\PWA\Forum\Controller\OfflineController;
use Resofire\PWA\Forum\Controller\ServiceWorkerController;
use Resofire\PWA\Forum\Controller\WebManifestController;
use Resofire\PWA\PushNotificationDriver;
use Resofire\PWA\PushSubscription;

$metaClosure = function (Document $document) {
    $forumApiDocument = $document->getForumApiDocument();
    $basePath = rtrim(Arr::get($forumApiDocument, 'data.attributes.basePath'), '/');

    $settings = resolve(SettingsRepositoryInterface::class);
    $appName  = $settings->get('resofire-pwa.shortName', $settings->get('resofire-pwa.longName', $settings->get('forum_title')));

    // Status bar style — read from settings, not hardcoded
    $statusBarStyle = $settings->get('resofire-pwa.statusBarStyle', 'default');

    $document->head[] = "<link rel='manifest' href='$basePath/webmanifest'>";
    $document->head[] = "<meta name='apple-mobile-web-app-capable' content='yes'>";
    $document->head[] = "<meta name='mobile-web-app-capable' content='yes'>";
    $document->head[] = "<meta id='apple-style' name='apple-mobile-web-app-status-bar-style' content='" . htmlspecialchars($statusBarStyle, ENT_QUOTES, 'UTF-8') . "'>";
    $document->head[] = "<meta id='apple-title' name='apple-mobile-web-app-title' content='" . htmlspecialchars($appName, ENT_QUOTES, 'UTF-8') . "'>";

    // Apple touch icon tags — Safari uses these for the home screen icon on iOS.
    // Resolve the assets disk once rather than once per icon size.
    /** @var \Illuminate\Contracts\Filesystem\Cloud $assets */
    $assets = resolve(\Illuminate\Contracts\Filesystem\Factory::class)->disk('flarum-assets');

    foreach (\Resofire\PWA\IconSizes::ALL as $size) {
        if ($path = $settings->get("resofire-pwa.icon_{$size}_path")) {
            $url        = htmlspecialchars($assets->url($path), ENT_QUOTES, 'UTF-8');
            $sizesAttr  = $size !== 48 ? " sizes='{$size}x{$size}'" : '';
            $document->head[] = "<link rel='apple-touch-icon'{$sizesAttr} href='{$url}'>";
        }
    }
};

return [
    // -------------------------------------------------------------------------
    // API routes
    // -------------------------------------------------------------------------
    (new Extend\Routes('api'))
        ->post('/resofire-pwa/icons',  'resofire-pwa.icons.upload',  UploadIconController::class)
        ->delete('/resofire-pwa/icons', 'resofire-pwa.icons.delete', DeleteIconsController::class)
        ->post('/resofire-pwa/badge',  'resofire-pwa.badge.upload',  UploadBadgeController::class)
        ->delete('/resofire-pwa/badge', 'resofire-pwa.badge.delete', DeleteBadgeController::class)
        ->post('/resofire-pwa/push',   'resofire-pwa.push.save',     SavePushSubscriptionController::class)
        ->delete('/resofire-pwa/push', 'resofire-pwa.push.delete',   DeletePushSubscriptionController::class)
        ->post('/resofire-pwa/vapid',  'resofire-pwa.vapid.generate', GenerateVapidKeysController::class),

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
    // User model relationship
    // -------------------------------------------------------------------------
    (new Extend\Model(User::class))
        ->hasMany('pushSubscriptions', PushSubscription::class, 'user_id'),

    // -------------------------------------------------------------------------
    // Push notification driver
    // -------------------------------------------------------------------------
    (new Extend\Notification())
        ->driver('push', PushNotificationDriver::class),

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
        ->default('resofire-pwa.forcePortrait', false)
        ->default('resofire-pwa.windowControlsOverlay', false)
        ->default('resofire-pwa.startUrl', '/')
        ->default('resofire-pwa.statusBarStyle', 'default')
        ->default('resofire-pwa.iosPromptEnabled', true)
        ->default('resofire-pwa.iosPromptText', '')
        ->default('resofire-pwa.iosPromptDelay', 10000)
        ->default('resofire-pwa.iosAutoDetectOrientation', true)
        ->default('resofire-pwa.iosPadAlwaysUp', true)
        ->default('resofire-pwa.androidBannerEnabled', true)
        ->default('resofire-pwa.androidBannerText', '')
        ->default('resofire-pwa.androidInstallText', '')
        ->default('resofire-pwa.androidSheetEnabled', true)
        ->default('resofire-pwa.androidSheetDelay', 1500)
        ->default('resofire-pwa.androidSheetFeaturePush', true)
        ->default('resofire-pwa.androidSheetFeatureFullscreen', true)
        ->default('resofire-pwa.pushPromptEnabled', true)
        ->default('resofire-pwa.pushPromptTitle', '')
        ->default('resofire-pwa.pushPromptBody', '')
        ->default('resofire-pwa.pushPromptDelay', 2000)
        ->default('resofire-pwa.userMaxSubscriptions', 20)
        ->default('resofire-pwa.badge_path', '')
        ->default('resofire-pwa.badge_url',  '')
        ->default('resofire-pwa.debugMode', false)
        // Serialize install prompt settings to the forum frontend.
        ->serializeToForum('resofire-pwa.appName',                    'resofire-pwa.longName')
        ->serializeToForum('resofire-pwa.androidBannerEnabled',       'resofire-pwa.androidBannerEnabled',       'boolval')
        ->serializeToForum('resofire-pwa.androidBannerText',          'resofire-pwa.androidBannerText')
        ->serializeToForum('resofire-pwa.androidInstallText',         'resofire-pwa.androidInstallText')
        ->serializeToForum('resofire-pwa.androidSheetEnabled',        'resofire-pwa.androidSheetEnabled',        'boolval')
        ->serializeToForum('resofire-pwa.androidSheetDelay',          'resofire-pwa.androidSheetDelay',          'intval')
        ->serializeToForum('resofire-pwa.androidSheetFeaturePush',    'resofire-pwa.androidSheetFeaturePush',    'boolval')
        ->serializeToForum('resofire-pwa.androidSheetFeatureFullscreen', 'resofire-pwa.androidSheetFeatureFullscreen', 'boolval')
        ->serializeToForum('resofire-pwa.iosPromptEnabled',           'resofire-pwa.iosPromptEnabled',           'boolval')
        ->serializeToForum('resofire-pwa.iosPromptText',              'resofire-pwa.iosPromptText')
        ->serializeToForum('resofire-pwa.iosPromptDelay',             'resofire-pwa.iosPromptDelay',             'intval')
        ->serializeToForum('resofire-pwa.iosAutoDetectOrientation',   'resofire-pwa.iosAutoDetectOrientation',   'boolval')
        ->serializeToForum('resofire-pwa.iosPadAlwaysUp',             'resofire-pwa.iosPadAlwaysUp',             'boolval')
        // Serialize VAPID public key so the forum JS can subscribe to push.
        ->serializeToForum('resofire-pwa.vapidPublicKey',    'resofire-pwa.vapid.public')
        ->serializeToForum('resofire-pwa.pushPromptEnabled', 'resofire-pwa.pushPromptEnabled', 'boolval')
        ->serializeToForum('resofire-pwa.pushPromptDelay',   'resofire-pwa.pushPromptDelay',   'intval')
        ->serializeToForum('resofire-pwa.pushPromptTitle',   'resofire-pwa.pushPromptTitle')
        ->serializeToForum('resofire-pwa.pushPromptBody',    'resofire-pwa.pushPromptBody')
        // Serialize the 192px icon URL so forum components can display the PWA icon.
        ->serializeToForum('resofire-pwa.icon192Url', 'resofire-pwa.icon_192_path', function (?string $path) {
            if (!$path) return null;
            return resolve(\Illuminate\Contracts\Filesystem\Factory::class)
                ->disk('flarum-assets')
                ->url($path);
        }),
];
