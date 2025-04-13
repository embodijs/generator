---
title: Welcome to Embodi
hero: $assets/chain.jpg
layout: $layout/home
---

## Introduction

Embodi is a static website generator based on vite and svelte components.

## Editing

To edit this page you need to edit the `index.md` file in the root directory of your project. Everything here is written in [Markdown](https://www.markdownguide.org/basic-syntax/).

## Layout

At the top in the front-matter part (starts and ends with `---`) and the markdown this markdown part is interpreted by the layout file mentioned in the front-matter part. You can find this file in `__layout'. Home' refers to the file `\_\_layout/Home.svelte'.

## Public files

Files in the public folder are generally public. For example, you can use them to reference images

![Some example image](/example.webp)

## Global data

To define global or default data, add a file to \_\_data that can be accessed by its filename. The content for a file named nav.yml and an example content of `title: test` could be accessed as `nav.title`.
