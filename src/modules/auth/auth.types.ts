export interface IRefreshToken {
  id: string;
  hashedToken: string;
  userId: string;
  revoked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuthRepository {
  save(refreshToken: Omit<IRefreshToken, 'id'>): Promise<IRefreshToken>;
  findByHashedToken(hashedToken: string): Promise<IRefreshToken | null>;
  revokeAllTokensByUserId(userId: string): Promise<void>;
  update(id: string, revoked: boolean): Promise<IRefreshToken>;
  updateByHashedToken(
    hashedToken: string,
    revoked: boolean
  ): Promise<IRefreshToken>;
}

export interface IGoogleUserProfile {
  email: string;
  name: string;
}

export interface IGoogleToken {
  access_token: string;
}
