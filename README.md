# Howling Blog

A custom made personal blog framework with it's renderer and it's own CMS.

## Why?

Of course as a way to learn through project-based approach. I aim to build the components by myself as much as I can so that I can understand the pain of building a web application.

## Getting Started

This repository contains the base application for a blog with it's own CMS. You can see the running app, which is my own blog, over [Howling Blog](https://blog.howlingmoon.dev)

It's based on `Next.js` with currently used version is version **14**. This application uses the App Router directory structure.

There are 2 external components that this application relies on: MongoDB and AWS S3.  
The former holds everything that it needs to store the pages, users, basically every data-related resources, while the latter stores the assets. All the posts are stored as documents inside MongoDb in the form of rendered HTML, so the public-facing part will just need to render the fetched HTML.

## Features

-   Fully functional blog platform with just the features required to create blog posts.
-   SSR powered by Next.js. As such, all other features offered by Next.js are also available, making this base application very extensible.
-   Create blog posts using WYSIWYG Editor, powered by Quill.js

## Usage

### Prepare dependencies

1. MongoDb

    You can self-host your mongodb instance or use MongoDb Atlas or have other cloud provider provision them for you. As this app uses `Prisma.js`, the requirement for any self-hosted mongodb instance is that it should have replica set enabled. MongoDb Atlas on free tier will give you enough starting point for usable mongodb server, but you can also provision by yourself.

2. AWS S3 Bucket

    This app is able to host it's assets in AWS S3, which is accessible through the dashboard, on asset manager and also on image uploader function attached to Quill.js. Uploaded files on S3 should be accessible publicly, which you can set through bucket policy.

    To manage files, you are required to create credential to access AWS S3, which should be through IAM user. The access key and secret key will be used as environment variables, which described below.

### Prepare environment variables and configs

Put the required variables in a `.env` file in the project root directory (next to `package.json` and others).

#### Server-side environment variables

| Variable Name              | Description                                          | Required | Default |
| -------------------------- | ---------------------------------------------------- | -------- | ------- |
| `DATABASE_URL`             | MongoDB connection URL (used by Prisma)              | Yes      | —       |
| `NEXTAUTH_SECRET`          | Secret used by NextAuth.js to sign/encrypt tokens    | Yes      | —       |
| `NEXTAUTH_URL`             | Canonical URL of the app (required in production)    | Yes      | —       |
| `JWT_SECRET`               | Secret used to sign legacy JWT tokens                | Yes      | —       |
| `AWS_ACCESS_KEY_UPLOADER`  | AWS IAM access key for S3 asset uploads              | Yes      | —       |
| `AWS_SECRET_KEY_UPLOADER`  | AWS IAM secret key for S3 asset uploads              | Yes      | —       |
| `BUCKET_NAME`              | Name of the AWS S3 bucket used for asset storage     | Yes      | —       |
| `CDN_BASE_URL`             | Base URL of the CDN that fronts the S3 bucket        | No       | —       |

#### Client-side environment variables (`NEXT_PUBLIC_`)

| Variable Name              | Description                                                              | Required | Default                          |
| -------------------------- | ------------------------------------------------------------------------ | -------- | -------------------------------- |
| `NEXT_PUBLIC_CDN_ENABLED`  | Set to `false` to disable CDN URL rewriting in the media library         | No       | `true`                           |
| `NEXT_PUBLIC_CDN_HOST`     | CDN host used to rewrite asset URLs (e.g. `https://cdn.example.com`)     | No       | `https://cdn.howlingmoon.dev`    |

> **Note:** The AWS S3 client is hard-coded to the `ap-southeast-1` region. If you use a different region, update [src/utils/aws-client.ts](src/utils/aws-client.ts).

#### Build-time environment variables

| Variable Name | Description                                          | Required | Default |
| ------------- | ---------------------------------------------------- | -------- | ------- |
| `ANALYZE`     | Set to `true` to enable `@next/bundle-analyzer`      | No       | `false` |

### Development and Deployment

As this is a standard Next.js project, development can be started by using the `dev` script defined in `package.json`, as well as creating deployment builds with `build` script. This repo mainly uses `pnpm`.

### Application Runtime Configs

These settings are stored in the database (via the `/api/v1/config` endpoint) and can be managed from the admin dashboard settings page.

| Config Key                | Description                                                               | Value type |
| ------------------------- | ------------------------------------------------------------------------- | ---------- |
| `ALLOW_USER_CREATION`     | Set to `FALSE` (case-sensitive) to disable new user registration          | String     |
| `LOGIN_BACKGROUND_IMAGE`  | Direct URL of an image to use as the login page background                | String     |

# Roadmap

## ✅ Shipped

- [x] WYSIWYG Editor
- [x] Post CRUD
- [x] Tags CRUD
- [x] Snippets CRUD
- [x] User Management
- [x] Assets Management
- [x] Role-Based Access Control (RBAC)
- [x] API Key Management
- [x] Analytics (page views)
- [x] CDN Support for Media Library
- [x] Application Config Management (via dashboard)

## 🔜 Upcoming

- [ ] Template Designer
- [ ] Post as Building Blocks
