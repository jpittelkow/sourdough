<?php

namespace App\Enums;

enum Permission: string
{
    // Users
    case USERS_VIEW = 'users.view';
    case USERS_CREATE = 'users.create';
    case USERS_EDIT = 'users.edit';
    case USERS_DELETE = 'users.delete';

    // Groups
    case GROUPS_VIEW = 'groups.view';
    case GROUPS_MANAGE = 'groups.manage';

    // Settings
    case SETTINGS_VIEW = 'settings.view';
    case SETTINGS_EDIT = 'settings.edit';

    // Backups
    case BACKUPS_VIEW = 'backups.view';
    case BACKUPS_CREATE = 'backups.create';
    case BACKUPS_RESTORE = 'backups.restore';
    case BACKUPS_DELETE = 'backups.delete';

    // Logs
    case LOGS_VIEW = 'logs.view';
    case LOGS_EXPORT = 'logs.export';
    case AUDIT_VIEW = 'audit.view';

    /**
     * All permission values as strings.
     */
    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Permissions grouped by category for UI (e.g. permission matrix).
     *
     * @return array<string, array<self>>
     */
    public static function categories(): array
    {
        return [
            'Users' => [self::USERS_VIEW, self::USERS_CREATE, self::USERS_EDIT, self::USERS_DELETE],
            'Groups' => [self::GROUPS_VIEW, self::GROUPS_MANAGE],
            'Settings' => [self::SETTINGS_VIEW, self::SETTINGS_EDIT],
            'Backups' => [self::BACKUPS_VIEW, self::BACKUPS_CREATE, self::BACKUPS_RESTORE, self::BACKUPS_DELETE],
            'Logs' => [self::LOGS_VIEW, self::LOGS_EXPORT, self::AUDIT_VIEW],
        ];
    }
}
