import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { fetchGameConfig, RemoteGameConfig } from '../services/gameApi';
import { loadHighScore, persistHighScore } from '../services/storage';

type UseGameResourcesReturn = {
  config: RemoteGameConfig;
  highScore: number;
  loadingResources: boolean;
  resourceError: string | null;
  updateHighScore: (value: number) => Promise<void>;
  refreshResources: () => Promise<void>;
};

/* 

*/

const INITIAL_STATE: RemoteGameConfig = Platform.select({
  ios: {
    gravity: 950,
    jumpForce: -520,
    pipeGap: 200,
    speedMultiplier: 1,
    tip: 'Тапните по экрану, чтобы хлеб взлетел 🍞',
  },
  android: {
    gravity: 1050,
    jumpForce: -480,
    pipeGap: 200,
    speedMultiplier: 1, 
    tip: 'Коснитесь экрана, чтобы прыгнуть 🪽',
  },
  default: {
    gravity: 1050,
    jumpForce: -480,
    pipeGap: 200,
    speedMultiplier: 1, 
    tip: 'Коснитесь экрана, чтобы прыгнуть 🪽',
  }
})!;

export const useGameResources = (): UseGameResourcesReturn => {
  const [config, setConfig] = useState<RemoteGameConfig>(INITIAL_STATE);
  const [highScore, setHighScore] = useState<number>(0);
  const [loadingResources, setLoading] = useState<boolean>(true);
  const [resourceError, setResourceError] = useState<string | null>(null);

  // Гидрируем конфиг и лучший результат из локального оффлайн-API.
  const hydrate = useCallback(async () => {
    setLoading(true);
    const [remoteConfig, storedHighScore] = await Promise.all([
      fetchGameConfig(),
      loadHighScore(),
    ]);
    setConfig(remoteConfig);
    setHighScore(storedHighScore);
    setResourceError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Persist the best score so it survives app restarts.
  const updateHighScore = useCallback(
    async (value: number) => {
      setHighScore(value);
      await persistHighScore(value);
    },
    []
  );

  const refreshResources = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  const memoizedConfig = useMemo(() => config, [config]);

  return {
    config: memoizedConfig,
    highScore,
    loadingResources,
    resourceError,
    updateHighScore,
    refreshResources,
  };
};

export type { RemoteGameConfig };
