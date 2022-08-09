import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { User } from 'src/decorators/user.decorator';
import { tfaCodeDto, tfaDto } from 'src/user/dto/new-user.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { FtGuard } from './guards/ft.guard';
import { TfaGuard } from './guards/tfa.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
		private userService: UserService,
		@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
    ) {}

    @Get('42')
	@UseGuards(FtGuard)
	ftAuth()
	{
		return ;
	}

	@Get('42/return')
	@UseGuards(FtGuard)
	async ftAuthReturn(@User() user42, @Res({passthrough: true}) res)
	{
		const { user, jwt } = await this.authService.treatFtOauth(user42);
        res.cookie('access_token', jwt);//, {sameSite: 'lax' ,secure: true, expires: new Date(Date.now() + 604800000)});
		return ;
	}

	@Post('tfa')
	@HttpCode(200)
	@UseGuards(TfaGuard)
	async authenticate(@User() user, @Body() data: tfaCodeDto, @Res({passthrough: true}) res: Response)
	{
		const isCodeValid = this.userService.isTfaCodeValid(data.tfaCode, user);
		if (!isCodeValid) {
			throw new UnauthorizedException('Wrong authentication code');
    	}
		const jwt = this.authService.treatTfa(user.id, true);
		res.clearCookie('access_token', {sameSite: 'lax'});//, expires: new Date(Date.now() + 100)});
		res.cookie('access_token', jwt, {sameSite: 'lax'});// ,secure: true, expires: new Date(Date.now() + 604800000)});
		return user;
  	}
}
