import { UserEntity } from "src/user/entities/user.entity";

export class Game
{
    id: number;
    options: GameOptions;
    players: Player[];
    spectators?: UserEntity[];
    finished: boolean;
    winner?: Player;
    name: string;
    ball: Ball;
    sounds: Sound;
    intervalId?: NodeJS.Timer;
}

export class Player
{
    player: UserEntity;
    x?: number;
    y?: number;
    paddle?: Paddle;
    color?: string;
    score?: number;
}

export class Ball
{
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    size: number;
    color: string;
}

export class Paddle
{
    h: number;
    w: number;
    speed: number;
}

export class GameOptions
{
    paddleSize: number;
    paddleSpeed: number;
    ballSpeed: number;
}

export class Sound
{
    hit: boolean;
    wall: boolean;
    score: boolean;
    win: boolean;
    loose: boolean;
}

export class Canvas
{
    h: number;
    w: number;
}

export class Invites
{
    sender: string;
    invitedUser: string;
    gameOptions: GameOptions;
}

export class gameNames
{
    id: number;
    name: string;
}