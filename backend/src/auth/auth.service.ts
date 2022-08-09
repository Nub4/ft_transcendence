import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Socket } from 'socket.io';
import { ChatService } from 'src/chat/service/chat.service';
import { ChatUtilsService } from 'src/chat/service/chatUtils.service';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService
{
    constructor(
        @Inject(ConfigService)
        public config: ConfigService,
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        private userService: UserService,
        private chatUtilService: ChatUtilsService,
        private chatService: ChatService,
        private jwtService: JwtService
    ) {}

    async treatFtOauth(user42)
    {
        let user = await this.userService.getUserById(user42.id);
        if (!user){
            user = await this.userService.createUser(user42);
        }
        const jwt = this.jwtService.sign({id: user.id, username: user.username});
        return {user, jwt};
    }

    treatTfa(id: number, tfaOK = false)
    {
        return this.jwtService.sign({ id, tfaOK });
    }

    async getUserFromAuthenticationToken(token: string)
    {
        const payload = this.jwtService.verify(token);
        if (payload.id)
        {
            const user = await this.userService.getUserById(payload.id);
            if (user)
            {
                if (!user.tfaEnabled || payload.tfaOK)
                    return user
                else
                    throw new UnauthorizedException();
            }
            else
                throw new UnauthorizedException();
        }
    }

    async getUserFromSocket(socket: Socket)
    {
        const cookie = socket.handshake.headers.cookie;
        var temp = cookie.split('=');
        const user = await this.getUserFromAuthenticationToken(temp[1]);
        if (!user)
            throw new WsException('Invalid credentials.');
        return user;
    }

    async deleteUser(user: UserEntity): Promise<void>
    {
        const channels = await this.chatService.getChannelsFromUser(user.id);
        for (const channel of channels)
            await this.chatService.leaveChannel(channel.id, user);
        await this.chatUtilService.deleteMessagesByUser(user);
        await this.chatUtilService.deleteJoinedUsersStatusByUser(user);
        await this.userRepository.delete(user.id);
    }
    
    async logOut(response: Response, user: UserEntity)
    {
        response.clearCookie('access_token', {sameSite: 'lax', expires: new Date(Date.now() + 100)});
        response.sendStatus(200);
        user.status = UserStatus.offline;
        await this.userRepository.save(user);
        return ;
    }
}
