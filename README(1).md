# Thank You God - Album Website

A modern, glassmorphic website for 24's album "Thank You God" featuring 7 tracks + 1 exclusive bonus track.

## 🎨 Features

- **Glassmorphic UI Design** - iOS-inspired frosted glass aesthetic with warm gold/cream color palette
- **Email-Gated Content** - 30-second previews unlock to full tracks with email signup
- **Individual Track Pages** - Each song has its own page with story, links, and audio player
- **Responsive Design** - Looks great on all devices (mobile, tablet, desktop)
- **Smooth Animations** - Polished transitions and micro-interactions
- **Donations Page** - Multiple payment options for fan support
- **Merch Section** - Ready for future merch store integration
- **Audio Player** - Custom-built player with progress bar and controls

## 📁 File Structure

```
/
├── index.html              # Homepage with album overview and track list
├── track.html              # Individual track page template
├── donate.html             # Donations/support page
├── merch.html              # Merch page (coming soon)
├── styles.css              # Main stylesheet with glassmorphic effects
├── track-styles.css        # Styles specific to track pages
├── donate-styles.css       # Styles for donations page
├── merch-styles.css        # Styles for merch page
├── script.js               # Main JavaScript (modals, email capture, animations)
├── track-player.js         # Audio player logic and track data
├── album-art.png           # Album artwork
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Customize the Content

**Update Artist Information:**
- In `index.html` and all pages: Replace social media links with actual URLs
- Update the "About 24" section with real bio content

**Add Audio Files:**
- Create an `/audio` folder in the root directory
- Add your audio files (MP3 format recommended): `track1.mp3`, `track2.mp3`, etc.
- Update file paths in `track-player.js`

**Update Track Information:**
- Open `track-player.js`
- Modify the `trackData` object with actual:
  - Song descriptions/stories
  - Spotify links
  - Apple Music links
  - YouTube links
  - Audio file paths

**Update Donation Links:**
- In `donate.html`: Replace placeholder PayPal, Ko-fi, etc. links with actual donation URLs

### 2. Setup Email Collection

The site uses localStorage for demo purposes. For production, integrate with an email service:

**Recommended Services:**
- Mailchimp (Free tier available)
- ConvertKit
- Buttondown
- MailerLite

**Integration Steps:**
1. Sign up for chosen email service
2. Get API key or embed code
3. Update `script.js` in the `emailForm` submit handler
4. Replace localStorage save with actual API call

**Example Mailchimp Integration:**
```javascript
// In script.js, replace the email form handler with:
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    
    // Send to Mailchimp
    const response = await fetch('YOUR_MAILCHIMP_API_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    });
    
    if (response.ok) {
        localStorage.setItem('albumUnlocked', 'true');
        alert('🎉 Access unlocked!');
        modal.style.display = 'none';
    }
});
```

### 3. Hosting Options

**Free Options:**
- **GitHub Pages**: Push code to GitHub, enable Pages in settings
- **Netlify**: Drag & drop the folder or connect Git repo
- **Vercel**: Similar to Netlify, great for automatic deployments

**Paid Options (for custom domain):**
- **Namecheap Hosting**: ~$2-5/month
- **Bluehost**: ~$3-10/month
- **HostGator**: ~$3-7/month

**Hosting Steps (GitHub Pages example):**
```bash
# 1. Create a new repository on GitHub
# 2. Initialize git in your project folder
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# 3. Go to repository Settings → Pages
# 4. Select branch: main, folder: / (root)
# 5. Save and wait a few minutes
# 6. Your site will be live at username.github.io/repo-name
```

### 4. Custom Domain Setup

Once hosted, add your custom domain:

1. Buy domain from Namecheap, GoDaddy, or Google Domains
2. In your hosting platform (Netlify/Vercel/GitHub Pages):
   - Go to domain settings
   - Add your custom domain
   - Follow DNS configuration instructions
3. Update DNS records at your domain registrar
4. Wait 24-48 hours for DNS propagation

## 🎵 Adding Audio Files

### Audio File Requirements:
- Format: MP3 (best compatibility)
- Bitrate: 128-320 kbps
- Sample Rate: 44.1 kHz recommended

### Steps:
1. Create `/audio` folder in root directory
2. Name files: `track1.mp3`, `track2.mp3`, etc.
3. Update `track-player.js`:

```javascript
const trackData = {
    1: {
        // ... other data
        audioFile: "audio/track1.mp3"
    },
    // ... more tracks
};
```

4. In `track-player.js`, uncomment this line (around line 63):
```javascript
audioPlayer.src = currentTrack.audioFile;
```

## 🎨 Customization

### Change Color Scheme

In `styles.css`, modify the CSS variables:

```css
:root {
    --gold: #D4AF37;           /* Main gold color */
    --gold-light: #F4D03F;     /* Lighter gold accent */
    --cream: #E8DCC4;          /* Background cream */
    --cream-dark: #D4C5A9;     /* Darker cream shade */
    --black: #1A1A1A;          /* Text color */
    --white: #F5F5DC;          /* Light accent */
}
```

### Change Fonts

The site uses:
- **Bebas Neue** (headers)
- **Permanent Marker** (handwritten style)
- **Work Sans** (body text)

To change fonts, update the Google Fonts link in all HTML files and modify font-family in CSS.

### Adjust Glassmorphic Effect

Modify blur intensity in `.glass-card`:

```css
.glass-card {
    backdrop-filter: blur(20px);  /* Increase/decrease for more/less blur */
    -webkit-backdrop-filter: blur(20px);
}
```

## 📱 Mobile Optimization

The site is fully responsive. Test on:
- Mobile devices (320px - 480px)
- Tablets (481px - 768px)
- Desktop (769px+)

If you need to adjust breakpoints, modify the `@media` queries at the bottom of each CSS file.

## 🔒 Email Unlock System

**How it works:**
1. User plays any track → hears 30 seconds
2. At 30 seconds, audio pauses automatically
3. Email modal appears
4. User enters email → gets full access
5. Email stored in localStorage (or your email service)
6. User can now play full tracks + bonus track

**To disable preview limit** (for testing):
- In `track-player.js`, comment out lines 118-124 (the preview enforcement code)

## 🎁 Bonus Track

The 8th track is marked as "???" and labeled as exclusive. To reveal it:
- Update the title in `track-player.js` when you want to announce it
- Or keep it mysterious until fans unlock it!

## 📊 Analytics Setup

Add Google Analytics or similar:

1. Get tracking code from analytics platform
2. Add before closing `</head>` tag in all HTML files:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_TRACKING_ID');
</script>
```

