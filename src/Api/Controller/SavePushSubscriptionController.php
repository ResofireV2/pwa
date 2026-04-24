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

use Carbon\Carbon;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Resofire\PWA\PushSubscription;

class SavePushSubscriptionController implements RequestHandlerInterface
{
    /**
     * Push service hosts that are allowed as subscription endpoints.
     * Taken from https://github.com/pushpad/known-push-services/blob/master/whitelist
     */
    private const ALLOWED_HOSTS = [
        'android.googleapis.com',
        'fcm.googleapis.com',
        'updates.push.services.mozilla.com',
        'updates-autopush.stage.mozaws.net',
        'updates-autopush.dev.mozaws.net',
        'notify.windows.com',
        'push.apple.com',
        'web.push.apple.com',
    ];

    public function __construct(
        protected SettingsRepositoryInterface $settings,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $data = Arr::get($request->getParsedBody(), 'subscription', []);

        $endpoint = Arr::get($data, 'endpoint');
        if (!$endpoint) {
            return new JsonResponse(['error' => 'Endpoint is required.'], 422);
        }

        // Validate endpoint host against the allowlist.
        $host    = parse_url($endpoint, PHP_URL_HOST) ?: '';
        $allowed = collect(self::ALLOWED_HOSTS)->contains(
            fn(string $h) => $host === $h || Str::endsWith($host, '.' . $h)
        );

        if (!$allowed) {
            return new JsonResponse(['error' => 'Endpoint host is not allowed.'], 403);
        }

        // Return existing subscription silently (browser may resend on re-registration).
        $existing = PushSubscription::where('endpoint', $endpoint)->first();
        if ($existing) {
            return new JsonResponse(['id' => $existing->id], 200);
        }

        // Enforce per-user subscription limit — remove oldest entries if over limit.
        $maxSubscriptions = (int) $this->settings->get('resofire-pwa.userMaxSubscriptions', 20);
        $subscriptions    = $actor->pushSubscriptions();
        $count            = $subscriptions->count();

        if ($count >= $maxSubscriptions) {
            $subscriptions->orderBy('last_used')->take($count - $maxSubscriptions + 1)->delete();
        }

        $subscription                   = new PushSubscription();
        $subscription->user_id          = $actor->id;
        $subscription->endpoint         = $endpoint;
        $subscription->vapid_public_key = $this->settings->get('resofire-pwa.vapid.public', '');
        $subscription->keys             = isset($data['keys']) ? json_encode($data['keys']) : null;
        $subscription->expires_at       = isset($data['expirationTime'])
            ? Carbon::parse($data['expirationTime'])
            : null;
        $subscription->last_used        = Carbon::now();

        $subscription->save();

        return new JsonResponse(['id' => $subscription->id], 201);
    }
}
