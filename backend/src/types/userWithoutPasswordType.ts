export type UserWithoutPassword = {
  id: string;
  email: string;
  name: string;
  role: 'User' | 'Admin';
};
