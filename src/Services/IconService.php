<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Resofire\PWA\Services;

use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Psr\Http\Message\UploadedFileInterface;
use Resofire\PWA\IconSizes;

class IconService
{
    protected Cloud $disk;

    public function __construct(
        protected ImageManager $imageManager,
        protected SettingsRepositoryInterface $settings,
        Factory $filesystemFactory,
    ) {
        $this->disk = $filesystemFactory->disk('flarum-assets');
    }

    /**
     * Generate all icon sizes from a single source upload.
     *
     * Returns an array keyed by setting key, each with 'path' and 'url'.
     *
     * @return array<string, array{path: string, url: string}>
     */
    public function generateFromUpload(UploadedFileInterface $file): array
    {
        $sourcePath = $file->getStream()->getMetadata('uri');
        $source     = $this->imageManager->read($sourcePath);

        $sourceWidth  = $source->width();
        $sourceHeight = $source->height();

        $generated = [];

        foreach (IconSizes::ALL as $size) {
            // Never upscale — skip sizes larger than the source.
            if ($sourceWidth < $size || $sourceHeight < $size) {
                continue;
            }

            // Delete any previously generated icon at this size.
            $this->deleteExisting("resofire-pwa.icon_{$size}_path");

            // Clone before cover() since it mutates in place.
            $resized  = clone $source;
            $encoded  = $resized->cover($size, $size)->toPng();

            $filename = "pwa-icon-{$size}-" . Str::lower(Str::random(8)) . '.png';
            $this->disk->put("extensions/resofire-pwa/{$filename}", $encoded);

            $path = "extensions/resofire-pwa/{$filename}";
            $this->settings->set("resofire-pwa.icon_{$size}_path", $path);

            $generated["resofire-pwa.icon_{$size}_path"] = [
                'path' => $path,
                'url'  => $this->disk->url($path),
            ];
        }

        // Generate the maskable variant at 512×512.
        // Uses the same image as the standard 512 icon but is tagged
        // with purpose: maskable in the manifest.
        if ($sourceWidth >= 512 && $sourceHeight >= 512) {
            $this->deleteExisting('resofire-pwa.icon_maskable_path');

            $resized  = clone $source;
            $encoded  = $resized->cover(512, 512)->toPng();

            $filename = 'pwa-icon-maskable-' . Str::lower(Str::random(8)) . '.png';
            $path = "extensions/resofire-pwa/{$filename}";
            $this->disk->put($path, $encoded);

            $this->settings->set('resofire-pwa.icon_maskable_path', $path);

            $generated['resofire-pwa.icon_maskable_path'] = [
                'path' => $path,
                'url'  => $this->disk->url($path),
            ];
        }

        return $generated;
    }

    /**
     * Generate a 96×96 greyscale notification badge PNG from an upload.
     *
     * @return array{path: string, url: string}
     */
    public function generateBadge(UploadedFileInterface $file): array
    {
        $this->deleteBadge();

        $sourcePath = $file->getStream()->getMetadata('uri');
        $encoded = $this->imageManager->read($sourcePath)
            ->cover(96, 96)
            ->toPng();

        $filename = 'pwa-badge-' . Str::lower(Str::random(8)) . '.png';
        $path     = "extensions/resofire-pwa/{$filename}";

        $this->disk->put($path, $encoded);
        $url = $this->disk->url($path);
        $this->settings->set('resofire-pwa.badge_path', $path);
        $this->settings->set('resofire-pwa.badge_url',  $url);

        return [
            'path' => $path,
            'url'  => $url,
        ];
    }

    /**
     * Delete the notification badge and clear its settings key.
     */
    public function deleteBadge(): void
    {
        $this->deleteExisting('resofire-pwa.badge_path');
        $this->settings->set('resofire-pwa.badge_url', null);
    }

    /**
     * Delete all generated icons and clear their settings keys.
     *
     * @return string[] List of settings keys that were cleared.
     */
    public function deleteAll(): array
    {
        $cleared = [];

        foreach (IconSizes::ALL as $size) {
            $key = "resofire-pwa.icon_{$size}_path";
            if ($this->deleteExisting($key)) {
                $cleared[] = $key;
            }
        }

        if ($this->deleteExisting('resofire-pwa.icon_maskable_path')) {
            $cleared[] = 'resofire-pwa.icon_maskable_path';
        }

        return $cleared;
    }

    /**
     * Delete the file for a given settings key and clear the key.
     * Returns true if a file was deleted.
     */
    protected function deleteExisting(string $settingKey): bool
    {
        $path = $this->settings->get($settingKey);

        if ($path && $this->disk->exists($path)) {
            $this->disk->delete($path);
            $this->settings->set($settingKey, null);
            return true;
        }

        if ($path) {
            // Path recorded but file missing — clear the setting anyway.
            $this->settings->set($settingKey, null);
        }

        return false;
    }
}
