import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    })
      .useMocker((token) => {
        if (token === AuthService) {
          return { signup: jest.fn() };
        }
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.signup with DTO and return result', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = `Signup successfully, a message containing a confirmation link has been sent to email: ${dto.email}`;
    jest.spyOn(authService, 'signup').mockResolvedValue(mockResponse);

    const result = await controller.signup(dto);

    expect(authService.signup).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockResponse);
  });
});
