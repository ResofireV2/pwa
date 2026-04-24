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

use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\Driver\NotificationDriverInterface;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Contracts\Queue\Queue;
use Illuminate\Support\Arr;
use ReflectionClass;
use Resofire\PWA\Job\SendPushNotificationsJob;

class PushNotificationDriver implements NotificationDriverInterface
{
    public function __construct(
        protected Queue $queue,
        protected SettingsRepositoryInterface $settings,
        protected NotificationBuilder $notifications,
    ) {}

    public function registerType(string $blueprintClass, array $driversEnabledByDefault): void
    {
        if (!$this->notifications->supports($blueprintClass)) {
            return;
        }

        User::registerPreference(
            User::getNotificationPreferenceKey($blueprintClass::getType(), 'push'),
            boolval(...),
            in_array('push', $driversEnabledByDefault, true)
        );
    }

    public function send(BlueprintInterface $blueprint, array $users): void
    {
        if (!$this->notifications->supports(get_class($blueprint))) {
            return;
        }

        $users = array_filter($users, function (User $user) use ($blueprint) {
            return $user->getPreference(
                User::getNotificationPreferenceKey($blueprint::getType(), 'push')
            );
        });

        if (empty($users)) {
            return;
        }

        $userIds = Arr::pluck($users, 'id');

        $this->queue->push(new SendPushNotificationsJob($blueprint, $userIds));
    }
}
