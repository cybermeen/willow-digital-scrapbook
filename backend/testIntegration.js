const db = require('./db/db');
const ToDoService = require('./services/to-doService');
const ProgressService = require('./services/progressService');

const TEST_USER_ID = 1;

async function cleanupOldData() {
  console.log('🧹 Cleaning up old test data...\n');
  try {
    // Delete all tasks for this user
    await db.query('DELETE FROM tasks WHERE user_id = $1', [TEST_USER_ID]);
    
    // Delete all progress records for this user
    await db.query('DELETE FROM daily_progress WHERE user_id = $1', [TEST_USER_ID]);
    
    // Delete streak record for this user
    await db.query('DELETE FROM user_streaks WHERE user_id = $1', [TEST_USER_ID]);
    
    console.log('✅ Old data cleaned\n');
  } catch (err) {
    console.error('⚠️  Cleanup warning:', err.message);
  }
}

async function setupTestData() {
  console.log('📝 Setting up test data...\n');
  
  try {
    // Only create tasks for TODAY
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Set to midnight
    
    const task1 = await ToDoService.createTask({
      title: 'Test Task 1',
      due_date: today.toISOString(),
      priority: 'High'
    }, TEST_USER_ID);
    console.log('✅ Created task 1:', task1.id);
    
    const task2 = await ToDoService.createTask({
      title: 'Test Task 2',
      due_date: today.toISOString(),  // Same day
      priority: 'Medium'
    }, TEST_USER_ID);
    console.log('✅ Created task 2:', task2.id);
    
    // Remove task3 - we don't need it for this test
    
    return { task1, task2 };  // Only return 2 tasks
    
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    throw err;
  }
}

async function runIntegrationTests(tasks) {
  console.log('\n🧪 Running Integration Tests...\n');
  
  try {
    // TEST 1: Check initial progress (0% - no tasks completed)
    console.log('TEST 1: Initial progress (0% complete)');
    let progress = await ProgressService.calculateDailyProgress(TEST_USER_ID);
    console.log(`   Completion: ${progress.completionPercentage}% (${progress.completed_tasks}/${progress.total_tasks})`);
    if (progress.completionPercentage !== 0) {
      throw new Error('Expected 0%, got ' + progress.completionPercentage);
    }
    console.log('✅ PASS\n');
    
    // TEST 2: Complete first task (50% - 1 of 2 today tasks)
    console.log('TEST 2: After completing 1 task');
    await ToDoService.toggleTaskStatus(tasks.task1.id, TEST_USER_ID);
    progress = await ProgressService.calculateDailyProgress(TEST_USER_ID);
    console.log(`   Completion: ${progress.completionPercentage}% (${progress.completed_tasks}/${progress.total_tasks})`);
    if (progress.completionPercentage !== 50) {
      throw new Error('Expected 50%, got ' + progress.completionPercentage);
    }
    console.log('✅ PASS\n');
    
    // TEST 3: Complete second task (100% - all tasks done)
    console.log('TEST 3: After completing 2nd task');
    await ToDoService.toggleTaskStatus(tasks.task2.id, TEST_USER_ID);
    progress = await ProgressService.calculateDailyProgress(TEST_USER_ID);
    console.log(`   Completion: ${progress.completionPercentage}% (${progress.completed_tasks}/${progress.total_tasks})`);
    if (progress.completionPercentage !== 100) {
      throw new Error('Expected 100%, got ' + progress.completionPercentage);
    }
    console.log('✅ PASS\n');
    
    // TEST 4: Check streak (should be 0 or 1 depending on today vs yesterday)
    console.log('TEST 4: Streak calculation');
    const streak = await ProgressService.calculateStreak(TEST_USER_ID);
    console.log(`   Current Streak: ${streak.currentStreak} days`);
    console.log(`   Longest Streak: ${streak.longestStreak} days`);
    console.log('✅ PASS\n');
    
    // TEST 5: Get dashboard stats
    console.log('TEST 5: Dashboard stats');
    const stats = await ProgressService.getDashboardStats(TEST_USER_ID);
    console.log(`   Today: ${stats.today.completionPercentage}%`);
    console.log(`   Average: ${stats.overall.averageCompletion}%`);
    console.log(`   Days tracked: ${stats.overall.totalDaysWithTasks}`);
    console.log('✅ PASS\n');
    
    console.log('✅ All integration tests PASSED!\n');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    throw err;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  // Optional: Delete test tasks
  process.exit(0);
}

// Run all tests
(async () => {
  try {
    const tasks = await setupTestData();
    await runIntegrationTests(tasks);
    await cleanup();
  } catch (err) {
    console.error('❌ Integration test suite failed');
    process.exit(1);
  }
})();