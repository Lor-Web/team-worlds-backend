/**
 * Глобальный реестр онлайн-пользователей (есть активное socket-соединение).
 * Ref-count: несколько вкладок = один online.
 */
const connectionCounts = new Map<string, number>();

export const presenceRegistry = {
  markConnected(userId: string): boolean {
    const previous = connectionCounts.get(userId) ?? 0;
    connectionCounts.set(userId, previous + 1);
    return previous === 0;
  },

  markDisconnected(userId: string): boolean {
    const previous = connectionCounts.get(userId) ?? 0;

    if (previous <= 1) {
      connectionCounts.delete(userId);
      return previous > 0;
    }

    connectionCounts.set(userId, previous - 1);
    return false;
  },

  isOnline(userId: string): boolean {
    return (connectionCounts.get(userId) ?? 0) > 0;
  },

  getOnlineUserIds(): string[] {
    return [...connectionCounts.keys()];
  },
};
