import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth/auth.service';
import { Game, GameOptions, Invites, Player, gameNames } from './game/game.class';
import { MatchDto } from './match/dto/match.dto';
import { UserEntity, UserStatus } from './user/entities/user.entity';
import { UserService } from './user/user.service';
import axios from 'axios';
import { GameService } from './game/game.service';
import { CreateMessageToChatDto, InvitePlayerOptions, SetPasswordDto } from './chat/dto/chat.dto';
import { ChatService } from './chat/service/chat.service';
import { ChatUtilsService } from './chat/service/chatUtils.service';
import { nameDto, pageDto, roomDto, sender2Dto, userIdDto, userNameDto } from './app.gateway.dto';


@WebSocketGateway({cors: { origin: 'http://' + process.env.DB_HOST + ':3000', credentials: true }})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private authService: AuthService,
    private userService: UserService,
    private gameService: GameService,
    private chatService: ChatService,
    private chatUtilService: ChatUtilsService,
    ) {}

  @WebSocketServer() wss: Server;

  private gameId = 0;
  private queue: UserEntity[] = [];
  private invites: Invites[] = [];
  private games: Game[] = [];
  private _sockets = [];
  
  private readonly defaultGameOptions: GameOptions = {
    paddleSize: 40,
    paddleSpeed: 6,
    ballSpeed: 5
  };

  private logger: Logger = new Logger('AppGateway');

  afterInit(server: Server)
  {
    this.logger.log('Initialized !');  
  }

  async handleConnection(@ConnectedSocket() client: Socket)
  {
    try
    {
      const user = await this.authService.getUserFromSocket(client);
      client.data.user = user;
      client.data.room = null;
      this._sockets.push(client);
      this.userService.updateStatus(user, UserStatus.online);
      this.logger.log(`client connected:    ${client.id}`);
    }
    catch (e) { this.error(client, e, true); }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket)
  {
    try
    {
      const user2 = await this.authService.getUserFromSocket(client);
      const user = client.data.user;
      const channels = await this.chatService.getChannelsFromUser(user.id);
      for (const channel of channels)
      {
        if (client.data.room === channel.name)
          this.leave(client, { name: channel.name });
      }
      let index4 = this.games.findIndex(e => e.players[0].player.id === user.id);
      let index5 = this.games.findIndex(e => e.players[1].player.id === user.id);
      if (index4 !== -1)
        this.leaveGame(client, { room: this.games[index4].name });
      if (index5 !== -1)
        this.leaveGame(client, { room: this.games[index5].name });
      this.userService.updateStatus(user2, UserStatus.offline);
      this.logger.log(`client disconnected: ${client.id}`);
      const index2 = this.queue.findIndex(e => e.id === user.id);
      if (index2 !== -1)
        this.queue.splice(index2, 1);
      const index = this._sockets.findIndex(e => e.id === client.id);
      if (index !== -1)
        this._sockets.splice(index, 1);
      const index3 = this.invites.findIndex(function (Invite) {
        return Invite.sender === user.username;
      });
      if (index3 !== -1)
      {
        for (var i = 0; i < this._sockets.length; i++)
          if (this._sockets[i].data.user.username === this.invites[index3].invitedUser)
            this._sockets[i].emit('addUpdatedInviteToClient', index3);
        this.invites.splice(index3, 1);
      }
      client.disconnect();
    }
    catch (e) { this.error(client, e, true); }
  }

  ///////// USER PART /////////////

  @SubscribeMessage('changeUsernameToServer')
  async changeUsername(@ConnectedSocket() client: Socket, @MessageBody() data: userNameDto)
  {
    try
    {
      const user = client.data.user;
      const index = this.invites.findIndex(function (Invite) {
        return Invite.invitedUser === user.username;
      });
      if (index !== -1)
      {
        for (var i = 0; i < this._sockets.length; i++)
          if (this._sockets[i].data.user.username === this.invites[index].invitedUser)
            this.invites[index].invitedUser = data.username;
      }
      client.data.user.username = data.username;
    }
    catch { throw new WsException('Something went wrong'); }
  }

  ///////// CHAT PART /////////////

  @SubscribeMessage('unBanToServer')
  async unBan(@ConnectedSocket() client: Socket, @MessageBody() data: userNameDto)
  {
    try
    {
      const user = client.data.user;
      const bannedUser = await this.userService.getUserByName(data.username);
      for (var i = 0; i < this._sockets.length; i++)
        if (this._sockets[i].data.user.username === bannedUser.username)
          this._sockets[i].emit('isBannedToClient', '');
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('isBannedToServer')
  async isBanned(@ConnectedSocket() client: Socket, @MessageBody() data: userIdDto)
  {
    try
    {
      const user = client.data.user;
      const bannedUser = await this.userService.getUserById_2(data.id);
      for (var i = 0; i < this._sockets.length; i++)
        if (this._sockets[i].data.user.username === bannedUser.username)
          this._sockets[i].emit('isBannedToClient', "banned");
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('getChannelsToServer')
  async getChannels(@ConnectedSocket() client: Socket, @MessageBody() data: pageDto)
  {
    try
    {
      const user = client.data.user;
      const result = await this.chatUtilService.paginate(data.page);
      this.wss.emit('getChannelsToClient', result);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('leaveChannelToServer')
  async leave(@ConnectedSocket() client: Socket, @MessageBody() data: nameDto)
  {
    try
    {
      const user = client.data.user;
      const channel = await this.chatUtilService.getChannelByName(data.name);
      client.leave(data.name);
      client.data.room = null;
      const chatUsers = [];
      for (const socket of this._sockets)
      {
        if (socket.rooms.has(data.name))
        {
          chatUsers.push(socket.data.user.username);
        }
      }
      this.wss.to(data.name).emit('leaveToClient', { msg: `${user.username} left from the channel`, onlineUsers: chatUsers })
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('joinToServer')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() channelData: SetPasswordDto)
  {
    try
    {
      
      const user = client.data.user;
      await this.chatService.joinChannel(channelData, user);
      // const user2 = await this.authService.getUserFromSocket(client);
      client.join(channelData.name);
      client.data.room = channelData.name;
      const chatUsers = [];
      for (const socket of this._sockets)
      {
        if (socket.rooms.has(channelData.name))
        {
          chatUsers.push(socket.data.user.username);
        }
      }
      const allMessages = await this.chatService.getMessagesFromChannel(channelData.name, user);
      this.wss.to(channelData.name).emit('joinToClient', { msg: `${user.username} joined to channel`, channel: channelData.name, messages: allMessages, onlineUsers: chatUsers });
    }
    catch { throw new HttpException('user is banned', HttpStatus.BAD_REQUEST); }
  }

  @SubscribeMessage('leaveToServer')
  async leaveChannel(@ConnectedSocket() client: Socket, @MessageBody() data: nameDto)
  {
    try
    {
      const user = client.data.user;
      const channel = await this.chatUtilService.getChannelByName(data.name);
      await this.chatService.leaveChannel(channel.id, user);
      client.leave(data.name);
      client.data.room = null;
      this.wss.to(data.name).emit('leaveToClient', `${user.username} left from the channel`);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('msgToServer')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageToChatDto)
  {
    try
    {
      const user = client.data.user;
      const channel = await this.chatUtilService.getChannelByName(data.name);
      const message = await this.chatService.createMessageToChannel(data, user);
      const allMessages = await this.chatService.getMessagesFromChannel(data.name, user);
      this.wss.to(data.name).emit('msgToClient', allMessages);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  ///////// GAME PART /////////////

  @SubscribeMessage('getGamesToServer')
  async getGames(@ConnectedSocket() client: Socket)
  {
    try
    {
      const gameNames: gameNames[] = [];
      for (var i = 0; i < this.games.length; i++)
      {
        const gameName = {id: i, name: this.games[i].name}
        gameNames.push(gameName);
      }
      client.emit('getGamesToClient', gameNames);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('addInviteToServer')
  async invitePlayer(@ConnectedSocket() client: Socket, @MessageBody() data: InvitePlayerOptions)
  {
    try
    {
      const user = client.data.user;
      const invitedUser = await this.userService.getUserById_2(data.id);
      // add invited user to invites
      this.invites.push({
        sender: user.username,
        invitedUser: invitedUser.username,
        gameOptions: { paddleSize: data.paddleSize, paddleSpeed: data.paddleSpeed, ballSpeed: data.ballSpeed },
      });
      for (var i = 0; i < this._sockets.length; i++)
        if (this._sockets[i].data.user.username === invitedUser.username)
          this._sockets[i].emit('addInviteToClient', { username: user.username, id: user.id });
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('acceptInviteToServer')
  async acceptInvite(@ConnectedSocket() client: Socket, @MessageBody() data: sender2Dto)
  {
    try
    {
      const invitedUser = client.data.user;
      const sender = await this.userService.getUserByName(data.sender2);
      const index = this.invites.findIndex(function (Invite) {
        return Invite.sender === data.sender2 && Invite.invitedUser === invitedUser.username;
      });
      if (index === -1)
      {
        client.emit('acceptInviteToClient', 'Invite doesnt exists');
        return ;
      }
      const gameOptions = this.invites[index].gameOptions;
      // remove invited user from invites
      for (var i = 0; i < this._sockets.length; i++)
      {
        if (this._sockets[i].data.user.username === invitedUser.username)
        {
          this._sockets[i].emit('addUpdatedInviteToClient', index);
          break ;
        }
      }
      this.invites.splice(index, 1);
      const player1: Player = { player: sender };
      const player2: Player = { player: invitedUser };
      // start the game
      this.startGame(player1, player2, gameOptions);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('leaveGameToServer')
  async leaveGame(@ConnectedSocket() client: Socket, @MessageBody() data: roomDto)
  {
    try
    {
      // find the game
      const user = client.data.user;
      const game = this.games.find(e => e.name === data.room);
      if (game.winner !== undefined)
        return ;
      if (game.players[0].player.username === user.username)
        game.winner = game.players[1];
      else if (game.players[1].player.username === user.username)
        game.winner = game.players[0];
      else
      {
        client.emit('newSpectatorToClient', { username: null, room: null });
        client.leave(data.room);
        return ;
      }
      // end game and leave
      game.sounds.win === true;
      this.endGame(game);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('JoinQueueToServer')
  async joinQueue(@ConnectedSocket() client: Socket)
  {
    try
    {
      const user = client.data.user;
      // let index = this.games.findIndex(e => e.players[0].player.id === user.id);
      // let index2 = this.games.findIndex(e => e.players[1].player.id === user.id);
      // if (index !== -1 || index2 !== -1)
      // {
      //   return ;
      // }
      const index3 = this.queue.findIndex(e => e.id === user.id);
      if (index3 !== -1)
      {
        return ;
      }
      // user joins to queue
      this.queue.push(user);
      // add players to game until there queue has only 0 or 1 users
      while (this.queue.length >= 2)
      {
        const player1: Player = { player: this.queue.shift() };
        const player2: Player = { player: this.queue.shift() };
        if (player1.player.username !== player2.player.username)
          this.startGame(player1, player2, this.defaultGameOptions);
      }
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('leaveQueueToServer')
  async leaveQueue(@ConnectedSocket() client: Socket)
  {
    try
    {
      const user = client.data.user;
      // user leaves from queue
      const index = this.queue.findIndex(e => e.id === user.id);
      if (index !== -1)
        this.queue.splice(index, 1);
      if (index === -1)
      {
        const index3 = this.invites.findIndex(function (Invite) {
          return Invite.sender === user.username;
        });
        if (index3 !== -1)
        {
          for (var i = 0; i < this._sockets.length; i++)
            if (this._sockets[i].data.user.username === this.invites[index3].invitedUser)
              this._sockets[i].emit('addUpdatedInviteToClient', index3);
          this.invites.splice(index3, 1);
        }
      }
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('newSpectatorToServer')
  async addSpectator(@ConnectedSocket() client: Socket, @MessageBody() data: roomDto)
  {
    try
    {
      const user = client.data.user;
      // user joins to game as a spectator
      client.join(data.room);
      // send this only to spectator
      client.emit('newSpectatorToClient', { username: user.username, room: data.room });
      // this.wss.to(data.room).emit('newSpectatorToClient', { username: user.username, room: data.room });
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('moveUpToServer')
  async handleMoveUp(@ConnectedSocket() client: Socket)
  {
    try
    {
      const user = client.data.user;
      let index;
      index = this.games.findIndex(e => e.players[0].player.id === user.id);
      if (index === -1)
      {
        index = this.games.findIndex(e => e.players[1].player.id === user.id);
        if (index === -1)
          throw new WsException('Game doesnt exists');
      }
      let player1 = this.games[index].players[0];
      let player2 = this.games[index].players[1];
      if (player1.player.id === user.id)
        this.gameService.movePlayerUp(player1);
      else if (player2.player.id === user.id)
        this.gameService.movePlayerUp(player2);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('moveDownToServer')
  async handleMoveDown(@ConnectedSocket() client: Socket)
  {
    try
    {
      const user = client.data.user;
      let index;
      index = this.games.findIndex(e => e.players[0].player.id === user.id);
      if (index === -1)
      {
        index = this.games.findIndex(e => e.players[1].player.id === user.id);
        if (index === -1)
          throw new WsException('Game doesnt exists');
      }
      let player1 = this.games[index].players[0];
      let player2 = this.games[index].players[1];
      if (player1.player.id === user.id)
        this.gameService.movePlayerDown(player1);
      else if (player2.player.id === user.id)
        this.gameService.movePlayerDown(player2);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  async endGame(game: Game)
  {
    // game loop is ended
    clearInterval(game.intervalId);
    const matchBody: MatchDto = {
      homePlayerId: game.players[0].player.id,
      awayPlayerId: game.players[1].player.id,
      winnerId: game.winner.player.id,
      homeScore: game.players[0].score,
      awayScore: game.players[1].score
    };
    // save game data with sending http request
    await axios({
      url: 'http://' + process.env.DB_HOST + ':3000/match',
      method: 'POST',
      data: matchBody
    });
    this.userService.updateStatus(game.players[0].player, UserStatus.online);
    this.userService.updateStatus(game.players[1].player, UserStatus.online);
    this.wss.to(game.name).emit('gameEndToClient', game.winner.player.username);
    this.wss.to(game.name).emit('newSpectatorToClient', { username: null, room: null });
    const gameNames: gameNames[] = [];
    for (var i = 0; i < this.games.length; i++)
    {
      const gameName = {id: i, name: this.games[i].name}
      if (gameName.name !== game.name)
        gameNames.push(gameName);
    }
    const index = this.games.findIndex(e => e.id === game.id);
    this.games.splice(index, 1);
    this.wss.emit('getGamesToClient', gameNames);
    // this.wss.to(game.name).emit('gameStartsToClient', null);
    setTimeout(() => {
      this.wss.to(game.name).emit('gameEndToClient', '');
      this.wss.to(game.name).emit('gameStartsToClient', null);
    // players leaves from gameroom and game has been deleted from game array
    // setTimeout(() => {
      this.wss.to(game.name).socketsLeave(game.name);
      
    }, 2000);
    
  }

  addPlayersToGame(player1: UserEntity, player2: UserEntity, room: string)
  {
    for (var i = 0; i < this._sockets.length; i++)
    {
        if (this._sockets[i].data.user.username === player1.username)
            this._sockets[i].join(room);
        if (this._sockets[i].data.user.username === player2.username)
            this._sockets[i].join(room);
    }
    var j = 0;
    const gameNames: gameNames[] = [];
    for (var i = 0; i < this.games.length; i++)
    {
      j++;
      const gameName = {id: i, name: this.games[i].name}
      gameNames.push(gameName);
    }
    gameNames.push({id: j, name: room});
    this.wss.emit('getGamesToClient', gameNames);
    this.wss.to(room).emit('gameStartsToClient', room);
    this.userService.updateStatus(player1, UserStatus.playing);
    this.userService.updateStatus(player2, UserStatus.playing);
  }

  startGame(player1: Player, player2: Player, gameOptions: GameOptions)
  {
    // adding players to game room and game will be created
    const room = `game_with_${player1.player.id}_${player2.player.id}`;
    this.addPlayersToGame(player1.player, player2.player, room);
    this.createGame(player1, player2, gameOptions, room);
  }

  createGame(player1: Player, player2: Player, gameOptions: GameOptions, room: string)
  {
    player1 = this.gameService.initPlayer1(player1.player, gameOptions);
    player2 = this.gameService.initPlayer2(player2.player, gameOptions);
    const ball = this.gameService.initBall(gameOptions);
    const sounds = this.gameService.initSound();
    let game: Game = {
        id: this.gameId++,
        options: gameOptions,
        players: [player1, player2],
        finished: false,
        name: room,
        ball,
        sounds
    };
    // Wait 5 seconds to start the game
    let pause = true;
    setTimeout(() => {
      pause = false;
    }, 5000);
    game.ball.vy = 0;
    game.ball.vx = 1;
    // game.ball = this.gameService.setRandomBallDirection(game, Math.floor(Math.random() * 2) + 1);
    this.games.push(game);
    // create game loop with 60fps
    game.intervalId = setInterval(async () => 
    {
      if (pause === false)
      {
        // check ball position and move ball
        game = this.gameService.checkBallPosition(game);
        if (game.sounds.score === true)
        {
          // 1 second pause if someone scored
          pause = true;
          setTimeout(() => {
            pause = false;
            game.ball.vy = 0;
            game.ball.vx = 1;
            // game.ball = this.gameService.setRandomBallDirection(game, Math.floor(Math.random() * 2) + 1);
          }, 1000);
          if (game.finished === true)
            this.endGame(game);
        }
      }
      this.sendGameUpdate(game);
      game.sounds = this.gameService.initSound();
    }, 16); // change it to 16 later
  }

  sendGameUpdate(game: Game)
  {
    const gameUpdate = {
      player1: {
        user: game.players[0].player,
        x: game.players[0].x,
        y: game.players[0].y,
        score: game.players[0].score
      },
      player2: {
        user: game.players[1].player,
        x: game.players[1].x,
        y: game.players[1].y,
        score: game.players[1].score
      },
      ball: {
        x: game.ball.x,
        y: game.ball.y,
        size: game.ball.size
      },
      options: game.options,
      name: game.name,
      sounds: game.sounds
    };
    this.wss.to(game.name).emit('gameUpdateToClient', gameUpdate);
  }

  private error(@ConnectedSocket() socket: Socket, error: object, disconnect: boolean = false)
  {
    socket.emit('Error', error);
    if (disconnect)
      socket.disconnect();
  }
}