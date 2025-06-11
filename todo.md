# Next T3 Chat

## To-do

- [x] Make it deploy
- [x] Add shadcn/ui components
- [x] add basic posthog analytics
- [x] add authentcation
- [x] set up webhooks url on clerk
- [x] add dark mode toggle 
- [x] add mock data to nav chats
- [x] do a basic test chat with gemini
- [x] add database schema
- [x] add trpc to fetch data
- [x] set up trpc for data fetching from db
- [x] add search functionality with upstash serach
- [] set up metadata sitemap
- [] create an opengraph image and favicon for Next T3 Chat
- [] deploy clerk to production with the main domain
- [x] link upstash and my vercel project for easy env stuff
- [] set up uploading with tigris data storage
- [x] add webhooks api for auth
- [] add chat titles as the title metadata fro the chat page
- [] add switching of ai models in the chat input
- [] add file uploading in the chat input
- [] add small recent chats to the homepage
- [] write a proper README.md file and also a LISCENCE FILE


## Tech Stack

- Clerk (authentication)
- PostHog (analytic, error tracking)
- Upstash (KV, ratelimit)
- Neon DB (Postgres Database)
- Drizzle orm and Drizzle Kit
- TRPC for data fetching
- Vercel (deployment of nextjs)
- FireCrawl (AI Realtime Web Search)

## Features
- Allow users to upload files (images and pdfs)
- Web Search with (FireCrawl)
- Beautiful code formatting and highlighting
- Connect with Google calendar and store events


## Models
- Gemini
- xAI


## Database Tables
- users 
- chats 
- messages


