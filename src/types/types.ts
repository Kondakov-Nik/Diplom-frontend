export type loginDto = {
  email: string;
  password: string;
};

export type CreateUserDto = {
  username: string;
  birthDate: string,
} & loginDto;

export type ResponceUser ={
  token:string
}