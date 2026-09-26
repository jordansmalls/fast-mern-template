export type User = {
  _id: string
  email: string
  createdAt: string
  updatedAt: string
}
export type AuthResponse = { success: true; message: string; user: User }
export type MessageResponse = { success: true; message: string }
export type Credentials = { email: string; password: string }
export type AccountUpdate = { email?: string; password?: string }
export type HealthResponse = MessageResponse & {
  uptime: number
  timestamp: string
  environment: string
  database: "connected" | "disconnected"
}
export type AuthStatus = "loading" | "authenticated" | "anonymous" | "error"
