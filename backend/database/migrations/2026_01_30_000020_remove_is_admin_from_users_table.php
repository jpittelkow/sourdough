<?php

use App\Services\GroupService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensure default groups exist, then data-migrate is_admin to group membership and drop the column.
     */
    public function up(): void
    {
        // Always ensure default groups exist (idempotent) - needed for fresh installs too
        app(GroupService::class)->ensureDefaultGroupsExist();

        // Skip is_admin migration if column doesn't exist (fresh install)
        if (!Schema::hasColumn('users', 'is_admin')) {
            return;
        }

        $adminGroupId = DB::table('user_groups')->where('slug', 'admin')->value('id');
        $userGroupId = DB::table('user_groups')->where('is_default', true)->value('id');

        if (!$adminGroupId || !$userGroupId) {
            throw new \RuntimeException('Default groups (admin, user) must exist. Run user_groups migration and GroupService::ensureDefaultGroupsExist first.');
        }

        $now = now();

        foreach (DB::table('users')->where('is_admin', true)->pluck('id') as $userId) {
            DB::table('user_group_members')->insertOrIgnore([
                'user_id' => $userId,
                'group_id' => $adminGroupId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        foreach (DB::table('users')->where('is_admin', false)->pluck('id') as $userId) {
            $inAnyGroup = DB::table('user_group_members')->where('user_id', $userId)->exists();
            if (!$inAnyGroup) {
                DB::table('user_group_members')->insertOrIgnore([
                    'user_id' => $userId,
                    'group_id' => $userGroupId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('avatar');
        });

        $adminGroupId = DB::table('user_groups')->where('slug', 'admin')->value('id');
        if ($adminGroupId) {
            $adminUserIds = DB::table('user_group_members')
                ->where('group_id', $adminGroupId)
                ->pluck('user_id');
            DB::table('users')->whereIn('id', $adminUserIds)->update(['is_admin' => true]);
        }
    }
};
