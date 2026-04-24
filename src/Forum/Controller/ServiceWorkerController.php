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

use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Laminas\Diactoros\Response\TextResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ServiceWorkerController implements RequestHandlerInterface
{
    protected Filesystem $assets;

    public function __construct(Factory $filesystemFactory)
    {
        $this->assets = $filesystemFactory->disk('flarum-assets');
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        try {
            $js = $this->assets->get('extensions/resofire-pwa/sw.js');
        } catch (FileNotFoundException $e) {
            // Asset not published yet — return an empty but valid service worker
            // so the browser does not error. This should not happen in normal
            // operation since assets are published on extension enable.
            $js = '/* resofire/pwa: service worker not yet published */';
        }

        return new TextResponse($js, 200, [
            'Content-Type'  => 'text/javascript; charset=utf-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
