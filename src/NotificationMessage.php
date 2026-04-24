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

class NotificationMessage
{
    public function __construct(
        protected string $title,
        protected string $body,
        protected ?string $url = null,
    ) {}

    public function title(): string
    {
        return $this->excerpt($this->title, 60);
    }

    public function body(): string
    {
        return $this->excerpt($this->body, 200);
    }

    public function url(): ?string
    {
        return $this->url;
    }

    private function excerpt(string $text, int $max): string
    {
        $text = strip_tags($text);

        if (mb_strlen($text) > $max) {
            $text = mb_substr($text, 0, $max) . '…';
        }

        return $text;
    }
}
