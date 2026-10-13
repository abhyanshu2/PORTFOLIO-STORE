# Abhyanshu Raj Portfolio and Store

This is my personal portfolio website. It also has a small digital store inside it, where people can look at templates, apps, free resources and services, and contact me on WhatsApp to buy or hire. I manage everything from a private admin page.

## Contents

- [What is inside](#what-is-inside)
- [Tech used](#tech-used)
- [Folder structure](#folder-structure)
- [Run it on your computer](#run-it-on-your-computer)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [How to use the website](#how-to-use-the-website)
- [Admin page](#admin-page)
- [Changing the content](#changing-the-content)
- [Deploy on Vercel](#deploy-on-vercel)
- [Commands](#commands)

## What is inside

**Portfolio**
- One page with these sections: Hero, About, Skills, Projects, Education and Contact
- Light and dark theme button
- Fluid cursor effect
- Mobile menu
- Contact form. The messages are saved in the database and I read them in the admin page
- A "Visit Store" button that opens the store on top of the portfolio

**Store**
- Templates for Birthday, Proposal, Wedding and Sorry pages, with category filter and search
- My Products, which shows my apps as Live or Coming soon
- Free Resources like notes and PDFs
- Services that people can hire me for, with starting prices
- Buy Now and Hire Me buttons open WhatsApp with a ready message. Each click is also saved as an order so I can follow up
- If the database is not working, the store shows the built-in data, so it never looks empty

**Birthday Scrapbook demo**
- Live demo of one of my templates at `/templates/birthday-scrapbook`
- A photo collage page and a flip book page at `/templates/birthday-scrapbook/book`
- You can upload your own photos and change every caption
- Works on mobile and desktop

**Admin page**
- Private page at `/admin`, login is at `/admin/login`
- Add, edit and delete templates, products, resources and services
- See orders and messages

## Tech used

- TanStack Start (React 19 with TanStack Router)
- Vite and Nitro
- Tailwind CSS 4, Radix UI and shadcn/ui
- Supabase for database, login and file storage
- React Hook Form and Zod for forms
- TypeScript

## Folder structure

```
public/                  images, favicon, robots.txt
src/
  routes/                all pages (home, admin, scrapbook demo)
  components/
    portfolio/           portfolio sections, contact form, cursor effect
    store/               store overlay
    admin/               admin tables and panels
    templates/           scrapbook template parts
    ui/                  small reusable components
  data/store/            built-in store data and contact details
  lib/                   supabase client, data hooks, upload helper
  styles.css             global styles
supabase/schema.sql      database tables, rules and starter data
.env.example             sample environment file
vite.config.ts           build settings
```

## Run it on your computer

You need Node.js 20 or newer and a free Supabase account.

```bash
npm install
cp .env.example .env
npm run dev
```

Open `.env` and put your own Supabase values in it (see the next section). After that the site opens at the address shown in the terminal, usually `http://localhost:3000`.

## Environment variables

Make a `.env` file in the main folder, next to `package.json`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find both in Supabase under Project Settings, then API.

Do not upload the `.env` file to GitHub. It is already in `.gitignore`.

## Supabase setup

Do this one time for a new project.

**1. Create the tables**

Open your Supabase project, go to SQL Editor and click New query. Copy everything from `supabase/schema.sql`, paste it and press Run.

This creates all the tables, the security rules and some starter content. The rules are simple:
- Anyone can read the store items
- Anyone can send an order click or a contact message
- Only the logged in admin can read orders and messages or change the store items

**2. Create the storage bucket**

Photo uploads go to a bucket called `template-media`.
- Go to Storage and click New bucket
- Name it exactly `template-media`
- Turn on Public bucket

**3. Create the admin user**

Go to Authentication, then Users, then Add user. Enter your email and a strong password. Use the same details to log in at `/admin/login`.

## How to use the website

**As a visitor**
1. Scroll down the portfolio or use the top menu to jump to a section.
2. Click Visit Store to open the store.
3. Pick a category or type in the search box to find a template.
4. If a template has a demo, open it to see how it works.
5. Click Buy Now. WhatsApp opens with a message that already has the product name. Send it and you will get the payment details.
6. For work, go to Services and click Hire Me.
7. Free resources can be opened or downloaded directly.
8. To message me, use the contact form at the bottom of the portfolio.

**Using the Birthday Scrapbook demo**
1. Open the demo from the store.
2. Click a photo slot to add your own picture.
3. Click any text to change it.
4. Drag, zoom and pin photos on the collage page.
5. Open the book page to flip through it.
6. Your changes are saved in your browser.

## Admin page

Go to `/admin/login` and sign in with the user you made in Supabase.

- **Templates**: add, edit and delete templates, set price, badge and category
- **My Products**: manage apps and mark them Live or Coming soon
- **Resources**: add or remove free downloads
- **Services**: change names, descriptions, features and prices
- **Orders**: see every Buy Now and Hire Me click and set the status to new, contacted or closed
- **Messages**: read contact form messages, mark as read or delete

Changes show on the live site straight away. No redeploy is needed.

## Changing the content

| What | Where |
| --- | --- |
| WhatsApp number, email, social links | `src/data/store/contact.ts` |
| Portfolio text, projects, skills, education | `src/components/portfolio/Portfolio.tsx` |
| Page title and description | `src/routes/index.tsx` |
| Colours and fonts | `src/styles.css` |
| Built-in store data | `src/data/store/` |
| Profile photo and favicon | `public/` |
| Store items on the live site | Admin page |

## Deploy on Vercel

1. Push the project to a GitHub repository.
2. On Vercel click Add New, then Project, and import the repository.
3. Add these two environment variables before deploying:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click Deploy.

Add the variables before the first deploy. They are built into the site while it builds, so if you add them later you have to redeploy.

The project is already set up for Vercel in `vite.config.ts`, so nothing else needs to be changed.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | starts the dev server |
| `npm run build` | makes a production build |
| `npm run preview` | previews the production build |
| `npm run lint` | checks the code for problems |
| `npm run format` | formats the code with Prettier |

## Contact

Abhyanshu Raj, Frontend Developer
GitHub: [github.com/abhyanshu2](https://github.com/abhyanshu2)
