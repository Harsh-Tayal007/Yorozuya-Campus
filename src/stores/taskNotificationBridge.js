/**
 * When a task reminder fires, this adds a synthetic "task" notification
 * into the useNotifications query cache so it appears in the bell dropdown.
 *
 * Usage — call injectTaskNotification() from scheduleReminders() in TaskTracker.
 */

let _queryClient = null;
let _userId      = null;

export function initTaskNotificationBridge(queryClient, userId) {
  _queryClient = queryClient;
  _userId      = userId;
}

export function injectTaskNotification(task) {
  if (!_queryClient || !_userId) return;

  const notif = {
    $id:        `task-reminder-${task.id}`,
    $createdAt: new Date().toISOString(),
    type:       "task",
    read:       false,
    title:      task.title,
    message:    task.dueDate
      ? `Due: ${new Date(task.dueDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}`
      : "Reminder",
    // No actor fields needed for task type
    actorName:  null,
    actorAvatar: null,
    threadId:   null,
    replyId:    null,
    replyContent: null,
  };

  // Prepend to notifications list
  _queryClient.setQueryData(["notifications", _userId], (old = []) => {
    // Don't duplicate if already present
    if (old.some(n => n.$id === notif.$id)) return old;
    return [notif, ...old];
  });

  // Bump unread count
  _queryClient.setQueryData(["notifications-unread", _userId], (old = 0) => old + 1);
}