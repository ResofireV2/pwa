<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Resofire\PWA\Forum\Controller;

use Flarum\Http\UrlGenerator;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Laminas\Diactoros\Response\HtmlResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class OfflineController implements RequestHandlerInterface
{
    public function __construct(
        protected ViewFactory $view,
        protected SettingsRepositoryInterface $settings,
        protected UrlGenerator $url,
        protected Factory $filesystemFactory,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $assetsFilesystem = $this->filesystemFactory->disk('flarum-assets');

        // Theme color: PWA-specific setting takes precedence over forum primary color.
        $themeColor = $this->settings->get('resofire-pwa.themeColor')
            ?: $this->settings->get('theme_primary_color')
            ?: '#1a3a5c';

        // Forum title and base URL for the offline page header and links.
        $forumTitle = $this->settings->get('forum_title', '');
        $forumUrl   = $this->url->to('forum')->base();
        $basePath   = rtrim(parse_url($forumUrl, PHP_URL_PATH) ?? '/', '/');

        // Forum logo URL — optional, shown in the offline header if set.
        $logoPath = $this->settings->get('logo_path');
        $logoUrl  = $logoPath ? $assetsFilesystem->url($logoPath) : null;

        // Derive a contrasting text color for the header using YIQ formula.
        $headerTextColor = $this->contrastColor($themeColor);

        $html = $this->view->make('resofire-pwa::offline', [
            'themeColor'      => $themeColor,
            'headerTextColor' => $headerTextColor,
            'forumTitle'      => $forumTitle,
            'forumUrl'        => $forumUrl,
            'basePath'        => $basePath,
            'logoUrl'         => $logoUrl,
        ])->render();

        return new HtmlResponse($html);
    }

    /**
     * Return #ffffff or #111111 depending on which contrasts better
     * against the given hex background color, using the YIQ formula.
     */
    protected function contrastColor(string $hex): string
    {
        $hex = ltrim($hex, '#');

        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        if (strlen($hex) !== 6) {
            return '#ffffff';
        }

        $r   = hexdec(substr($hex, 0, 2));
        $g   = hexdec(substr($hex, 2, 2));
        $b   = hexdec(substr($hex, 4, 2));
        $yiq = ($r * 299 + $g * 587 + $b * 114) / 1000;

        return $yiq >= 128 ? '#111111' : '#ffffff';
    }
}
