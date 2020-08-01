const test = require('ava');
const dedent = require('dedent');
const mockFs = require('mock-fs');
const transform = require('../lib/cjs/transform').default;

test('basic field name transforms', async (t) => {
    mockFs({
        '/transforms.yaml': dedent`
                models:
                    - name: User
                      fields:
                        - field: UserSession
                          attributes:
                            fieldName: sessions
                        - field: Photo
                          attributes:
                            fieldName: uploadedPhotos

                    - name: UserSession 
                      fields:
                        - field: User
                          attributes:
                            fieldName: user

                    - name: Photo
                      fields:
                        - field: User
                          attributes:
                            fieldName: uploadedBy
            `,
        '/schema.prisma': dedent`
                generator client {
                    provider = "prisma-client-js"
                }

                datasource db {
                    provider = "postgresql"
                    url      = env("DATABASE_URL")
                }

                model User {
                    id           String        @id
                    created      DateTime      @default(now())
                    name         String?
                    email        String        @unique
                    passwordHash String
                    UserSession  UserSession[]
                    Photo        Photo[]
                }

                model UserSession {
                    token   String   @id
                    created DateTime @default(now())
                    userId  String
                    User    User     @relation(fields: [userId], references: [id])
                }

                model Photo {
                    id             String  @id
                    title          String?
                    url            String
                    userUploadedId String
                    User           User    @relation(fields: [userUploadedId], references: [id])
                }              
            `,
    });

    const transformedFile = await transform('/schema.prisma', '/transforms.yaml');
    mockFs.restore()
    t.snapshot(transformedFile);
});
