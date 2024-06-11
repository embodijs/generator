---
title: Welcome to embodi
layout: Home
---

## Intro

Embodi is a static site generator based on vite and svelte components.

## Editing

To edit this page you need to edit the `index.md` file in the root directory of you project. Everything here written in [Markdown](https://www.markdownguide.org/basic-syntax/).

## Layout

At the top in the front-matter part (starts and ends with `---`) and the markdown this markdown part a interpreted by the layout file mentioned in the front-matter part. You will find this file in `__layout`. `Home` is referencing the file `__layout/Home.svelte`.

## Public files

Files in the public folder are public in general. For example you can use it to reference images

![Some example image]('/example.webp')
