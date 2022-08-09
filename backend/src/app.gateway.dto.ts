import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class userNameDto {
    @IsNotEmpty()
    @IsString()
    username: string;
}

export class userIdDto {
    @IsNotEmpty()
    @IsNumber()
    id: number;
}

export class pageDto {
    @IsNotEmpty()
    @IsNumber()
    page: number;
}

export class nameDto {
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class sender2Dto {
    @IsNotEmpty()
    @IsString()
    sender2: string;
}

export class roomDto {
    @IsNotEmpty()
    @IsString()
    room: string;
}