export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "Admin" | "User";
}

//DTO for form submission...

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  name: string;
}
