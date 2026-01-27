<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
        'secret',
        'events',
        'active',
        'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'events' => 'array',
            'active' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    /**
     * Get the webhook deliveries.
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    /**
     * Check if webhook should be triggered for an event.
     */
    public function shouldTrigger(string $event): bool
    {
        return $this->active && in_array($event, $this->events ?? []);
    }
}
