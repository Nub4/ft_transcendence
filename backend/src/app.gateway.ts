import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth/auth.service';
import { Game, GameOptions, Invites, Paddle, Player, gameNames } from './game/game.class';
import { MatchDto } from './match/dto/match.dto';
import { UserEntity, UserStatus } from './user/entities/user.entity';
import { UserService } from './user/user.service';
import axios from 'axios';
import { GameService } from './game/game.service';
import { CreateMessageToChatDto, InvitePlayerOptions, SetPasswordDto } from './chat/dto/chat.dto';
import { ChatService } from './chat/service/chat.service';
import { ChatUtilsService } from './chat/service/chatUtils.service';


@WebSocketGateway({cors: { origin: `http://localhost:3000`, credentials: true }})
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
    ballSpeed: 3
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
      const user = client.data.user;
      this.userService.updateStatus(client.data.user, UserStatus.offline);
      this.logger.log(`client disconnected: ${client.id}`);
      const index2 = this.queue.findIndex(e => e.id === user.id);
      this.queue.splice(index2, 1);
      const index = this._sockets.findIndex(e => e.id === client.id);
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

  ///////// CHAT PART /////////////

  @SubscribeMessage('getChannelsToServer')
  async getChannels(@ConnectedSocket() client: Socket, @MessageBody() page: number)
  {
    try
    {
      const user = client.data.user;
      const result = await this.chatUtilService.paginate(page);
      this.wss.emit('getChannelsToClient', result);
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
      client.join(channelData.name);
      const allMessages = await this.chatService.getMessagesFromChannel(channelData.name, user);
      this.wss.to(channelData.name).emit('joinToClient', { msg: `${user.username} joined to channel at ${new Date}`, channel: channelData.name, messages: allMessages });
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('leaveToServer')
  async leaveChannel(@ConnectedSocket() client: Socket, @MessageBody() id: number)
  {
    try
    {
      const user = client.data.user;
      const channel = await this.chatUtilService.getChannelById(id);
      const name = channel.name;
      await this.chatService.leaveChannel(id, user);
      client.leave(name);
      this.wss.to(name).emit('leaveToClient', `User: ${user.username} left from the channel`)
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
      for (const member of channel.members)
        if (await this.userService.isblocked_true(user, member) === false)
          for (var i = 0; i < this._sockets.length; i++)
            // if (this._sockets[i].data.user.username === user.username)
            this._sockets[i].emit('msgToClient', allMessages);
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
  async acceptInvite(@ConnectedSocket() client: Socket, @MessageBody() sender2: string)
  {
    try
    {
      const invitedUser = client.data.user;
      const sender = await this.userService.getUserByName(sender2);
      const index = this.invites.findIndex(function (Invite) {
        return Invite.sender === sender2 && Invite.invitedUser === invitedUser.username;
      });
      if (index === -1)
      {
        client.emit('acceptInviteToClient', 'Invite doesnt exists');
        return ;
      }
      const gameOptions = this.invites[index].gameOptions;
      // remove invited user from invites
      this.invites.splice(index, 1);
      const player1: Player = { player: sender };
      const player2: Player = { player: invitedUser };
      // start the game
      this.startGame(player1, player2, gameOptions);
    }
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('leaveGameToServer')
  async leaveGame(@ConnectedSocket() client: Socket, @MessageBody() room: string)
  {
    try
    {
      // find the game
      const game = this.games.find(e => e.name === room);
      if (game.players[0].player.username === client.data.user.username)
        game.winner = game.players[1];
      else if (game.players[1].player.username === client.data.user.username)
        game.winner = game.players[0];
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
    catch { throw new WsException('Something went wrong'); }
  }

  @SubscribeMessage('newSpectatorToServer')
  async addSpectator(@ConnectedSocket() client: Socket, @MessageBody() room: string)
  {
    try
    {
      const user = client.data.user;
      // user joins to game as a spectator
      client.join(room);
      this.wss.to(room).emit('newSpectatorToClient', { username: user.username, room: room });
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
      url: `http://localhost:3000/match`,
      method: 'POST',
      data: matchBody
    });
    this.wss.to(game.name).emit('gameEndToClient', game.winner.player.username);
    setTimeout(() => {
      this.wss.to(game.name).emit('gameEndToClient', '');
      this.wss.to(game.name).emit('gameStartsToClient', null);
    }, 9000);
    // players leaves from gameroom and game has been deleted from game array
    setTimeout(() => {
      this.wss.to(game.name).socketsLeave(game.name);
      const index = this.games.findIndex(e => e.id === game.id);
      this.games.splice(index, 1);
    }, 10000);
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
    this.wss.to(room).emit('gameStartsToClient', room);
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
    game.ball.direction = this.gameService.setRandomBallDirection(Math.floor(Math.random() * 2) + 1);
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
            game.ball.direction = this.gameService.setRandomBallDirection(Math.floor(Math.random() * 2) + 1);
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