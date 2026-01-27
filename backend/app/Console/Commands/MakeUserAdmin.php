<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeUserAdmin extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'user:make-admin {email : The email address of the user to make admin}';

    /**
     * The console command description.
     */
    protected $description = 'Promote a user to admin status';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return Command::FAILURE;
        }

        if ($user->is_admin) {
            $this->warn("User '{$user->name}' ({$email}) is already an admin.");
            return Command::SUCCESS;
        }

        $user->is_admin = true;
        $user->save();

        $this->info("User '{$user->name}' ({$email}) has been promoted to admin.");

        return Command::SUCCESS;
    }
}
