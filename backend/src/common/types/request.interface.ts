import { Request } from 'express';

// Define the structure of the user object that our JWT strategy attaches to the request.
interface UserPayload {
  userId: string;
  role: string;
}

// Extend the Express Request interface to include our custom 'user' property.
export interface CustomRequest extends Request {
  user: UserPayload;
}
