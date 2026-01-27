<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'group',
        'key',
        'value',
        'is_public',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json', // Use 'json' instead of 'array' to support all JSON-serializable types
            'is_public' => 'boolean',
        ];
    }

    /**
     * Get the user who last updated this setting.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get a system setting value.
     */
    public static function get(string $key, mixed $default = null, string $group = 'general'): mixed
    {
        $setting = static::where('group', $group)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }

    /**
     * Set a system setting value.
     */
    public static function set(string $key, mixed $value, string $group = 'general', ?int $updatedBy = null, bool $isPublic = false): void
    {
        static::updateOrCreate(
            [
                'group' => $group,
                'key' => $key,
            ],
            [
                'value' => $value,
                'updated_by' => $updatedBy,
                'is_public' => $isPublic,
            ]
        );
    }

    /**
     * Get all settings for a group.
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->get()
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Get all public settings.
     */
    public static function getPublic(): array
    {
        return static::where('is_public', true)
            ->get()
            ->groupBy('group')
            ->map(fn ($group) => $group->pluck('value', 'key'))
            ->toArray();
    }
}
