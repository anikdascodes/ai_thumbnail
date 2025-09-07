# Deployment Guide for AI Thumbnail Generator

## Vercel Deployment Setup

### 1. Environment Variables

Your application requires the following environment variables to be set in Vercel:

#### Required Variables:
- `GOOGLE_API_KEY`: Your Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 2. Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your deployed project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_API_KEY` | Your Google AI API key | Production, Preview, Development |

### 3. Getting Your Google AI API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Paste it into your Vercel environment variables

### 4. Deployment Configuration

The project includes a `vercel.json` configuration file that:
- Sets appropriate function timeouts for AI operations (30 seconds)
- Configures the deployment region
- Sets up environment variable references

### 5. Build Verification

The Next.js configuration is already optimized for deployment with:
- TypeScript build errors ignored for deployment
- ESLint errors ignored during builds
- Image optimization configured for external domains

### 6. Post-Deployment Checklist

After deploying, verify:
- [ ] Environment variables are set correctly
- [ ] AI thumbnail generation works
- [ ] Prompt optimization works  
- [ ] Image uploads and processing work
- [ ] No console errors in production

### 7. Local Development Setup

For local development, create a `.env.local` file:

```bash
# .env.local
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### 8. Troubleshooting

**Common Issues:**

1. **"API Key not found" errors**
   - Verify the `GOOGLE_API_KEY` environment variable is set in Vercel
   - Check that the API key is valid and active

2. **Timeout errors during image generation**
   - The function timeout is set to 30 seconds in `vercel.json`
   - Consider upgrading to Vercel Pro for longer timeouts if needed

3. **Build failures**
   - TypeScript and ESLint errors are ignored during build
   - Check the build logs in Vercel dashboard for other issues

4. **Image loading issues**
   - Verify your generated images are being served correctly
   - Check browser network tab for any blocked requests

### 9. Performance Optimization

For better performance:
- Consider enabling Vercel's Edge Runtime for faster cold starts
- Use Vercel Analytics to monitor performance
- Enable image optimization features

## Support

If you encounter any issues, check:
1. Vercel deployment logs
2. Browser developer console
3. Google AI Studio status page
4. Vercel status page

