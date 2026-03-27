import { FastifyRequest } from 'fastify'
import { UserService } from './user.service'
import { IUser } from './user.types'
import { CreateUserInput } from './user.schema'
import { AppError } from '@/core/errors/app-error'

export class UserController {
  private service: UserService

  constructor() {
    this.service = new UserService()
  }

  public async create(
    request: FastifyRequest
  ): Promise<{ message: string; data: IUser }> {
    const { name, email, password } = request.body as CreateUserInput

    const user = await this.service.create(name, email, password)

    return {
      message: 'User created successfully',
      data: user
    }
  }

  public async findById(
    request: FastifyRequest
  ): Promise<{ message: string; data: IUser }> {
    const { id } = request.params as { id: string }

    const user = await this.service.findById(id)

    return {
      message: 'User found successfully',
      data: user
    }
  }

  public async findAll(): Promise<{ message: string; data: IUser[] }> {
    const users = await this.service.findAll()

    return {
      message: 'Users retrieved successfully',
      data: users
    }
  }

  public async getMe(
    request: FastifyRequest
  ): Promise<{ message: string; data: IUser }> {
    const userId = (request.user as { sub: string }).sub
    const user = await this.service.findById(userId)

    return {
      message: 'User found successfully',
      data: user
    }
  }

  public async deleteById(
    request: FastifyRequest
  ): Promise<{ message: string }> {
    const { id } = request.params as { id: string }

    const userLoggedIn = request.user as { sub: string }

    if (userLoggedIn.sub !== id) {
      throw new AppError('You can only delete your own account', 403)
    }

    await this.service.deleteById(id)

    return { message: 'User deleted successfully' }
  }

  public async update(
    request: FastifyRequest
  ): Promise<{ message: string; data: IUser }> {
    const { id } = request.params as { id: string }
    const { name, email, password } = request.body as Partial<IUser>

    const userLoggedIn = request.user as { sub: string }

    if (userLoggedIn.sub !== id) {
      throw new AppError('You can only update your own account', 403)
    }

    const user = await this.service.update(id, name, email, password)

    return {
      message: 'User updated successfully',
      data: user
    }
  }
}
