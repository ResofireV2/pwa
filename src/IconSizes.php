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

final class IconSizes
{
    /**
     * All icon sizes generated from the source image, in ascending order.
     *
     * 48  — Favicon fallback
     * 96  — Notification badge
     * 144 — Windows tile
     * 152 — iPad home screen
     * 180 — Apple touch icon (required for iOS installability)
     * 192 — Android home screen (required for Android installability)
     * 384 — Android splash screen
     * 512 — Manifest install icon
     */
    public const ALL = [48, 96, 144, 152, 180, 192, 384, 512];

    /**
     * Sizes that must be present for the PWA to be installable.
     * Used by the status health checks.
     */
    public const REQUIRED = [192, 180];

    private function __construct() {}
}
