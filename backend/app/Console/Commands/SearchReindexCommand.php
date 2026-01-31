<?php

namespace App\Console\Commands;

use App\Models\AIProvider;
use App\Models\ApiToken;
use App\Models\EmailTemplate;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserGroup;
use App\Models\Webhook;
use App\Services\Search\SearchService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class SearchReindexCommand extends Command
{
    /**
     * Searchable model name to class map.
     *
     * @var array<string, class-string>
     */
    protected static array $searchableModels = [
        'users' => User::class,
        'user_groups' => UserGroup::class,
        'notifications' => Notification::class,
        'email_templates' => EmailTemplate::class,
        'notification_templates' => NotificationTemplate::class,
        'api_tokens' => ApiToken::class,
        'ai_providers' => AIProvider::class,
        'webhooks' => Webhook::class,
    ];

    protected $signature = 'search:reindex
        {model? : Model name to reindex (users, user_groups, pages, etc.). Omit to reindex all.}';

    protected $description = 'Reindex searchable models for Meilisearch/Scout.';

    public function handle(): int
    {
        $modelArg = $this->argument('model');

        if ($modelArg !== null) {
            $modelArg = strtolower($modelArg);

            if ($modelArg === 'pages') {
                return $this->reindexPages();
            }

            if (! isset(static::$searchableModels[$modelArg])) {
                $available = array_merge(array_keys(static::$searchableModels), ['pages']);
                $this->error("Unknown model: {$modelArg}. Available: " . implode(', ', $available));

                return self::FAILURE;
            }
            $models = [$modelArg => static::$searchableModels[$modelArg]];
        } else {
            $this->reindexPages();
            $models = static::$searchableModels;
        }

        foreach ($models as $name => $class) {
            $this->info("Reindexing {$name}...");
            try {
                Artisan::call('scout:import', ['model' => $class]);
                $output = trim(Artisan::output());
                if ($output !== '') {
                    $this->line($output);
                }
                $this->info("Reindexed {$name}.");
            } catch (\Throwable $e) {
                $this->error("Reindex failed for {$name}: " . $e->getMessage());

                return self::FAILURE;
            }
        }

        $this->info('Search reindex completed.');

        return self::SUCCESS;
    }

    protected function reindexPages(): int
    {
        $this->info('Syncing pages index...');

        try {
            $service = app(SearchService::class);
            $result = $service->syncPagesToIndex();
            $this->info("Pages index synced: {$result['count']} pages");

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Pages sync failed: ' . $e->getMessage());

            return self::FAILURE;
        }
    }
}
