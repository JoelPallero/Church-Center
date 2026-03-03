<?php

require_once __DIR__ . '/../backend/src/bootstrap.php';

use App\Services\AccessControlService;
use App\Repositories\UserRepo;

echo "--- ACCESS CONTROL SERVICE TEST ---\n";

// Test 1: Check permission for a user
$testUserId = 1; // Assuming user 1 exists
$permission = 'church.read';

echo "Testing Permission: $permission for User: $testUserId\n";
$can = AccessControlService::can($testUserId, $permission);
echo "Result: " . ($can ? "ALLOWED" : "DENIED") . "\n";

// Test 2: Check subscription (should always be true for now)
echo "Testing Subscription status for User: $testUserId\n";
$status = AccessControlService::getSubscriptionStatus($testUserId, 'member');
echo "Status: " . $status['status'] . "\n";

echo "--- TEST COMPLETE ---\n";
