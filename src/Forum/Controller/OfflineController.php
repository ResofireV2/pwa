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

use Illuminate\Contracts\View\Factory as ViewFactory;
use Laminas\Diactoros\Response\HtmlResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class OfflineController implements RequestHandlerInterface
{
    protected ViewFactory $view;

    public function __construct(ViewFactory $view)
    {
        $this->view = $view;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $html = $this->view->make('resofire-pwa::offline')->render();

        return new HtmlResponse($html);
    }
}
