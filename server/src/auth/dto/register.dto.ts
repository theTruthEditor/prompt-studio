import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;

  @MinLength(8, { message: '密码至少 8 位' })
  password: string;
}
