<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIProvider extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'ai_providers';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'provider',
        'api_key',
        'model',
        'is_enabled',
        'is_primary',
        'settings',
        'last_test_at',
        'last_test_success',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'api_key',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',
            'is_enabled' => 'boolean',
            'is_primary' => 'boolean',
            'settings' => 'array',
            'last_test_at' => 'datetime',
            'last_test_success' => 'boolean',
        ];
    }

    /**
     * The user this provider belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter enabled providers.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope to get the primary provider.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }
}
