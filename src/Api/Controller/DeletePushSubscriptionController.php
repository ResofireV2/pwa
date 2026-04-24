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
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Resofire\PWA\PushSubscription;

class DeletePushSubscriptionController extends AbstractDeleteController
{
    protected function delete(ServerRequestInterface $request): void
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $endpoint = Arr::get($request->getParsedBody(), 'endpoint');

        if (!$endpoint) {
            return;
        }

        // Only delete subscriptions belonging to the current user.
        PushSubscription::where('endpoint', $endpoint)
            ->where('user_id', $actor->id)
            ->delete();
    }
}
