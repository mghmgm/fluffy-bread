import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOwnedSkins, getSelectedSkin, selectSkin, type SkinId } from '../services/gameApi';

// Вынесем общее состояние наружу, чтобы все экземпляры хука использовали одни данные
let globalOwnedSkins: SkinId[] = ['bread_default'];
let globalActiveSkin: SkinId = 'bread_default';
let globalListeners: Array<() => void> = [];

const notifyListeners = () => {
  globalListeners.forEach((listener) => listener());
};

// Функция для сброса глобального состояния
export const resetGlobalSkinsState = () => {
  globalOwnedSkins = ['bread_default'];
  globalActiveSkin = 'bread_default';
  notifyListeners();
};

// Хук для работы со скинами: загрузка, выбор, циклическое переключение
export const useSkins = () => {
  const [ownedSkins, setOwnedSkins] = useState<SkinId[]>(globalOwnedSkins);
  const [activeSkin, setActiveSkin] = useState<SkinId>(globalActiveSkin);
  const [loading, setLoading] = useState<boolean>(true);

  // Синхронизация с глобальным состоянием
  useEffect(() => {
    const listener = () => {
      setOwnedSkins([...globalOwnedSkins]);
      setActiveSkin(globalActiveSkin);
    };

    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
    };
  }, []);

  // Загрузка начальных данных
  useEffect(() => {
    (async () => {
      try {
        const [owned, selected] = await Promise.all([getOwnedSkins(), getSelectedSkin()]);

        globalOwnedSkins = owned.length > 0 ? owned : ['bread_default'];
        globalActiveSkin =
          selected && globalOwnedSkins.includes(selected) ? selected : 'bread_default';

        setOwnedSkins(globalOwnedSkins);
        setActiveSkin(globalActiveSkin);
        notifyListeners();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setAndPersist = useCallback(async (id: SkinId) => {
    if (!globalOwnedSkins.includes(id)) {
      console.warn('Attempt to select unowned skin:', id);
      return;
    }

    globalActiveSkin = id;
    setActiveSkin(id);

    try {
      await selectSkin(id);
      notifyListeners(); // Уведомляем все компоненты об изменении
    } catch (error) {
      console.error('Failed to persist skin selection:', error);
    }
  }, []);

  const cycle = useCallback(
    (dir: -1 | 1) => {
      const pool: SkinId[] = globalOwnedSkins.length > 0 ? globalOwnedSkins : ['bread_default'];
      const idx = pool.indexOf(globalActiveSkin);
      const nextIndex = (idx + dir + pool.length) % pool.length;
      const next = pool[nextIndex] ?? 'bread_default';
      void setAndPersist(next);
    },
    [setAndPersist],
  );

  const refreshOwned = useCallback(async () => {
    const owned = await getOwnedSkins();
    globalOwnedSkins = owned.length > 0 ? owned : ['bread_default'];

    // Проверяем, что выбранный скин всё ещё доступен
    if (!globalOwnedSkins.includes(globalActiveSkin)) {
      globalActiveSkin = 'bread_default';
      await selectSkin('bread_default');
    }

    setOwnedSkins(globalOwnedSkins);
    setActiveSkin(globalActiveSkin);
    notifyListeners();
  }, []);

  return useMemo(
    () => ({
      ownedSkins,
      activeSkin,
      loading,
      setActiveSkin: setAndPersist,
      cycleLeft: () => cycle(-1),
      cycleRight: () => cycle(1),
      refreshOwned,
    }),
    [ownedSkins, activeSkin, loading, cycle, setAndPersist, refreshOwned],
  );
};
