<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Resofire\PWA\Job;

use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Queue\AbstractJob;
use Resofire\PWA\PushSender;

class SendPushNotificationsJob extends AbstractJob
{
    public function __construct(
        private BlueprintInterface $blueprint,
        /** @var int[] */
        private array $recipientIds = [],
    ) {}

    public function handle(PushSender $sender): void
    {
        $sender->notify($this->blueprint, $this->recipientIds);
    }
}
