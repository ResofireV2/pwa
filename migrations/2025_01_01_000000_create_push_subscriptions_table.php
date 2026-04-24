<?php

/*
 * This file is part of resofire/pwa.
 *
 * Copyright (c) Resofire.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

return Migration::createTableIfNotExists(
    'resofire_pwa_push_subscriptions',
    function (Blueprint $table) {
        $table->increments('id');
        $table->string('endpoint')->unique();
        $table->string('vapid_public_key');
        $table->string('keys')->nullable();
        $table->timestamp('expires_at')->nullable();
        $table->dateTime('last_used')->nullable();
        $table->unsignedInteger('user_id');

        $table->foreign('user_id')
              ->references('id')
              ->on('users')
              ->onDelete('cascade');
    }
);
