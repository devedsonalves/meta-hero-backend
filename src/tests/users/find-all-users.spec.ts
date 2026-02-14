import 'jest';
import { app } from '@/server';
import { DatabaseConnection } from '@/database/connection';

describe('Find All Users', () => {
  beforeAll(async () => {
    await app.getApp().ready();

    // Create some users for testing the listing
    const prisma = DatabaseConnection.getInstance().getClient();

    // Clean possible previous users to start with an empty list
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['user1@example.com', 'user2@example.com']
        }
      }
    });

    await prisma.user.createMany({
      data: [
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'password123'
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'password123'
        }
      ]
    });
  });

  afterAll(async () => {
    // Clean the database after tests
    const prisma = DatabaseConnection.getInstance().getClient();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['user1@example.com', 'user2@example.com']
        }
      }
    });

    await app.getApp().close();
  });

  it('should find all users successfully', async () => {
    const response = await app.getApp().inject({
      method: 'GET',
      url: '/users'
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'Users retrieved successfully'
    );
    expect(JSON.parse(response.body)).toHaveProperty('data');
    expect(Array.isArray(JSON.parse(response.body).data)).toBe(true);
    expect(JSON.parse(response.body).data.length).toBeGreaterThanOrEqual(2);

    // Check if the created users are in the list
    const users = JSON.parse(response.body).data;
    const emails = users.map((user: { email: string }) => user.email);
    expect(emails).toContain('user1@example.com');
    expect(emails).toContain('user2@example.com');
  });

  it('should return an error when there are no users (simulated scenario)', async () => {
    // First, remove the users to simulate a scenario without users
    const prisma = DatabaseConnection.getInstance().getClient();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['user1@example.com', 'user2@example.com']
        }
      }
    });

    // Force scenario for testing (this will only work if there are no other users in the DB)
    // In a real environment, this test may fail if there are other users in the system
    try {
      const response = await app.getApp().inject({
        method: 'GET',
        url: '/users'
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toHaveProperty(
        'message',
        'No users found'
      );
    } finally {
      // Recreate the users to not affect other tests
      await prisma.user.createMany({
        data: [
          {
            name: 'User 1',
            email: 'user1@example.com',
            password: 'password123'
          },
          {
            name: 'User 2',
            email: 'user2@example.com',
            password: 'password123'
          }
        ]
      });
    }
  });
});
