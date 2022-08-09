import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UsernameDto {
    @IsNotEmpty()
    @IsString()
    username: string;
}