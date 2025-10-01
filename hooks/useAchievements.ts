import { useCallback, useEffect, useMemo, useState } from 'react';
import { evaluateAchievementsAfterRun, getAchievements, type SkinId } from '../services/gameApi';

type AchState = Record<string, { unlocked: boolean; progress?: number }>; 

// Хук для работы с достижениями: загрузка, оценка после забега, список разблокировок
export const useAchievements = () => {
  const [state, setState] = useState<AchState>({});
  const [recentUnlocks, setRecentUnlocks] = useState<{ ach: string[]; skins: SkinId[] }>({ ach: [], skins: [] });
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    const ach = await getAchievements();
    setState(ach || {});
  }, []);

  useEffect(() => {
    (async () => {
      try { await refresh(); } finally { setLoading(false); }
    })();
  }, [refresh]);

  const evaluateAfterRun = useCallback(async (score: number) => {
    const res = await evaluateAchievementsAfterRun(score);
    setRecentUnlocks({ ach: res.unlocked, skins: res.skins });
    await refresh();
    return res;
  }, [refresh]);

  return useMemo(() => ({
    state,
    recentUnlocks,
    loading,
    refresh,
    evaluateAfterRun,
    resetRecent: () => setRecentUnlocks({ ach: [], skins: [] })
  }), [state, recentUnlocks, loading, refresh, evaluateAfterRun]);
};


