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

use Carbon\Carbon;
use Flarum\Database\AbstractModel;
use Flarum\User\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int         $id
 * @property int         $user_id
 * @property string      $endpoint
 * @property string      $vapid_public_key
 * @property string|null $keys
 * @property Carbon|null $expires_at
 * @property Carbon|null $last_used
 * @property User|null   $user
 */
class PushSubscription extends AbstractModel
{
    protected $table = 'resofire_pwa_push_subscriptions';

    protected $dates = ['expires_at', 'last_used'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
