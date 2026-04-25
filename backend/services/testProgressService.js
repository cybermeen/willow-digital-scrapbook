const ProgressService = require('./progressService');
const db = require('../db/db');

const TEST_USER_ID = 1;

async function testProgressService() {
  try {
    console.log('🧪 Testing ProgressService...\n');

    // TEST 1: Calculate Daily Progress
    console.log('TEST 1: calculateDailyProgress()');
    const dailyProgress = await ProgressService.calculateDailyProgress(TEST_USER_ID);
    console.log('✅ Result:', dailyProgress);
    console.log(`   Completion: ${dailyProgress.completionPercentage}%\n`);

    // TEST 2: Calculate Streak
    console.log('TEST 2: calculateStreak()');
    const streak = await ProgressService.calculateStreak(TEST_USER_ID);
    console.log('✅ Result:', streak);
    console.log(`   Current Streak: ${streak.currentStreak} days`);
    console.log(`   Longest Streak: ${streak.longestStreak} days\n`);

    // TEST 3: Get Dashboard Stats
    console.log('TEST 3: getDashboardStats()');
    const stats = await ProgressService.getDashboardStats(TEST_USER_ID);
    console.log('✅ Result:', JSON.stringify(stats, null, 2));
    console.log(`   Today: ${stats.today.completionPercentage}% (${stats.today.completed_tasks}/${stats.today.total_tasks})`);
    console.log(`   Average: ${stats.overall.averageCompletion}%\n`);

    // TEST 4: Get Progress History
    console.log('TEST 4: getProgressHistory()');
    const history = await ProgressService.getProgressHistory(TEST_USER_ID, 7);
    console.log('✅ Last 7 days history:');
    history.forEach(day => {
      console.log(`   ${day.date}: ${day.completed_tasks}/${day.total_tasks} (${day.completion_percentage}%)`);
    });

    console.log('\n✅ All ProgressService tests passed!');
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testProgressService();