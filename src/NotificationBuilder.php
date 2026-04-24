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

use Flarum\Discussion\Discussion;
use Flarum\Http\UrlGenerator;
use Flarum\Locale\TranslatorInterface;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\Post\CommentPost;
use Flarum\Post\Post;
use Flarum\User\User;
use ReflectionClass;

class NotificationBuilder
{
    /**
     * Blueprint classes that do not implement MailableInterface but whose
     * push notifications we can still construct a meaningful message for.
     */
    private const SUPPORTED_NON_MAILABLE = [
        'Flarum\Likes\Notification\PostLikedBlueprint',
        'Flarum\Notification\DiscussionRenamedBlueprint',
    ];

    public function __construct(
        protected TranslatorInterface $translator,
        protected UrlGenerator $url,
    ) {}

    /**
     * Returns true if we can build a push notification for this blueprint class.
     */
    public function supports(string $blueprintClass): bool
    {
        return (new ReflectionClass($blueprintClass))->implementsInterface(MailableInterface::class)
            || in_array($blueprintClass, self::SUPPORTED_NON_MAILABLE, true);
    }

    public function build(BlueprintInterface $blueprint): NotificationMessage
    {
        return new NotificationMessage(
            $this->buildTitle($blueprint),
            $this->buildBody($blueprint),
            $this->buildUrl($blueprint),
        );
    }

    private function buildTitle(BlueprintInterface $blueprint): string
    {
        if ($blueprint instanceof MailableInterface) {
            return $blueprint->getEmailSubject($this->translator);
        }

        // postLiked does not implement MailableInterface but we can still
        // generate a useful title from its translation key.
        if ($blueprint::getType() === 'postLiked' && $blueprint->getFromUser()) {
            return $this->translator->trans(
                'flarum-likes.forum.notifications.post_liked_text',
                ['username' => $blueprint->getFromUser()->getDisplayNameAttribute()]
            );
        }

        return '';
    }

    private function buildBody(BlueprintInterface $blueprint): string
    {
        $subject = $blueprint->getSubject();
        if (!$subject) return '';

        switch ($blueprint::getSubjectModel()) {
            case Discussion::class:
                /** @var Discussion $subject */
                $post = $subject->mostRelevantPost ?? $subject->firstPost ?? $subject->comments->first();
                return $post ? $post->formatContent() : '';

            case Post::class:
                /** @var Post $subject */
                return $subject instanceof CommentPost ? $subject->formatContent() : '';
        }

        return '';
    }

    private function buildUrl(BlueprintInterface $blueprint): string
    {
        $subject = $blueprint->getSubject();
        if (!$subject) return $this->url->to('forum')->base();

        switch ($blueprint::getSubjectModel()) {
            case User::class:
                /** @var User $subject */
                return $this->url->to('forum')->route('user', ['username' => $subject->display_name]);

            case Discussion::class:
                /** @var Discussion $subject */
                return $this->url->to('forum')->route('discussion', ['id' => $subject->id]);

            case Post::class:
                /** @var Post $subject */
                return $this->url->to('forum')->route('discussion', [
                    'id'   => $subject->discussion_id,
                    'near' => $subject->number,
                ]);
        }

        return $this->url->to('forum')->base();
    }
}
