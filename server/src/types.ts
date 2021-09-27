export type UserIDType = { idu: number };

export interface SessionStruct {
  pin: string;
  idu: number;
  browser: string;
  ip: string;
  key: string;
  time: number;
}
