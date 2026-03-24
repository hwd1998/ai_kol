export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    synchronize: boolean;
    logging: boolean;
  };
}

export function configuration(): AppConfig {
  return {
    port: Number(process.env.PORT ?? '3000'),
    jwt: {
      secret: process.env.JWT_SECRET ?? 'change_me',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    },
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USER ?? 'creatorhub_user',
      password: process.env.DB_PASS ?? 'creatorhub_password_change_me',
      name: process.env.DB_NAME ?? 'creatorhub_db',
      synchronize: (process.env.DB_SYNCHRONIZE ?? 'false') === 'true',
      logging: (process.env.DB_LOGGING ?? 'false') === 'true',
    },
  };
}

