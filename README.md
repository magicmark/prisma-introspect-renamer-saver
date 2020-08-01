# PIRS: prisma-introspect-renamer-saver

![](https://i.fluffy.cc/q6wwsSBCTXKGkgcxnCBq666RWjMQPWn1.png)

PIRS (prisma-introspect-renamer-saver) transforms a `.prisma` file to apply a set
of diffs on the generated data model. This automates the mapping that may have to
be done after each time `$ prisma introspect` is run to make it fit the
[naming conventions][conventions].

## Install

```bash
$ yarn add --dev pirs
```

## Usage

```bash
$ yarn pirs -p schema.prisma -t transforms.yaml --write
```

(See `yarn pirs --help` for more options.)

## Motivation

The generated Prisma data model (the `.prisma` file) that may not confirm to the
[Prisma data model conventions][conventions], so it is encouraged to edit the
file accordingly.

[conventions]: https://www.prisma.io/docs/reference/tools-and-interfaces/introspection#rules-and-conventions

Howver according to the [Prisma's docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/configuring-the-prisma-client-api#renaming-relation-fields):

> Warning:
>
> Prisma-level relation fields that were renamed in the Prisma schema will be reset when you run prisma introspect again.
> You therefore might want to back up your Prisma schema with these attributes in order to not having to annotate everything from scratch again after a re-introspection.

It seems as though any artisanally hand crafted changes you make to the generated
`.prisma` file will get blown away each time you run `$ prisma introspect` after
an SQL Schema change

## Example

Consider the following sample `schema.prisma` file:

<details><summary><b>schema.prisma</b></summary>
<p>

```prisma
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
```

</p>
</details>

In accordance with the [naming conventions][conventions], we'd probably want to be transform:

-   `User.UserSession` -> `User.sessions`
-   `User.Photo` -> `User.uploadedPhotos`
-   `UserSession.User` -> `UserSession.user`
-   `Photo.User` -> `Photo.uploadedBy`

[conventions]: https://www.prisma.io/docs/reference/tools-and-interfaces/introspection#rules-and-conventions

Applying the following `transforms.yaml` file lets us do just that:

```yaml
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
```

See [the tests](./tests/test.js) to see this in action.

## API

Currently, we only support rewriting the field names on models.

The `--transformsFile` (or `-t`) arg must point to a yaml file in the following
format:

```typescript
interface Transforms {
    models: Array<{
        name: string;
        fields: Array<{
            field: string;
            attributes: {
                fieldName?: string;
            };
        }>;
    }>;
}
```

## FAQs

#### Why not use \<insert some other tool here>?

I googled and didn't find any other lightweight solutions that that did this. But maybe I missed something! I figure if it does exist, the best way to find out is to publish this and have people let me know about it :)

#### I want this to work with \<insert feature here>?

If there's a feature missing that you think should be added - open up an issue! Even better, PRs are super welcome too :)

#### Why is this code so janky?

I'd love to do a fancy AST transformation, but I didn't fancy writing my own parser :p

## Contact

- [@mark_larah - https://twitter.com/mark_larah](https://twitter.com/mark_larah)