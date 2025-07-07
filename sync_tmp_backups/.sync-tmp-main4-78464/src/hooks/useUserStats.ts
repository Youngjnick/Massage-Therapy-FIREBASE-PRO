import { useEffect, useState } from 'react';

export function useUserStats(userId: string, getUserStats: (uid: string) => Promise<any[]>) {
  const [userStats, setUserStats] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    getUserStats(userId).then(setUserStats);
  }, [userId, getUserStats]);
  return userStats;
}
