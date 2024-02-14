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

The following table describes the environment variables used by the app.

| Variable Name     | Description                           | Type   | Required | Default        |
| ----------------- | ------------------------------------- | ------ | -------- | -------------- |
| `DATABASE_URL`    | The Database access URL to MongoDb    | String | Yes      | ''             |
| `JWT_SECRET`      | The secret used to encrypt JWT tokens | String | Yes      | ''             |
| `AWS_ACCESS_KEY`  | Access Key for AWS User               | String | Yes      | ''             |
| `AWS_SECRET_KEY`  | Secret Key for AWS User               | String | Yes      | ''             |
| `SITE_NAME`       | The name of the website               | String | No       | 'Howling Blog' |
| `NEXTAUTH_SECRET` | Secret Key for Authentication         | String | Yes      | ''             |

Put the required variables in `.env` file in the project root directory (next to `package.json` and others)

### Development and Deployment

As this is a standard Next.js project, development can be started by using the `dev` script defined in `package.json`, as well as creating deployment builds with `build` script. This repo mainly uses `pnpm`.

### Application Special Configs

1. `ALLOW_USER_CREATION`: Set to `FALSE` (case-sensitive) to disable user creation through /api/signupv2 route
2. `LOGIN_BACKGROUND_IMAGE`: Set to direct link of an image to change login page background.

# TODO

-   WYSIWYG Editor : Done
-   Post CRUD : Done
-   Tags CRUD
-   Snippets CRUD
-   User Management : Ongoing
-   Assets Management : Done
-   RBAC : Done
-   Template Designer
-   Post as Building Blocks
