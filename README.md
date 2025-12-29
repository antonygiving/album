# Thank You God - Album Website

This is a website for the album "Thank You God" by 24. It has songs, merch store, and ways for fans to support.

## What You Need to Know

- It's made with code that runs on a computer server.
- You can listen to songs, buy merch, and donate.
- There's a secret admin area to add new songs and merch.

## How to Put It Online (Hosting)

To make the website live on the internet, you need a hosting service. Here's how:

1. **Pick a Hosting Service:**
   - Heroku (easy for beginners)
   - Railway
   - DigitalOcean
   - Vercel

2. **For Heroku (Simple Way):**
   - Go to heroku.com and make an account.
   - Download Heroku CLI on your computer.
   - Open command prompt and type:
     ```
     heroku login
     heroku create your-app-name
     git push heroku main
     ```
   - Your site will be at https://your-app-name.herokuapp.com

3. **Set Up Secrets:**
   - You need a .env file with secret keys for payments.
   - Ask a grown-up for help with this part.

## How to Add New Songs (Tracks)

1. Go to your website's admin page: https://your-app-name.herokuapp.com/admin.html
2. Login with password: admin123
3. Click "Tracks" tab.
4. Click "Add New Track".
5. Fill in:
   - Title: Song name
   - Story: Tell about the song
   - Spotify URL: Link to Spotify
   - Apple Music URL: Link to Apple
   - YouTube URL: Link to YouTube
   - Audio File Path: Where the song file is (like audio/track8.mp3)
6. Click "Save Track".

## How to Add New Merch

1. Go to admin page: https://your-app-name.herokuapp.com/admin.html
2. Login with password: admin123
3. Click "Merch" tab.
4. Click "Add New Merch Item".
5. Fill in:
   - Name: What it is (like "T-Shirt")
   - Category: Apparel, Accessories, or Collectibles
   - Price: How much it costs
   - Badge: Like "New" or "Best Seller"
   - Sizes: S, M, L, XL
   - Colors: Black:#000000, White:#FFFFFF
   - Images: Links to pictures
   - Description: Tell about it
6. Click "Save Merch Item".

## Tips

- Always test your changes.
- Back up your files.
- If stuck, ask for help from someone who knows coding.

Have fun with your album website! 🎵
