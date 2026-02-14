import { PasswordHash } from '@/shared/utils/password-hash'
import { UserRepository } from './user.repository'
import { IUser, IUserRepository } from './user.types'
import { AppError } from '@/core/errors/app-error'

export class UserService {
  private repository: IUserRepository

  constructor() {
    this.repository = new UserRepository()
  }

  public async create(name: string, email: string, password: string) {
    const existingUser = await this.repository.findByEmail(email)
    if (existingUser) {
      throw new AppError('User already exists with this email', 400)
    }
    const hashPassword = await PasswordHash.hash(password)
    const user = await this.repository.save({
      name,
      email,
      password: hashPassword
    })
    return user
  }

  public async findById(id: string) {
    const user = await this.repository.findById(id)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    return user
  }

  public async findAll() {
    const users = await this.repository.findAll()
    if (users.length === 0) {
      throw new AppError('No users found', 404)
    }
    return users
  }

  public async deleteById(id: string) {
    const user = await this.repository.findById(id)
    if (!user) {
      throw new AppError('User not found', 404)
    }
    await this.repository.deleteById(id)
  }

  public async update(
    id: string,
    name?: string,
    email?: string,
    password?: string
  ) {
    const user = await this.repository.findById(id)
    if (!user) {
      throw new AppError('User not found', 404)
    }
    if (email) {
      const existingUser = await this.repository.findByEmail(email)
      if (existingUser && existingUser.id !== id) {
        throw new AppError('Email already in use', 400)
      }
    }
    const updatedData: Partial<IUser> = {
      name: name || user.name,
      email: email || user.email
    }
    if (password) {
      updatedData.password = await PasswordHash.hash(password)
    }
    const updatedUser = await this.repository.update({
      ...user,
      ...updatedData
    })
    return updatedUser
  }
}
