import { User } from "./user";

export enum ChannelStatus
{
    public = 'public',
    private = 'private',
    protected = 'protected',
    direct = 'direct'
}

export class MessageI
{
    constructor(
        public id: number,
        public content: string,
        public author: User,
    ) {}
}

export class JoinedUserStatus
{
    constructor(
    public id: number,
    public owner: boolean,
    public admin: boolean,
    public muted: Date,
    public banned: Date,
    public channel: ChannelEntity,
    public user: User,
    ){}
}

export class ChannelEntity
{
    constructor(
        public id: number,
        public name: string,
        public status: ChannelStatus,
        public password: string,
        public joinedUserStatus: JoinedUserStatus[],
        public members: User[],
    ) {}
}