## 🛠️ Technical Notes

### Browser Support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Known Limitations:
- Audio files must be hosted on same domain (CORS issues otherwise)
- Backdrop-filter (glassmorphic effect) not supported in older browsers
- LocalStorage email capture is demo only - use real backend in production

## 🚨 Before Going Live Checklist

- [ ] Add actual audio files to `/audio` folder
- [ ] Update all social media links
- [ ] Set up email collection service (Mailchimp, etc.)
- [ ] Update donation/payment links
- [ ] Test email unlock flow
- [ ] Test on mobile devices
- [ ] Add Google Analytics
- [ ] Set up custom domain
- [ ] Test all streaming platform links
- [ ] Update meta tags for SEO (title, description)
- [ ] Add favicon

## 💡 Future Enhancements

Ideas to add later:
- Lyrics display for each track
- Music video embeds
- Live merch store integration (Printful, Shopify)
- Comments section for each track
- Newsletter signup beyond email unlock
- Tour dates section if performing live
- Press kit / EPK page for media

## 🙏 Support

This is a custom-built site. For questions or issues:
1. Check browser console for errors (F12)
2. Verify all file paths are correct
3. Ensure audio files are in correct format
4. Test email collection integration

---

**Built for 24 | Thank You God Album | 2024**

🔥 Let's get this music heard! 🔥
