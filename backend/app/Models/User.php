<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\ApiToken;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'email_verified_at',
        'is_admin',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_recovery_codes' => 'encrypted:array',
        ];
    }

    /**
     * Check if user has two-factor authentication enabled.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_enabled && $this->two_factor_confirmed_at !== null;
    }

    /**
     * Social accounts (SSO)
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * User settings
     */
    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }

    /**
     * User notifications
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * AI provider configurations
     */
    public function aiProviders(): HasMany
    {
        return $this->hasMany(AIProvider::class);
    }

    /**
     * API tokens
     */
    public function apiTokens(): HasMany
    {
        return $this->hasMany(ApiToken::class);
    }

    /**
     * Get a specific setting value.
     * 
     * Supports two signatures:
     * - getSetting('group', 'key', 'default') - group-based (new)
     * - getSetting('key', 'default') - legacy (backward compatible)
     * 
     * @param string $groupOrKey The setting group (new) or key (legacy)
     * @param mixed $keyOrDefault The setting key (new) or default value (legacy)
     * @param mixed $default Default value if setting doesn't exist (new signature only)
     * @return mixed
     */
    public function getSetting(string $groupOrKey, mixed $keyOrDefault = null, mixed $default = null): mixed
    {
        // New signature: getSetting('group', 'key', 'default')
        // Check if we have 3 args and second is a string (indicating it's a key, not a default)
        if (func_num_args() >= 2 && is_string($keyOrDefault)) {
            $group = $groupOrKey;
            $key = $keyOrDefault;
            $setting = $this->settings()
                ->where('group', $group)
                ->where('key', $key)
                ->first();
            return $setting ? $setting->value : ($default ?? null);
        }
        
        // Legacy signature: getSetting('key', 'default')
        $key = $groupOrKey;
        $defaultValue = $keyOrDefault;
        $setting = $this->settings()->where('key', $key)->first();
        return $setting ? $setting->value : $defaultValue;
    }

    /**
     * Set a setting value.
     * 
     * Supports two signatures:
     * - setSetting('group', 'key', 'value') - group-based (new)
     * - setSetting('key', 'value', 'group') - legacy (backward compatible)
     * 
     * @param string $groupOrKey The setting group (new) or key (legacy)
     * @param mixed $keyOrValue The setting key (new) or value (legacy)
     * @param mixed $valueOrGroup The value to set (new) or group (legacy)
     * @return Setting
     */
    public function setSetting(string $groupOrKey, mixed $keyOrValue, mixed $valueOrGroup = 'general'): Setting
    {
        // New signature: setSetting('group', 'key', 'value')
        // Check if second param is a string (key) and third is not a string (value)
        if (func_num_args() >= 3 && is_string($keyOrValue) && !is_string($valueOrGroup)) {
            $group = $groupOrKey;
            $key = $keyOrValue;
            $value = $valueOrGroup;
            return $this->settings()->updateOrCreate(
                ['group' => $group, 'key' => $key],
                ['value' => $value]
            );
        }
        
        // Legacy signature: setSetting('key', 'value', 'group')
        $key = $groupOrKey;
        $value = $keyOrValue;
        $group = is_string($valueOrGroup) ? $valueOrGroup : 'general';
        return $this->settings()->updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group]
        );
    }

    /**
     * Check if user has admin privileges.
     */
    public function isAdmin(): bool
    {
        return $this->is_admin === true;
    }
}
