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

use Flarum\Http\UrlGenerator;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Contracts\Filesystem\Factory;

trait PWATrait
{
    protected function getBasePath(): string
    {
        /** @var UrlGenerator $url */
        $url = resolve(UrlGenerator::class);

        return rtrim(parse_url($url->to('forum')->base(), PHP_URL_PATH) ?? '/', '/') . '/';
    }

    /**
     * @return array<array{'src': string, 'sizes': string, 'type': string, 'purpose'?: string}>
     */
    protected function getIcons(): array
    {
        /** @var Cloud $assetsFilesystem */
        $assetsFilesystem = resolve(Factory::class)->disk('flarum-assets');
        /** @var SettingsRepositoryInterface $settings */
        $settings = resolve(SettingsRepositoryInterface::class);

        $icons = [];

        foreach (IconSizes::ALL as $size) {
            $key = "resofire-pwa.icon_{$size}_path";
            if ($path = $settings->get($key)) {
                $icons[] = [
                    'src'   => $assetsFilesystem->url($path),
                    'sizes' => "{$size}x{$size}",
                    'type'  => 'image/png',
                ];
            }
        }

        // Maskable variant (auto-generated from source, stored separately)
        if ($maskablePath = $settings->get('resofire-pwa.icon_maskable_path')) {
            $icons[] = [
                'src'     => $assetsFilesystem->url($maskablePath),
                'sizes'   => '512x512',
                'type'    => 'image/png',
                'purpose' => 'maskable',
            ];
        }

        return $icons;
    }

    protected function buildManifest(): array
    {
        /** @var SettingsRepositoryInterface $settings */
        $settings = resolve(SettingsRepositoryInterface::class);

        $basePath = $this->getBasePath();

        $startUrl = $settings->get('resofire-pwa.startUrl', '/');
        // Ensure start_url is relative to the forum base path
        if (!str_starts_with($startUrl, '/')) {
            $startUrl = '/' . $startUrl;
        }

        $manifest = [
            'name'        => $settings->get('resofire-pwa.longName') ?: $settings->get('forum_title'),
            'description' => $settings->get('forum_description', ''),
            'start_url'   => $basePath . ltrim($startUrl, '/'),
            'scope'       => $basePath,
            'dir'         => 'auto',
            'display'     => 'standalone',
            'icons'       => $this->getIcons(),
        ];

        // theme_color: extension setting takes precedence, falls back to forum primary color
        $themeColor = $settings->get('resofire-pwa.themeColor') ?: $settings->get('theme_primary_color');
        if ($themeColor) {
            $manifest['theme_color'] = $themeColor;
        }

        // background_color: only included when explicitly set
        if ($backgroundColor = $settings->get('resofire-pwa.backgroundColor')) {
            $manifest['background_color'] = $backgroundColor;
        }

        // short_name: only included when explicitly set
        if ($shortName = $settings->get('resofire-pwa.shortName')) {
            $manifest['short_name'] = $shortName;
        }

        // orientation: only included when force portrait is enabled
        if ($settings->get('resofire-pwa.forcePortrait')) {
            $manifest['orientation'] = 'portrait';
        }

        // display_override: window-controls-overlay for desktop PWA title bar
        if ($settings->get('resofire-pwa.windowControlsOverlay')) {
            $manifest['display_override'] = ['window-controls-overlay'];
        }

        return $manifest;
    }
}
