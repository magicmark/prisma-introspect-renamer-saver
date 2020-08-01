# Snapshot report for `tests/test.js`

The actual snapshot is saved in `test.js.snap`.

Generated by [AVA](https://avajs.dev).

## basic field name transforms

> Snapshot 1

    `generator client {␊
        provider = "prisma-client-js"␊
    }␊
    ␊
    datasource db {␊
        provider = "postgresql"␊
        url      = env("DATABASE_URL")␊
    }␊
    ␊
    model User {␊
        id           String        @id␊
        created      DateTime      @default(now())␊
        name         String?␊
        email        String        @unique␊
        passwordHash String␊
        sessions  UserSession[]␊
        uploadedPhotos        Photo[]␊
    }␊
    ␊
    model UserSession {␊
        token   String   @id␊
        created DateTime @default(now())␊
        userId  String␊
        user    User     @relation(fields: [userId], references: [id])␊
    }␊
    ␊
    model Photo {␊
        id             String  @id␊
        title          String?␊
        url            String␊
        userUploadedId String␊
        uploadedBy           User    @relation(fields: [userUploadedId], references: [id])␊
    }`