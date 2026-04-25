<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Resofire\PWA\Api\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\Http\RequestUtil;
use Psr\Http\Message\ServerRequestInterface;
use Resofire\PWA\Services\IconService;

class DeleteBadgeController extends AbstractDeleteController
{
    public function __construct(
        protected IconService $iconService,
    ) {}

    protected function delete(ServerRequestInterface $request): void
    {
        RequestUtil::getActor($request)->assertAdmin();

        $this->iconService->deleteBadge();
    }
}
