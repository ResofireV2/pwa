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
        $js = $this->assets->get('extensions/resofire-pwa/sw.js');

        return new TextResponse($js, 200, [
            'Content-Type'  => 'text/javascript; charset=utf-8',
            // Service workers must not be cached aggressively; browsers
            // already handle SW update checks, but we make this explicit.
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
