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
