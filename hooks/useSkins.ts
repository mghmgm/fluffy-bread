import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOwnedSkins, getSelectedSkin, selectSkin, type SkinId } from '../services/gameApi';

// Хук для работы со скинами: загрузка, выбор, циклическое переключение
export const useSkins = () => {
  const [ownedSkins, setOwnedSkins] = useState<SkinId[]>(['bread_default']);
  const [activeSkin, setActiveSkin] = useState<SkinId>('bread_default');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const [owned, selected] = await Promise.all([
          getOwnedSkins(),
          getSelectedSkin(),
        ]);
        setOwnedSkins(owned.length > 0 ? owned : (['bread_default'] as SkinId[]));
        if (selected && owned.includes(selected)) {
          setActiveSkin(selected);
        } else {
          setActiveSkin('bread_default');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setAndPersist = useCallback(async (id: SkinId) => {
    setActiveSkin(id);
    try { await selectSkin(id); } catch {}
  }, []);

  const cycle = useCallback((dir: -1 | 1) => {
    const pool: SkinId[] = ownedSkins.length > 0 ? ownedSkins : (['bread_default'] as SkinId[]);
    const idx = pool.indexOf(activeSkin);
    const nextIndex = (idx + dir + pool.length) % pool.length;
    const next = pool[nextIndex] ?? 'bread_default';
    void setAndPersist(next);
  }, [activeSkin, ownedSkins, setAndPersist]);

  return useMemo(() => ({
    ownedSkins,
    activeSkin,
    loading,
    setActiveSkin: setAndPersist,
    cycleLeft: () => cycle(-1),
    cycleRight: () => cycle(1),
    refreshOwned: async () => {
      const owned = await getOwnedSkins();
      setOwnedSkins(owned.length > 0 ? owned : (['bread_default'] as SkinId[]));
      if (!owned.includes(activeSkin)) {
        setActiveSkin('bread_default');
      }
    },
  }), [ownedSkins, activeSkin, loading, cycle, setAndPersist]);
};


