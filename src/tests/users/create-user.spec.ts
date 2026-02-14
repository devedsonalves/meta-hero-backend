import 'jest';
import { app } from '@/server';
import { DatabaseConnection } from '@/database/connection';

describe('Create User', () => {
  beforeAll(async () => {
    await app.getApp().ready();
  });

  afterAll(async () => {
    // Clean the database after tests
    const prisma = DatabaseConnection.getInstance().getClient();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'existing@example.com']
        }
      }
    });

    await app.getApp().close();
  });

  beforeEach(async () => {
    // Create a user to test the existing email case
    const prisma = DatabaseConnection.getInstance().getClient();
    await prisma.user.create({
      data: {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      }
    });
  });

  afterEach(async () => {
    // Clean the test user after each test
    const prisma = DatabaseConnection.getInstance().getClient();
    await prisma.user.deleteMany({
      where: {
        email: 'existing@example.com'
      }
    });
  });

  it('should create a user successfully', async () => {
    const response = await app.getApp().inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'User created successfully'
    );
    expect(JSON.parse(response.body)).toHaveProperty('data.id');
    expect(JSON.parse(response.body)).toHaveProperty('data.name', 'Test User');
    expect(JSON.parse(response.body)).toHaveProperty(
      'data.email',
      'test@example.com'
    );
    expect(JSON.parse(response.body).data).not.toHaveProperty('password');
  });

  it('should not create a user with existing email', async () => {
    const response = await app.getApp().inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'Another User',
        email: 'existing@example.com',
        password: 'password123'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toHaveProperty(
      'message',
      'User already exists with this email'
    );
  });

  it('should not create a user with invalid data - email', async () => {
    const response = await app.getApp().inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'Test User',
        email: 'invalidemail',
        password: 'password123'
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('should not create a user with invalid data - short password', async () => {
    const response = await app.getApp().inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345'
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('should not create a user with invalid data - empty name', async () => {
    const response = await app.getApp().inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: '',
        email: 'test@example.com',
        password: 'password123'
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
