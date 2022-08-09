import { User } from "./user";

export class Invite
{
    constructor(
        public id: number,
        public username: string,
    ) {}
}

export class gameUpdate
{
    constructor(
        public player1: PlayerClass,
        public player2: PlayerClass,
        public ball: BallClass,
        public options: GameOptions,
        public name: string,
        public sounds: Sound,
    ) {}
}

export class PlayerClass
{
    constructor(
        public user: User,
        public x: number,
        public y: number,
        public score: number,
    ) {}
}

export class BallClass
{
    constructor(
        public x: number,
        public y: number,
        public size: number,
    ) {}
}

export class GameClass
{
    constructor(
        public id: number,
        public options: GameOptions,
        public players: Player[],
        public spectators: User,
        public finished: boolean,
        public winner: Player,
        public name: string,
        public ball: Ball,
        public sounds: Sound,
    ){}
}

export class Player
{
    constructor(
        public player: User,
        public x: number,
        public y: number,
        public paddle: Paddle,
        public color: string,
        public score: number,
    ) {}
}

export class Ball
{
    constructor(
        public x: number,
        public y: number,
        public speed: number,
        public size: number,
        public color: string,
    ) {}
}

export class Paddle
{
    constructor(
        public h: number,
        public w: number,
        public speed: number,
    ) {}
}

export class GameOptions
{
    constructor(
        public paddleSize: number,
        public paddleSpeed: number,
        public ballSpeed: number,
    ) {}
}

export class Sound
{
    constructor(
        public hit: boolean,
        public wall: boolean,
        public score: boolean,
        public win: boolean,
        public loose: boolean,
    ) {}
}

export class Canvas
{
    constructor(
        public h: number,
        public w: number,
    ) {}
}

export class gameNames
{
    constructor(
        public id: number,
        public name: string,
    ) {}
}