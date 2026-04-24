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

use ErrorException;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Minishlink\WebPush\VAPID;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Resofire\PWA\PushSubscription;

class GenerateVapidKeysController implements RequestHandlerInterface
{
    public function __construct(
        protected SettingsRepositoryInterface $settings,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        try {
            $keys = VAPID::createVapidKeys();
        } catch (ErrorException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }

        $this->settings->set('resofire-pwa.vapid.public',  $keys['publicKey']);
        $this->settings->set('resofire-pwa.vapid.private', $keys['privateKey']);

        // Invalidate all existing push subscriptions — they were created
        // with the old public key and are now useless.
        $deleted = PushSubscription::count();
        PushSubscription::truncate();

        return new JsonResponse([
            'publicKey'        => $keys['publicKey'],
            'subscriptionsDeleted' => $deleted,
        ]);
    }
}
