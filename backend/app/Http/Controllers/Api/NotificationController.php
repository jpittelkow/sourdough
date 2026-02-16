<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\Notifications\NotificationOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationOrchestrator $notificationOrchestrator
    ) {}

    /**
     * Get user notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $user->notifications()->orderBy('created_at', 'desc');

        if ($request->boolean('unread')) {
            $query->unread();
        }

        $perPage = min((int) $request->input('per_page', config('app.pagination.default')), 100);
        $notifications = $query->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->notifications()->unread()->count();

        return response()->json([
            'count' => $count,
        ]);
    }

    /**
     * Mark notifications as read.
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'uuid'],
        ]);

        $request->user()
            ->notifications()
            ->whereIn('id', $validated['ids'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()
            ->notifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        // Ensure user owns this notification
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Notification not found',
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Test a notification channel.
     */
    public function test(Request $request, string $channel): JsonResponse
    {
        if (!NotificationOrchestrator::isKnownChannel($channel)) {
            return response()->json([
                'message' => 'Unknown notification channel',
                'error' => "Channel '{$channel}' is not a recognized notification channel.",
            ], 422);
        }

        $user = $request->user();

        try {
            $this->notificationOrchestrator->sendTestNotification($user, $channel);

            return response()->json([
                'message' => 'Test notification sent',
                'channel' => $channel,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Test notification failed', [
                'channel' => $channel,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to send test notification',
                'error' => 'The test notification could not be sent. Check channel configuration.',
            ], 400);
        }
    }
}
