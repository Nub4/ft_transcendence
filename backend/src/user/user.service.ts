import { ConflictException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { authenticator } from 'otplib';
import { Repository } from 'typeorm';
import { NewUserDto } from './dto/new-user.dto';
import { UserEntity, UserStatus } from './entities/user.entity';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import { number } from '@hapi/joi';

@Injectable()
export class UserService
{
    constructor(@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>) {}

    async createUser(newUser: NewUserDto): Promise<UserEntity> //console.log ici -> Done : on recoit tout le user42
    {
        let user = this.userRepository.create(newUser);
        try {
          user = await this.userRepository.save(user);
        } catch (e) {
          throw new ConflictException('Username must be unique'); //probably other possible errors
        }
        return user;
    }

    async paginate(page: number = 1): Promise<any>
    {
        const take = 15;
        const [users, total] = await this.userRepository.findAndCount({
            take,
            skip: (page - 1) * take
        });
        return { data: users, meta: { total, page, last_page: Math.ceil(total / take)}};
    }

    async getAllUsers()
    {
      return this.userRepository.find()
    }

    async getUserById_2(id: number): Promise<UserEntity>
    {
        const user = await this.userRepository.findOneBy({id});
        if (!user)
            throw new NotFoundException('User with that name does not exists');
        return user;
    }

    async getUserById(id: number): Promise<UserEntity>
    {
        const user = await this.userRepository.findOneBy({id});
        if (!user)
            return ;
        return user;
    }

    async getUserByName(username: string)
    {
      return await this.userRepository.findOneBy({ username });
    }

    async setTfaSecret(secret: string, id: number)
    {
      return this.userRepository.update(id, {
        tfaSecret: secret
      });
    }

    async generateTfaSecret(user: UserEntity)
    {
      const secret = authenticator.generateSecret();

      const otpauthUrl = authenticator.keyuri(user.username, process.env.APP_NAME, secret);

      await this.setTfaSecret(secret, user.id);

      return {
        secret,
        otpauthUrl
      }
    }

    async pipeQrCodeStream(stream: Response, otpauthUrl: string)
    {
      return toFileStream(stream, otpauthUrl);
    }

    async turnOnTfa(id: number)
    {
      return this.userRepository.update(id, {
        tfaEnabled: true
      });
    }

    isTfaCodeValid(tfaCode: string, user: UserEntity)
    {
      return authenticator.verify({
        token: tfaCode,
        secret: user.tfaSecret
      })
    }

    updateUsername(user: UserEntity, username: string)
    {
      console.log(username);
      user.username = username;
      return this.userRepository.save(user);
    }

    updateStatus(user: UserEntity, status: UserStatus)
    {
      user.status = status
      this.userRepository.save(user);
    }

    async requestFriend(user: UserEntity, id: number)
    {
      // console.log("requestFriend : adding :",id);
      const friend = await this.getUserById(id);
      if (!friend)
        throw new NotFoundException('User not found');
      user.friends = await this.getFriends(user.id);
      if (user.friends.includes(friend))
        throw new ConflictException('You are already friends');
      else{
        user.friends.push(friend);
        // console.log("requestFriend : user's friends :", user.friends);
        return await this.userRepository.save(user);
      }
    }

    async deleteFriend(user: UserEntity, id: number)
    {
      const friendRemove = await this.getUserById(id);
      if (!friendRemove)
        throw new NotFoundException('User not found');
      friendRemove.friends = await this.getFriends(id);
      friendRemove.friends = friendRemove.friends.filter((friend) => friend.id !== user.id);
      await this.userRepository.save(friendRemove);

      user.friends = await this.getFriends(user.id);
      user.friends = user.friends.filter((friend) => {return friend.id !== id});
      return await this.userRepository.save(user);
    }

    async getRequestedUsers(id): Promise<UserEntity[]>
    {
        return await this.userRepository.query(
          ` SELECT *
            FROM "user" U
            WHERE U.id <> $1
              AND EXISTS(
                SELECT 1
                FROM user_friends_user F
                WHERE (F."userId_1" = $1 AND F."userId_2" = U.id )
                );  `,
          [id],
        );
        //return await this.userRepository.createQueryBuilder('user').leftJoinAndSelect('user.friends', 'user').getMany();
    }

    async getRequestedByUsers(id): Promise<UserEntity[]>
    {
      return await this.userRepository.query(
        ` SELECT *
          FROM "user" U
          WHERE U.id <> $1
            AND EXISTS(
              SELECT 1
              FROM user_friends_user F
              WHERE (F."userId_1" = U.id AND F."userId_2" = $1 )
              );  `,
        [id],
      );
    }

    async getFriends(id): Promise<UserEntity[]>
    {
      const requests = await this.getRequestedUsers(id);
      // console.log("getFriends : requests :", requests);
      // const requestedBy = await this.getRequestedByUsers(id);
      // console.log("getFriends : requestedBy :", requestedBy);
      // const temp = await requests.filter((user) => requestedBy.some((usr) => user.id === usr.id));
      // console.log("getFriends : temp :", temp);
      return requests;
    }

    async blockUser(user: UserEntity, id: number)
    {
      const toBlock = await this.getUserById(id);
      if (!toBlock)
        throw new NotFoundException('User not found');
      user.blockedUsers = await this.getBlockedUsers(user.id);
      user.blockedUsers.push(toBlock);
      return await this.userRepository.save(user);
    }

    // async blockUser(user: UserEntity, id: number)
    // {
    //     this.userIdIsSame(id, user.id);
    //     const blockedUser = await this.getUserById(id);
    //     user.blockedUsers = await this.getBlockedUsers(user.id);
    //     for (const x of user.blockedUsers)
    //         if (x.id === blockedUser.id)
    //             throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'User is already blocked'}, HttpStatus.FORBIDDEN);
    //     user.blockedUsers.push(blockedUser);
    //     return await this.userRepository.save(user);
    // }

    // async unblockUser(user: UserEntity, id: number)
    // {
    //     this.userIdIsSame(id, user.id);
    //     const blockedUser = await this.getUserById(id);
    //     user.blockedUsers = await this.getBlockedUsers(user.id);
    //     user.blockedUsers = user.blockedUsers.filter((blockedUser) => {return id !== blockedUser.id});
    //     return await this.userRepository.save(user);
    // }

    async unblockUser(user: UserEntity, id: number)
    {
      user.blockedUsers = await this.getBlockedUsers(user.id);
      user.blockedUsers = user.blockedUsers.filter((usr) => {return usr.id !== id});
      return await this.userRepository.save(user);
    }

    async getBlockedUsers(id): Promise<UserEntity[]>
    {
        return await this.userRepository.query(
          ` SELECT *
            FROM "user" U
            WHERE U.id <> $1
              AND EXISTS(
                SELECT 1
                FROM user_blocked_users_user F
                WHERE (F."userId_1" = $1 AND F."userId_2" = U.id )
                );  `,
          [id],
        );
    }

    async isblocked(user: UserEntity, friend: UserEntity)
    {
      friend.blockedUsers = await this.getBlockedUsers(friend.id);
      for (const x of friend.blockedUsers)
        if (x.id === user.id)
            throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'User has been blocked you'}, HttpStatus.FORBIDDEN);
    }

    async isblocked_true(user: UserEntity, friend: UserEntity)
    {
      friend.blockedUsers = await this.getBlockedUsers(friend.id);
      for (const x of friend.blockedUsers)
        if (x.id === user.id)
            return true;
      return false;
    }

    userIdIsSame(id: number, id2: number)
    {
        if (id === id2)
            throw new HttpException('You have no access to choose yourself', HttpStatus.FORBIDDEN);
    }

    async uploadFile(user: UserEntity, path: any) {
      user.picture = path.filename;

      return await this.userRepository.save(user);
    }

}
