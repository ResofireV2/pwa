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

class UploadIconController implements RequestHandlerInterface
{
    public function __construct(
        protected IconService $iconService,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();

        $file = ($request->getUploadedFiles())['icon-source'] ?? null;

        if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
            return new JsonResponse(['error' => 'No valid file uploaded.'], 422);
        }

        $allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!in_array($file->getClientMediaType(), $allowedMimes, true)) {
            return new JsonResponse(['error' => 'File must be a PNG, JPEG, GIF, or WebP image.'], 422);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return new JsonResponse(['error' => 'File must not exceed 5 MB.'], 422);
        }

        try {
            $generated = $this->iconService->generateFromUpload($file);
        } catch (DecoderException $e) {
            return new JsonResponse(['error' => 'The uploaded file could not be read as an image.'], 422);
        }

        return new JsonResponse([
            'generated' => $generated,
        ]);
    }
}
