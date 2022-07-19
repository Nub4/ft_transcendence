import { Body, Controller, Delete, Get, HttpCode, Injectable, Param, ParseIntPipe, Patch, Post, Query, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UserService } from './user.service';
import { diskStorage } from 'multer';
import { of } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/decorators/user.decorator';
import { UserEntity, UserStatus } from './entities/user.entity';
import { tfaDto } from './dto/new-user.dto';

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
    async register(@Res() response: Response, @User() user, @Body() tfa: tfaDto)
    {
        // if (user.tfa_enabled)
        console.log(tfa);
        const { otpauthUrl } = await this.userService.generateTfaSecret(user);
        const temp:any = this.userService.pipeQrCodeStream(response, otpauthUrl);
        // console.log(temp);
        // return Buffer.from(temp).toString('base64');

    }
    
    @Post('tfa/turn-on')
    @HttpCode(200)
    async turnOnTfa(@User() user, @Body() { tfaCode })
    {
        const isCodeValid = this.userService.isTfaCodeValid(tfaCode, user);
        if (!isCodeValid) {
            throw new UnauthorizedException('Wrong authentication code');
        }
        await this.userService.turnOnTfa(user.id);
    }
    
    @Get('friend')
    async getFriends(@User() user)
    {
        // console.log(user);
        const temp = await this.userService.getFriends(user.id);
        // console.log("get friends : ", temp);
        return temp;
    }

    @Get('block')
    async getBlockedUsers(@User() user)
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
        return this.userService.uploadFile(user, file);
    }
    
    @Post('/username')
    async updateUsername(@User() user, @Body() { username })
    {
        console.log(username);
        return this.userService.updateUsername(user, username);
    }
   
    @Post('friend/:id')
    async requestFriend(@User() user, @Param('id', ParseIntPipe) id)
    {
        const temp = await this.userService.requestFriend(user, id);
        // console.log(temp);
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
    
    @Delete('block/:id')
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

