import 'jest'
import { app } from '@/server'
import { DatabaseConnection } from '@/database/connection'
import { PasswordHash } from '@/shared/utils/password-hash'

describe('Update User', () => {
  let userId: string
  let anotherUserId: string
  let authToken: string

  beforeAll(async () => {
    await app.getApp().ready()

    const hashedPassword = await PasswordHash.hash('password123')

    // Create users for testing
    const prisma = DatabaseConnection.getInstance().getClient()

    // Main user for update testing
    const user = await prisma.user.create({
      data: {
        name: 'User to Update',
        email: 'update@example.com',
        password: hashedPassword
      }
    })
    userId = user.id

    // Another user for testing permissions
    const anotherUser = await prisma.user.create({
      data: {
        name: 'Another User',
        email: 'another@example.com',
        password: hashedPassword
      }
    })
    anotherUserId = anotherUser.id

    // Login to get the token
    const loginResponse = await app.getApp().inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'update@example.com',
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
          in: ['update@example.com', 'another@example.com', 'new@example.com']
        }
      }
    })

    await app.getApp().close()
  })

  it('should update a user successfully', async () => {
    const response = await app.getApp().inject({
      method: 'PUT',
      url: `/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      payload: {
        name: 'Updated Name',
        email: 'new@example.com'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'User updated successfully'
    )
    expect(JSON.parse(response.body)).toHaveProperty('data.id', userId)
    expect(JSON.parse(response.body)).toHaveProperty(
      'data.name',
      'Updated Name'
    )
    expect(JSON.parse(response.body)).toHaveProperty(
      'data.email',
      'new@example.com'
    )
  })

  it('should not update a user without authentication', async () => {
    const response = await app.getApp().inject({
      method: 'PUT',
      url: `/users/${userId}`,
      payload: {
        name: 'Updated Name',
        email: 'new@example.com'
      }
    })

    expect(response.statusCode).toBe(401)
  })

  it('should not update a different user', async () => {
    const response = await app.getApp().inject({
      method: 'PUT',
      url: `/users/${anotherUserId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      payload: {
        name: 'Hacked Name',
        email: 'hacked@example.com'
      }
    })

    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'You can only update your own account'
    )
  })

  it('should not update to an email already in use', async () => {
    const response = await app.getApp().inject({
      method: 'PUT',
      url: `/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      payload: {
        email: 'another@example.com'
      }
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'Email already in use'
    )
  })

  it('should update user password', async () => {
    const response = await app.getApp().inject({
      method: 'PUT',
      url: `/users/${userId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      payload: {
        password: 'newPassword123'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'User updated successfully'
    )

    // Try to login with the new password
    const loginResponse = await app.getApp().inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'new@example.com',
        password: 'newPassword123'
      }
    })

    expect(loginResponse.statusCode).toBe(200)
    expect(JSON.parse(loginResponse.body)).toHaveProperty('data.accessToken')
  })

  it('should not update with invalid ID', async () => {
    const invalidId = 'invalid-id'

    const response = await app.getApp().inject({
      method: 'PUT',
      url: `/users/${invalidId}`,
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      payload: {
        name: 'Test Name'
      }
    })

    expect(response.statusCode).toBe(400)
  })
})
