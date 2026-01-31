<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notification_templates')) {
            return;
        }

        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('channel_group');
            $table->string('title');
            $table->text('body');
            $table->json('variables')->nullable();
            $table->boolean('is_system')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['type', 'channel_group']);
        });

        (new \Database\Seeders\NotificationTemplateSeeder())->run();
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_templates');
    }
};
