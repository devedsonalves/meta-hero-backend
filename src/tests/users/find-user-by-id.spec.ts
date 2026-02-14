import 'jest';
import { app } from '@/server';
import { DatabaseConnection } from '@/database/connection';

describe('Find User by ID', () => {
  let userId: string;

  beforeAll(async () => {
    await app.getApp().ready();

    // Create a user for testing find by ID
    const prisma = DatabaseConnection.getInstance().getClient();
    const user = await prisma.user.create({
      data: {
        name: 'User for Search',
        email: 'search@example.com',
        password: 'password123'
      }
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Clean the database after tests
    const prisma = DatabaseConnection.getInstance().getClient();
    await prisma.user.deleteMany({
      where: {
        email: 'search@example.com'
      }
    });

    await app.getApp().close();
  });

  it('should find a user by ID successfully', async () => {
    const response = await app.getApp().inject({
      method: 'GET',
      url: `/users/${userId}`
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'User found successfully'
    );
    expect(JSON.parse(response.body)).toHaveProperty('data.id', userId);
    expect(JSON.parse(response.body)).toHaveProperty(
      'data.name',
      'User for Search'
    );
    expect(JSON.parse(response.body)).toHaveProperty(
      'data.email',
      'search@example.com'
    );
    expect(JSON.parse(response.body).data).not.toHaveProperty('password');
  });

  it('should not find a user with non-existent ID', async () => {
    const fakeId = 'clz1234567890abcdefghijkl'; // Fake CUID

    const response = await app.getApp().inject({
      method: 'GET',
      url: `/users/${fakeId}`
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'User not found'
    );
  });

  it('should not find a user with invalid ID', async () => {
    const invalidId = 'invalid-id';

    const response = await app.getApp().inject({
      method: 'GET',
      url: `/users/${invalidId}`
    });

    expect(response.statusCode).toBe(400);
  });
});
