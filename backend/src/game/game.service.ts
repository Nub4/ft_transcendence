import { Injectable } from '@nestjs/common';
import { UserEntity } from 'src/user/entities/user.entity';
import { Ball, Canvas, Game, GameOptions, Paddle, Player, Sound } from './game.class';

@Injectable()
export class GameService
{
    constructor() {}

    private readonly defaultCanvas: Canvas = {
        h: 200,
        w: 400,
    };

    // when player hits the ball
    setRandomBallDirection(game: Game, x: number)
    {
        var angle = Math.random() * Math.PI / 2 - Math.PI / 5;
        game.ball.vx = Math.cos(angle);
        game.ball.vy = Math.sin(angle);
        if (x === 1)
        {
            if (game.players[0].y + game.options.paddleSize / 2 > game.ball.y && game.ball.vy > 0)
                game.ball.vy = game.ball.vy * (-1);
            if (game.players[0].y + game.options.paddleSize / 2 < game.ball.y && game.ball.vy < 0)
                game.ball.vy = game.ball.vy * (-1);
        }
        if (x === 2) // away player
        {
            game.ball.vx = game.ball.vx * (-1);
            if (game.players[1].y + game.options.paddleSize / 2 > game.ball.y && game.ball.vy > 0)
                game.ball.vy = game.ball.vy * (-1);
            if (game.players[1].y + game.options.paddleSize / 2 < game.ball.y && game.ball.vy < 0)
                game.ball.vy = game.ball.vy * (-1);
        }
        return game.ball;
    }

    // when ball hits top or bottom
    changeBallDirection(ball: Ball)
    {
        ball.vy = ball.vy * (-1);
        return ball;
    }

    resetBall(ball: Ball)
    {
        ball.vx = 0;
        ball.vy = 0;
        ball.x = this.defaultCanvas.w / 2;
        ball.y = this.defaultCanvas.h / 2;
        return ball;
    }

    resetPlayer1(player: Player)
    {
        player.x = 20;
        player.y = this.defaultCanvas.h / 2;
        return player;
    }

    resetPlayer2(player: Player)
    {
        player.x = this.defaultCanvas.w - 30;
        player.y = this.defaultCanvas.h / 2;
        return player;
    }

    // returns true if player hits the ball, false if its a goal
    checkIfHomePlayerHitsBall(game: Game)
    {
        var size = game.players[0].paddle.h;
        if (game.ball.x <= 20 && game.ball.x >= 10)
            while (--size >= 0)
                if (game.players[0].y + size <= game.ball.y && game.players[0].y + size >= game.ball.y - 1)
                    return true;
        return false;
    }

    // returns true if player hits the ball, false if its a goal
    checkIfAwayPlayerHitsBall(game: Game)
    {
        var size = game.players[1].paddle.h;
        if (game.ball.x >= this.defaultCanvas.w - 30 && game.ball.x <= this.defaultCanvas.w - 20)
            while (--size >= 0)
                if (game.players[1].y + size <= game.ball.y && game.players[1].y + size >= game.ball.y -1)
                    return true;
        return false;
    }

    // checks if ball position hits bottom or top, or if it's a goal. If it's not a goal, ball moves
    checkBallPosition(game: Game)
    {
        if (game.ball.x < 20)
        {
            if (this.checkIfHomePlayerHitsBall(game) === true)
            {
                game.sounds.hit = true;
                game.ball = this.setRandomBallDirection(game, 1);
            }
            else if (game.ball.x < 10)
                return this.goal(2, game);
        }
        else if (game.ball.x > this.defaultCanvas.w - 30)
        {
            if (this.checkIfAwayPlayerHitsBall(game) === true)
            {
                game.sounds.hit = true;
                game.ball = this.setRandomBallDirection(game, 2);
            }
            else if (game.ball.x > this.defaultCanvas.w - 20)
                return this.goal(1, game);
        }
        else if (game.ball.y > this.defaultCanvas.h - 7 || game.ball.y < 3)
        {
            game.sounds.wall = true;
            game.ball = this.changeBallDirection(game.ball);
        }
        game.ball = this.moveBall(game.ball);
        return game;
    }

    goal(num: number, game: Game)
    {
        game.sounds.score = true;
        if (num === 1)
            game.players[0].score++;
        else if (num === 2)
            game.players[1].score++;
        if (game.players[0].score === 10)
        {
            game.sounds.win = true;
            game.sounds.loose = true;
            game.winner = game.players[0];
            game.finished = true;
        }
        else if (game.players[1].score === 10)
        {
            game.sounds.win = true;
            game.sounds.loose = true;
            game.winner = game.players[1];
            game.finished = true;
        }
        game.ball = this.resetBall(game.ball);
        game.players[0] = this.resetPlayer1(game.players[0]);
        game.players[1] = this.resetPlayer2(game.players[1]);
        return game;
    }

    movePlayerUp(player: Player)
    {
        if (player.y < this.defaultCanvas.h - player.paddle.h - 7)
            player.y += player.paddle.speed;
        return player;
    }

    movePlayerDown(player: Player)
    {
        if (player.y > 3)
            player.y -= player.paddle.speed;
        return player;
    }

    moveBall(ball: Ball)
    {
        ball.x = ball.x + ball.vx * ball.speed;
        ball.y = ball.y + ball.vy * ball.speed;
        return ball;
    }

    initPlayer1(user: UserEntity, gameOptions: GameOptions)
    {
        const player: Player = {
            player: user,
            x: 20,
            y: this.defaultCanvas.h / 2,// - gameOptions.paddleSize / 2,
            paddle: this.initPaddle(gameOptions),
            color: 'red',
            score: 0
        };
        return player;
    }

    initPlayer2(user: UserEntity, gameOptions: GameOptions)
    {
        const player: Player = {
            player: user,
            x: this.defaultCanvas.w - 30,
            y: this.defaultCanvas.h / 2,// - gameOptions.paddleSize / 2,
            paddle: this.initPaddle(gameOptions),
            color: 'blue',
            score: 0
        };
        return player;
    }

    initPaddle(gameOptions: GameOptions)
    {
        const paddle: Paddle = {
            h: gameOptions.paddleSize,
            w: 10,
            speed: gameOptions.paddleSpeed
        };
        return paddle;
    }

    initBall(gameOptions: GameOptions)
    {
        const ball: Ball = {
            x: this.defaultCanvas.w / 2,
            y: this.defaultCanvas.h / 2,
            vx: 0,
            vy: 0,
            speed: gameOptions.ballSpeed,
            size: 5,
            color: 'green'
        };
        return ball;
    }

    initSound()
    {
        const sound: Sound = {
            hit: false,
            wall: false,
            score: false,
            win: false,
            loose: false
        };
        return sound;
    }
}