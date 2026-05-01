import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { BlogsModule } from './modules/blogs/blogs.module';
import { SupabaseService } from './common/services/SupabaseService ';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        // host: configService.get<string>('DATABASE_HOST', 'localhost'),
        // port: configService.get<number>('DATABASE_PORT', 5434),
        // username: configService.get<string>('DATABASE_USER', 'postgres'),
        // password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        // database: configService.get<string>('DATABASE_NAME', 'ecommerce_db'),
        ssl: {
          rejectUnauthorized: false,
        },
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
      }),
    }),
    AuthModule,
    UsersModule,
    BlogsModule,
  ],
  providers: [SupabaseService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
