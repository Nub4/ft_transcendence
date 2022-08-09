import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UserService } from './user.service';
import { diskStorage } from 'multer';
import { of } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/decorators/user.decorator';
import { UserEntity } from './entities/user.entity';
import { UsernameDto } from './dto/user.dto';
import { tfaCodeDto } from './dto/new-user.dto';

export const storage = {
  storage: diskStorage({
    destination: './uploads/profileimages',
    filename: (req, file, cb) => {
      const filename: string = (file.originalname).replace(/\s/g, '');
      cb(null, `${filename}`)
    }
  })
}

@UseGuards(JwtGuard)
@Controller('user')
export class UserController
{
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  @Delete()
  async deleteUser(@User() user)
  {
    return this.authService.deleteUser(user);
  }

  @Get('allusers')
  async getAllUsers(@Query('page') page: number): Promise<UserEntity[]>
  {
    return this.userService.paginate(page);
  }
  
  @Get('get/user')
  async getUserByName(@Query('username') username: string)
  {
    return this.userService.getUserByName(username);
  }
  
  @Post('tfa/secret')
  async register(@Res() response: Response, @User() user)
  {
    if (!user.tfa_enabled) {
      const { otpauthUrl } = await this.userService.generateTfaSecret(user);
      return this.userService.pipeQrCodeStream(response, otpauthUrl);
    }
  }

  @Post('tfa/turn-on')
  @HttpCode(200)
  async turnOnTfa(@User() user, @Body() data: tfaCodeDto, @Res({passthrough: true}) res)
  {
    const isCodeValid = this.userService.isTfaCodeValid(data.tfaCode, user);
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.userService.turnOnTfa(user);
    const jwt = this.authService.treatTfa(user.id, true);
		res.clearCookie('access_token', {sameSite: 'lax', expires: new Date(Date.now() + 100)});
		res.cookie('access_token', jwt, {sameSite: 'lax' ,secure: true, expires: new Date(Date.now() + 604800000)});
  }

  @Post('tfa/turn-off')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  async turnOffTfa(@User() user, @Body() data: tfaCodeDto)
  {
    if (!user.tfaEnabled) {
      throw new UnauthorizedException('TFA is not enabled');
    }
    const isCodeValid = this.userService.isTfaCodeValid(data.tfaCode, user);
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.userService.turnOffTfa(user.id);
  }
  
  @Get('friend')
  async getFriends(@User() user): Promise<UserEntity[]>
  {
    const temp = await this.userService.getFriends(user.id);
    return temp;
  }

  @Get('get/blocked')
  async getBlockedUsers(@User() user): Promise<UserEntity[]>
  {
    return this.userService.getBlockedUsers(user.id);
  }
  
  @Post('/logout')
  async logOut(@Res({ passthrough: true }) response: Response, @User() user)
  {
    return this.authService.logOut(response, user);
  }
  
  @Post('/picture')
  @UseInterceptors(FileInterceptor('picture', storage))
  async uploadFile(@UploadedFile() file, @User() user)
  {
    if (!file) {
        throw new UnauthorizedException('No file uploaded');
    }
    return this.userService.uploadFile(user, file);
  }
  
  @Post('/username')
  async updateUsername(@User() user, @Body() data: UsernameDto)
  {
    const retval = await this.userService.updateUsername(user, data.username);
    if (retval == false) {
      throw new UnauthorizedException('Username already used');
    }
    return retval;
  }
  
  @Post('friend/:id')
  async requestFriend(@User() user, @Param('id', ParseIntPipe) id)
  {
    const temp = await this.userService.requestFriend(user, id);
    return temp;
  }
  
  @Delete('friend/:id')
  async deleteFriend(@User() user, @Param('id', ParseIntPipe) id)
  {
    return this.userService.deleteFriend(user, id);
  }

  @Post('block/:id')
  async blockUser(@User() user, @Param('id', ParseIntPipe) id)
  {
    return this.userService.blockUser(user, id);
  }
  
  @Post('unblock/:id')
  async unblockUser(@User() user, @Param('id', ParseIntPipe) id)
  {
    return this.userService.unblockUser(user, id);
  }

  @Get('/picture/:imagename')
  async findPicture(@Param('imagename') imagename, @Res() response: Response)
  {
    return of(response.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)));
  }

  @Get('/:id')
  async getUserById(@Param('id', ParseIntPipe) id)
  {
    return this.userService.getUserById(id);
  }

  @Get()
  async getProfile(@User() user)
  {
    return this.userService.getUserById(user.id);
  }

}

