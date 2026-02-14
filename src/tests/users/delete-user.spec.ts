import 'jest'
import { app } from '@/server'
import { DatabaseConnection } from '@/database/connection'
import { PasswordHash } from '@/shared/utils/password-hash'

describe('Delete User', () => {
  let userId: string
  let anotherUserId: string
  let authToken: string

  beforeAll(async () => {
    await app.getApp().ready()

    const hashedPassword = await PasswordHash.hash('password123')

    // Create users for testing
    const prisma = DatabaseConnection.getInstance().getClient()

    // Main user for deletion testing
    const user = await prisma.user.create({
      data: {
        name: 'User to Delete',
        email: 'delete@example.com',
        password: hashedPassword
      }
    })
    userId = user.id

    // Another user to test permissions
    const anotherUser = await prisma.user.create({
      data: {
        name: 'Another User',
        email: 'another.delete@example.com',
        password: hashedPassword
      }
    })
    anotherUserId = anotherUser.id

    // Login to get the token
    const loginResponse = await app.getApp().inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'delete@example.com',
        password: 'password123'
      }
    })

    authToken = JSON.parse(loginResponse.body).data.accessToken
  })

  afterAll(async () => {
    // Clean the database after tests
    const prisma = DatabaseConnection.getInstance().getClient()
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['delete@example.com', 'another.delete@example.com']
        }
      }
    })

    await app.getApp().close()
  })

  it('should not delete a user without authentication', async () => {
    const response = await app.getApp().inject({
      method: 'DELETE',
      url: `/users/${userId}`
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not delete a different user', async () => {
    const response = await app.getApp().inject({
      method: 'DELETE',
      url: `/users/${anotherUserId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'You can only delete your own account'
    )
  })

  it('should not delete with invalid ID', async () => {
    const invalidId = 'invalid-id'

    const response = await app.getApp().inject({
      method: 'DELETE',
      url: `/users/${invalidId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('should delete a user successfully', async () => {
    const response = await app.getApp().inject({
      method: 'DELETE',
      url: `/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    expect(response.statusCode).toBe(204)

    // Check if the user was actually deleted
    const prisma = DatabaseConnection.getInstance().getClient()
    const deletedUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    expect(deletedUser).toBeNull()
  })
})
