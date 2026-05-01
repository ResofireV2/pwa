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

use Flarum\Http\RequestUtil;
use Intervention\Image\Exceptions\DecoderException;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Resofire\PWA\Services\IconService;

class UploadBadgeController implements RequestHandlerInterface
{
    public function __construct(
        protected IconService $iconService,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $files = $request->getUploadedFiles();
        $file  = $files['badge'] ?? null;

        if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
            return new JsonResponse(['error' => 'No valid file uploaded.'], 422);
        }

        $mimeType = $file->getClientMediaType();
        if (!in_array($mimeType, ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true)) {
            return new JsonResponse(['error' => 'Badge must be a PNG, JPEG, GIF, or WebP image.'], 422);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return new JsonResponse(['error' => 'File must not exceed 5 MB.'], 422);
        }

        try {
            $result = $this->iconService->generateBadge($file);
        } catch (DecoderException $e) {
            return new JsonResponse(['error' => 'The uploaded file could not be read as an image.'], 422);
        }

        return new JsonResponse([
            'path' => $result['path'],
            'url'  => $result['url'],
        ]);
    }
}
