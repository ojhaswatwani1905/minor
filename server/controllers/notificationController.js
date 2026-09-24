import { readJson, writeJson } from '../utils/jsonDb.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await readJson('notifications');
    const { category, status } = req.query;

    let filtered = [...notifications];

    if (category && category !== 'All') {
      filtered = filtered.filter(n => n.type.toLowerCase().includes(category.toLowerCase()));
    }

    if (status && status !== 'All') {
      if (status === 'Unread') {
        filtered = filtered.filter(n => n.unread);
      } else if (status === 'Read') {
        filtered = filtered.filter(n => !n.unread);
      }
    }

    const unreadCount = notifications.filter(n => n.unread).length;

    res.json({
      success: true,
      unreadCount,
      notifications: filtered
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notifications = await readJson('notifications');
    const updated = notifications.map(n => ({ ...n, unread: false }));
    await writeJson('notifications', updated);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const clearNotifications = async (req, res, next) => {
  try {
    await writeJson('notifications', []);
    res.json({
      success: true,
      message: 'Notification history cleared'
    });
  } catch (error) {
    next(error);
  }
};
