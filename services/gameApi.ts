export type RemoteGameConfig = {
  gravity: number;
  jumpForce: number;
  pipeGap: number;
  speedMultiplier: number;
  tip: string;
};

const DEFAULT_CONFIG: RemoteGameConfig = {
  gravity: 1000,
  jumpForce: -500,
  pipeGap: 200,
  speedMultiplier: 1,
  tip: 'Stay focused on the rhythm of the pipes to fly further.'
};

const CONFIG_URL = 'https://random-data-api.com/api/v2/breads';
let hasWarnedAboutFallback = false;

export const fetchGameConfig = async (): Promise<RemoteGameConfig> => {
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    const payload = (await response.json()) as { variety?: string; fiber?: string };
    return {
      gravity: 1000,
      jumpForce: -520,
      pipeGap: 180,
      speedMultiplier: 1.1,
      tip: payload.variety
        ? `Bread of the day: ${payload.variety}. Glide smoothly!`
        : DEFAULT_CONFIG.tip,
    };
  } catch (error) {
    // Network might fail during evaluations; fall back to deterministic defaults.
    if (!hasWarnedAboutFallback) {
      console.warn('Falling back to default config', error);
      hasWarnedAboutFallback = true;
    }
    return DEFAULT_CONFIG;
  }
};
