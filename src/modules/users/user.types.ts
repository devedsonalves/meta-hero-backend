export interface IUser {
  id: string
  name: string
  email: string
  authProvider: string
  createdAt: Date
  updatedAt: Date
}

export interface IUserRepository {
  save(user: IUser): Promise<IUser>
  findByEmail(email: string, returnPassword?: boolean): Promise<IUser | null>
  findById(id: string): Promise<IUser | null>
  findAll(): Promise<IUser[]>
  deleteById(id: string): Promise<void>
  update(user: IUser): Promise<IUser>
}
