import { useCallback, useEffect, useMemo, useState } from 'react';

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

const INITIAL_STATE: RemoteGameConfig = {
  gravity: 1000,
  jumpForce: -500,
  pipeGap: 200,
  speedMultiplier: 1,
  tip: 'Stay focused on the rhythm of the pipes to fly further.'
};

export const useGameResources = (): UseGameResourcesReturn => {
  const [config, setConfig] = useState<RemoteGameConfig>(INITIAL_STATE);
  const [highScore, setHighScore] = useState<number>(0);
  const [loadingResources, setLoading] = useState<boolean>(true);
  const [resourceError, setResourceError] = useState<string | null>(null);

  // Hydrate configuration and high score from remote API and local storage.
  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const [remoteConfig, storedHighScore] = await Promise.all([
        fetchGameConfig(),
        loadHighScore(),
      ]);
      setConfig(remoteConfig);
      setHighScore(storedHighScore);
      setResourceError(null);
    } catch (error) {
      setResourceError(
        error instanceof Error ? error.message : 'Failed to hydrate resources'
      );
    } finally {
      setLoading(false);
    }
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
