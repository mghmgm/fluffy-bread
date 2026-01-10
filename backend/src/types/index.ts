export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

export interface IUserResponse {
  id: number;
  username: string;
  email: string;
  createdAt: number;
}

export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: IUserResponse;
  token: string;
}

export interface ISkin {
  id: number;
  userId: number;
  name: string;
  rarity: string;
  imageUrl: string;
  price: number;
  isUnlocked: boolean;
  createdAt: Date;
}

export interface IAchievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  points: number;
  createdAt: Date;
}

export interface IUserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  createdAt: Date;
}

export interface ISettings {
  id: number;
  userId: number;
  musicVolume: number;
  soundVolume: number;
  isNotificationsEnabled: boolean;
  isDarkMode: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJWTPayload {
  userId: number;
  email: string;
}

// Расширение Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}
