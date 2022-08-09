import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './service/chat.service';
import { AdminUserDto, CreateMessageToChatDto, JoinedUserStatusDto, SetPasswordDto } from './dto/chat.dto';
import { ChatUtilsService } from './service/chatUtils.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { UserService } from 'src/user/user.service';
import { User } from 'src/decorators/user.decorator';
import * as bcrypt from 'bcrypt';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController
{
    constructor(private chatService: ChatService,
        private chatUtilService: ChatUtilsService,
        private userService: UserService) {}

    @Get('/all')
    getAllChannels(@Query('page') page: number)
    {
        return this.chatUtilService.paginate(page);
    }

    @Get(':name')
    getChannelByName(@Param('name') name: string)
    {
        return this.chatUtilService.getChannelByName(name);
    }

    @Post('/invite')
    async inviteUserToPrivateChannel(@Body() data: JoinedUserStatusDto, @User() user)
    {
        return this.chatService.inviteUserToPrivateChannel(data, user);
    }

    @Post('/public')
    async createPublicChannel(@Body('name') channelName: string, @User() user)
    {
        return this.chatService.createPublicChannel(channelName, user);
    }

    @Post('/private')
    async createPrivateChannel(@Body('name') channelName: string, @User() user)
    {
        return this.chatService.createPrivateChannel(channelName, user);
    }

    @Post('/protected')
    async createProtectedChannel(@Body() channelData: SetPasswordDto, @User() user)
    {

        const saltOrRounds = 10;
        channelData.password = await bcrypt.hash(channelData.password, saltOrRounds);
        return this.chatService.createProtectedChannel(channelData, user);
    }

    @Delete('/delete/:id')
    async deleteChannel(@Param('id') id: number, @User() user)
    {
        return this.chatService.deleteChannel(id, user);
    }

    @Delete('/kick')
    async kickUserFromChannel(@Body() data: JoinedUserStatusDto, @User() user)
    {
        return this.chatService.kickUserFromChannel(data, user);
    }

    @Delete('/leave/:id')
    async leaveChannel(@Param('id', ParseIntPipe) id: number, @User() user)
    {
        return this.chatService.leaveChannel(id, user);
    }

    @Post('/join')
    async joinChannel(@Body() channelData: SetPasswordDto, @User() user)
    {
        return this.chatService.joinChannel(channelData, user);
    }

    @Patch('/mute')
    async muteUser(@Body() data: JoinedUserStatusDto, @User() user)
    {
        return this.chatService.muteUser(data, user);
    }

    @Patch('/unmute')
    async unMuteUser(@Body() data: JoinedUserStatusDto, @User() user)
    {
        return this.chatService.unMuteUser(data, user);
    }

    @Patch('/ban')
    async banUser(@Body() data: JoinedUserStatusDto, @User() user)
    {
        return this.chatService.banUser(data, user);
    }

    @Patch('/unban')
    async unBanUser(@Body() data: JoinedUserStatusDto, @User() user)
    {
        return this.chatService.unBanUser(data, user);
    }

    @Post('/admin')
    async giveAdmin(@Body() adminData: AdminUserDto, @User() user)
    {
        return this.chatService.giveAdmin(adminData, user);
    }

    @Patch('/unadmin')
    async unAdmin(@Body() adminData: AdminUserDto, @User() user)
    {
        return this.chatService.unAdmin(adminData, user);
    }

    @Patch('/password')
    async setPassword(@Body() passwordData: SetPasswordDto, @User() user)
    {
        const saltOrRounds = 10;
        passwordData.password = await bcrypt.hash(passwordData.password, saltOrRounds);
        return this.chatService.setPassword(passwordData, user);
    }

    @Patch('/removepassword')
    async removePassword(@Body('name') name: string, @User() user)
    {
        return this.chatService.removePassword(name, user);
    }

    @Post('/createdirect/:id')
    async createDirectChannel(@Param('id', ParseIntPipe) id: number, @User() user)
    {
        return this.chatService.createDirectChannel(user, await this.userService.getUserById(id));
    }

    @Get('/direct/:id')
    async getDirectChannel(@Param('id', ParseIntPipe) id: number , @User() user)
    {
        return this.chatService.getDirectChannelName(id, user.id);
    }

    @Post('/createmessage')
    async createMessageToChannel(@Body() data: CreateMessageToChatDto, @User() user)
    {
        return this.chatService.createMessageToChannel(data, user);
    }

    @Get('/messages/:name')
    async getMessagesFromChannel(@Param('name') name: string, @User() user)
    {
        return this.chatService.getMessagesFromChannel(name, user);
    }

    @Get('/getusers/:name')
    async getAllUsersFromChannel(@Param('name') name: string)
    {
        return this.chatService.getAllUsersFromChannel(name);
    }

    @Get('/getuser')
    async getUserFromChannel(@Body() data: JoinedUserStatusDto)
    {
        return this.chatService.getUserFromChannel(data);
    }

    @Get('/getchannels')
    async getChannelsFromUser(@Body('userId') userId: number)
    {
        return this.chatService.getChannelsFromUser(userId);
    }
    
    @Get('/userstatus/:name')
    async getUserStatus(@Param('name') name: string, @User() user)
    {
        return this.chatUtilService.getStatus(name, user);
    }
}