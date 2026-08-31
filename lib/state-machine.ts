export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';

export const TASK_STATUSES: TaskStatus[] = ['Backlog', 'In Progress', 'In Review', 'Done', 'Blocked'];

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
  newPreviousStatus?: string | null;
}

/**
 * Returns the list of legal target statuses for a task given its current state and previous status.
 */
export function getLegalTransitions(currentStatus: string, previousStatus?: string | null): TaskStatus[] {
  switch (currentStatus) {
    case 'Backlog':
      return ['In Progress'];
    case 'In Progress':
      return ['In Review', 'Blocked', 'Backlog'];
    case 'In Review':
      return ['Done', 'In Progress', 'Blocked', 'Backlog'];
    case 'Blocked':
      // Unblocking must return it to the state it was blocked from
      if (previousStatus === 'In Review') {
        return ['In Review'];
      }
      return ['In Progress'];
    case 'Done':
      // Finished tasks can be reopened to Backlog or In Progress
      return ['In Progress', 'Backlog'];
    default:
      return [];
  }
}

/**
 * Validates whether a status transition is permitted under the strict project rules.
 */
export function validateStatusTransition(
  currentStatus: string,
  targetStatus: string,
  previousStatus?: string | null,
  unfinishedBlockers: Array<{ key: string; title: string; status: string }> = []
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return { valid: true, newPreviousStatus: previousStatus };
  }

  // 1. Moving to Blocked is only allowed from 'In Progress' or 'In Review'
  if (targetStatus === 'Blocked') {
    if (currentStatus !== 'In Progress' && currentStatus !== 'In Review') {
      return {
        valid: false,
        reason: `A task can only be marked as 'Blocked' from 'In Progress' or 'In Review' (current status: '${currentStatus}').`,
      };
    }
    return {
      valid: true,
      newPreviousStatus: currentStatus, // remember which state it was blocked from
    };
  }

  // 2. Unblocking from 'Blocked'
  if (currentStatus === 'Blocked') {
    const expectedReturn = previousStatus === 'In Review' ? 'In Review' : 'In Progress';
    if (targetStatus !== expectedReturn) {
      return {
        valid: false,
        reason: `Unblocking this task must return it to its previous state ('${expectedReturn}'), not '${targetStatus}'.`,
      };
    }
    return {
      valid: true,
      newPreviousStatus: null, // clear previous status after successful unblock
    };
  }

  // 3. Moving from Backlog
  if (currentStatus === 'Backlog') {
    if (targetStatus !== 'In Progress') {
      return {
        valid: false,
        reason: `Tasks in 'Backlog' must first move to 'In Progress' before progressing further (attempted: '${targetStatus}').`,
      };
    }
    return { valid: true, newPreviousStatus: null };
  }

  // 4. Moving from In Progress
  if (currentStatus === 'In Progress') {
    if (targetStatus === 'Done') {
      return {
        valid: false,
        reason: `Tasks cannot jump straight from 'In Progress' to 'Done'. They must move to 'In Review' first.`,
      };
    }
    if (targetStatus === 'In Review' || targetStatus === 'Backlog') {
      return { valid: true, newPreviousStatus: null };
    }
    return {
      valid: false,
      reason: `Illegal transition from 'In Progress' to '${targetStatus}'.`,
    };
  }

  // 5. Moving from In Review
  if (currentStatus === 'In Review') {
    if (targetStatus === 'Done') {
      // Check unfinished blocking tasks
      if (unfinishedBlockers.length > 0) {
        const blockerKeys = unfinishedBlockers.map((b) => `${b.key} (${b.status})`).join(', ');
        return {
          valid: false,
          reason: `Cannot move task to 'Done' because it is blocked by unfinished tasks: ${blockerKeys}. All blocking tasks must be Done first.`,
        };
      }
      return { valid: true, newPreviousStatus: null };
    }
    if (targetStatus === 'In Progress' || targetStatus === 'Backlog') {
      return { valid: true, newPreviousStatus: null };
    }
    return {
      valid: false,
      reason: `Illegal transition from 'In Review' to '${targetStatus}'.`,
    };
  }

  // 6. Moving from Done (Reopening)
  if (currentStatus === 'Done') {
    if (targetStatus === 'In Progress' || targetStatus === 'Backlog') {
      return { valid: true, newPreviousStatus: null };
    }
    return {
      valid: false,
      reason: `Reopening a 'Done' task is only allowed to 'In Progress' or 'Backlog' (attempted: '${targetStatus}').`,
    };
  }

  return {
    valid: false,
    reason: `Invalid status transition from '${currentStatus}' to '${targetStatus}'.`,
  };
}
