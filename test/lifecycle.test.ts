import { validateStatusTransition, getLegalTransitions } from '../lib/state-machine';

function runTests() {
  console.log('🧪 Starting Task Lifecycle and Business Rules Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // ---------------- TEST 1: Legal Transitions from Backlog ----------------
  console.log('Test Group 1: Backlog Transitions');
  const backlogTransitions = getLegalTransitions('Backlog');
  assert(
    backlogTransitions.length === 1 && backlogTransitions[0] === 'In Progress',
    'Backlog should only offer In Progress as a next state',
    JSON.stringify(backlogTransitions)
  );

  const resBacklogToProgress = validateStatusTransition('Backlog', 'In Progress');
  assert(resBacklogToProgress.valid === true, 'Backlog -> In Progress should be valid');

  const resBacklogToDone = validateStatusTransition('Backlog', 'Done');
  assert(
    resBacklogToDone.valid === false && resBacklogToDone.reason?.includes('In Progress'),
    'Backlog -> Done must be rejected by server with clear reason',
    resBacklogToDone.reason
  );

  // ---------------- TEST 2: In Progress Transitions & Blocking ----------------
  console.log('\nTest Group 2: In Progress Transitions & Blocking');
  const resProgressToDone = validateStatusTransition('In Progress', 'Done');
  assert(
    resProgressToDone.valid === false && resProgressToDone.reason?.includes('In Review'),
    'In Progress -> Done directly must be rejected (must go to In Review first)',
    resProgressToDone.reason
  );

  const resProgressToBlocked = validateStatusTransition('In Progress', 'Blocked');
  assert(
    resProgressToBlocked.valid === true && resProgressToBlocked.newPreviousStatus === 'In Progress',
    'In Progress -> Blocked must be valid and remember previousStatus = In Progress'
  );

  // ---------------- TEST 3: Unblocking Rules ----------------
  console.log('\nTest Group 3: Unblocking Rules');
  const resUnblockValid = validateStatusTransition('Blocked', 'In Progress', 'In Progress');
  assert(
    resUnblockValid.valid === true && resUnblockValid.newPreviousStatus === null,
    'Blocked (from In Progress) -> In Progress should unblock cleanly'
  );

  const resUnblockInvalid = validateStatusTransition('Blocked', 'Done', 'In Progress');
  assert(
    resUnblockInvalid.valid === false && resUnblockInvalid.reason?.includes('previous state'),
    'Blocked -> Done directly must be rejected',
    resUnblockInvalid.reason
  );

  const resBlockedFromReview = validateStatusTransition('In Review', 'Blocked');
  assert(
    resBlockedFromReview.valid === true && resBlockedFromReview.newPreviousStatus === 'In Review',
    'In Review -> Blocked must store previousStatus = In Review'
  );

  const resUnblockToReview = validateStatusTransition('Blocked', 'In Review', 'In Review');
  assert(
    resUnblockToReview.valid === true,
    'Blocked (from In Review) -> In Review should be valid'
  );

  // ---------------- TEST 4: Blocker Dependency Enforcement ----------------
  console.log('\nTest Group 4: Blocker Dependency Enforcement');
  const unfinishedBlockers = [{ key: 'APEX-2', title: 'WebSocket Engine', status: 'In Review' }];
  const resReviewToDoneBlocked = validateStatusTransition('In Review', 'Done', null, unfinishedBlockers);
  assert(
    resReviewToDoneBlocked.valid === false && resReviewToDoneBlocked.reason?.includes('APEX-2 (In Review)'),
    'In Review -> Done MUST be rejected if blocking task is unfinished',
    resReviewToDoneBlocked.reason
  );

  const resReviewToDoneClear = validateStatusTransition('In Review', 'Done', null, []);
  assert(
    resReviewToDoneClear.valid === true,
    'In Review -> Done MUST succeed when zero unfinished blockers remain'
  );

  // ---------------- TEST 5: Reopening Finished Tasks ----------------
  console.log('\nTest Group 5: Reopening Finished Tasks');
  const resReopenToProgress = validateStatusTransition('Done', 'In Progress');
  assert(resReopenToProgress.valid === true, 'Done -> In Progress (Reopen) should be valid');

  const resReopenToBacklog = validateStatusTransition('Done', 'Backlog');
  assert(resReopenToBacklog.valid === true, 'Done -> Backlog (Reopen) should be valid');

  const resReopenIllegal = validateStatusTransition('Done', 'Blocked');
  assert(
    resReopenIllegal.valid === false,
    'Done -> Blocked directly should be rejected'
  );

  console.log(`\n========================================`);
  console.log(`🏁 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
