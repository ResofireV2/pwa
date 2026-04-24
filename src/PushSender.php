<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Resofire\PWA;

use Base64Url\Base64Url;
use Carbon\Carbon;
use Flarum\Http\UrlGenerator;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Contracts\Filesystem\Factory;
use Illuminate\Support\Arr;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Psr\Log\LoggerInterface;

class PushSender
{
    use PWATrait;

    protected Cloud $assetsFilesystem;

    public function __construct(
        Factory $filesystemFactory,
        protected LoggerInterface $logger,
        protected SettingsRepositoryInterface $settings,
        protected UrlGenerator $url,
        protected NotificationBuilder $notifications,
    ) {
        $this->assetsFilesystem = $filesystemFactory->disk('flarum-assets');
    }

    public function notify(BlueprintInterface $blueprint, array $userIds = []): void
    {
        $users = User::whereIn('id', $userIds)->get()->all();

        $this->log('[PWA PUSH] Notification type: ' . $blueprint::getType());
        $this->log('[PWA PUSH] Sending for user IDs: ' . json_encode(Arr::pluck($users, 'id')));

        $payload = json_encode($this->buildPayload($blueprint));

        $notifications = [];
        $sendingCount  = 0;

        foreach ($users as $user) {
            foreach ($user->pushSubscriptions as $subscription) {
                $sendingCount++;
                $notifications[] = [
                    'subscription' => Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'keys'     => json_decode($subscription->keys, true),
                    ]),
                    'payload' => $payload,
                ];
            }
        }

        if (empty($notifications)) {
            $this->log('[PWA PUSH] No subscriptions to send to.');
            return;
        }

        $publicKey  = $this->settings->get('resofire-pwa.vapid.public', '');
        $privateKey = $this->settings->get('resofire-pwa.vapid.private', '');

        if (!$publicKey || !$privateKey) {
            $this->log('[PWA PUSH] VAPID keys not configured — skipping.');
            return;
        }

        $auth = [
            'VAPID' => [
                'subject'    => $this->url->to('forum')->base(),
                'publicKey'  => Base64Url::encode(base64_decode(strtr($publicKey, '-_', '+/'))),
                'privateKey' => Base64Url::encode(base64_decode(strtr($privateKey, '-_', '+/'))),
            ],
        ];

        // Safari requires topic strings to be a multiple of 4 and exactly 32 chars.
        $typeAndId = $blueprint->getType() . strval($blueprint->getSubject()?->id ?? -1);
        $topic     = substr(str_pad(Base64Url::encode($typeAndId), 32, '0'), 0, 32);

        $webPush = new WebPush($auth, ['topic' => $topic]);
        $webPush->setReuseVAPIDHeaders(true);
        $webPush->setAutomaticPadding(false);

        foreach ($notifications as $notification) {
            $webPush->queueNotification($notification['subscription'], $notification['payload']);
        }

        $this->log("[PWA PUSH] Attempting to send {$sendingCount} notifications.");

        $sentCount = 0;

        /** @var MessageSentReport $report */
        foreach ($webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                $statusCode = $report->getResponse()?->getStatusCode();

                // Remove expired or invalid subscriptions.
                if (in_array($statusCode, [401, 403, 404, 410], true)) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                } else {
                    $this->log('[PWA PUSH] Notification failed for ' . $report->getEndpoint() . ': ' . $report->getReason());
                }
            } else {
                PushSubscription::where('endpoint', $report->getEndpoint())
                    ->update(['last_used' => Carbon::now()]);
                $sentCount++;
            }
        }

        $this->log("[PWA PUSH] Sent {$sentCount} notifications successfully.");
    }

    protected function buildPayload(BlueprintInterface $blueprint): array
    {
        $message = $this->notifications->build($blueprint);

        $payload = [
            'title'   => $message->title(),
            'content' => $message->body(),
            'link'    => $message->url(),
        ];

        if ($faviconPath = $this->settings->get('favicon_path')) {
            $payload['badge'] = $this->assetsFilesystem->url($faviconPath);
        }

        // Use the largest non-maskable PWA icon as the notification icon.
        // Maskable icons are excluded — they are designed to be cropped and
        // browsers do not use them for notification display.
        $icons = array_reverse(array_filter($this->getIcons(), function ($icon) {
            return !isset($icon['purpose']) || $icon['purpose'] !== 'maskable';
        }));
        if (!empty($icons)) {
            $payload['icon'] = array_values($icons)[0]['src'];
        } elseif ($logoPath = $this->settings->get('logo_path')) {
            $payload['icon'] = $this->assetsFilesystem->url($logoPath);
        }

        return $payload;
    }

    protected function log(string $message): void
    {
        if ($this->settings->get('resofire-pwa.debugMode', false)) {
            $this->logger->info($message);
        }
    }
}
