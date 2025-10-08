import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type RemoteGameConfig = {
  gravity: number;
  jumpForce: number;
  pipeGap: number;
  speedMultiplier: number;
  tip: string;
};

const DEFAULT_CONFIG: RemoteGameConfig = Platform.select({
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

export const fetchGameConfig = async (): Promise<RemoteGameConfig> => {
  return DEFAULT_CONFIG;
};

// Локальный оффлайн API для офлайн-игры

export type SkinId = 'bread_default' | 'bread_alt';

export type AchievementId =
  | 'first_blood'
  | 'five_club'
  | 'ten_club'
  | 'marathon_50'
  | 'collector_3';


export type RunSummary = {
  score: number;
  createdAt: number;
};

type AchievementProgress = { unlocked: boolean; progress?: number };
type AchievementState = Partial<Record<AchievementId, AchievementProgress>>;

const KEYS = {
  SKINS_OWNED: 'fluffy-bread/skins/owned',
  SKIN_SELECTED: 'fluffy-bread/skins/selected',
  ACHIEVEMENTS: 'fluffy-bread/achievements/state',
  RUNS_HISTORY: 'fluffy-bread/runs/history'
};

async function ensureDefaultsMigrated(): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.SKINS_OWNED);
  const owned: SkinId[] = raw ? JSON.parse(raw) : [];
  if (!owned.includes('bread_default')) {
    const next = ['bread_default', ...owned];
    await AsyncStorage.setItem(KEYS.SKINS_OWNED, JSON.stringify(next));
  }
}

export async function getOwnedSkins(): Promise<SkinId[]> {
  await ensureDefaultsMigrated();
  const raw = await AsyncStorage.getItem(KEYS.SKINS_OWNED);
  return raw ? (JSON.parse(raw) as SkinId[]) : ['bread_default'];
}

export async function unlockSkin(id: SkinId): Promise<void> {
  const owned = await getOwnedSkins();
  if (!owned.includes(id)) {
    const next = [...owned, id];
    await AsyncStorage.setItem(KEYS.SKINS_OWNED, JSON.stringify(next));
  }
}

export async function getSelectedSkin(): Promise<SkinId | null> {
  const raw = await AsyncStorage.getItem(KEYS.SKIN_SELECTED);
  return raw ? (JSON.parse(raw) as SkinId) : null;
}

export async function selectSkin(id: SkinId): Promise<void> {
  const owned = await getOwnedSkins();
  if (!owned.includes(id)) {
    throw new Error('Skin not owned');
  }
  await AsyncStorage.setItem(KEYS.SKIN_SELECTED, JSON.stringify(id));
}

export async function getAchievements(): Promise<AchievementState> {
  const raw = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
  return raw ? JSON.parse(raw) : {};
}

export async function unlockAchievement(id: AchievementId): Promise<void> {
  const state = await getAchievements();
  if (state[id]?.unlocked) return;
  state[id] = { unlocked: true, progress: state[id]?.progress };
  await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(state));
}

export async function appendRun(summary: RunSummary): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.RUNS_HISTORY);
  const arr: RunSummary[] = raw ? JSON.parse(raw) : [];
  arr.unshift(summary);
  const trimmed = arr.slice(0, 50);
  await AsyncStorage.setItem(KEYS.RUNS_HISTORY, JSON.stringify(trimmed));
}

export async function evaluateAchievementsAfterRun(score: number): Promise<{ unlocked: AchievementId[]; skins: SkinId[] }> {
  const newlyUnlocked: AchievementId[] = [];
  const newlySkins: SkinId[] = [];

  const unlockIf = async (cond: boolean, ach: AchievementId, skin?: SkinId) => {
    if (!cond) return;
    const achs = await getAchievements();
    if (!achs[ach]?.unlocked) {
      await unlockAchievement(ach);
      newlyUnlocked.push(ach);
      if (skin) {
        await unlockSkin(skin);
        newlySkins.push(skin);
      }
    }
  };

  await unlockIf(score >= 1, 'first_blood');
  await unlockIf(score >= 5, 'five_club', 'bread_alt');
  await unlockIf(score >= 10, 'ten_club');
  await unlockIf(score >= 50, 'marathon_50');

  const owned = await getOwnedSkins();
  if (owned.length >= 3) {
    const achs = await getAchievements();
    if (!achs['collector_3']?.unlocked) {
      await unlockAchievement('collector_3');
      newlyUnlocked.push('collector_3');
    }
  }

  return { unlocked: newlyUnlocked, skins: newlySkins };
}
