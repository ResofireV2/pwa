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

use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Resofire\PWA\PWATrait;

class WebManifestController implements RequestHandlerInterface
{
    use PWATrait;

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return new JsonResponse(
            $this->buildManifest(),
            200,
            ['Content-Type' => 'application/manifest+json']
        );
    }
}
