---
description: Deploy the application to AWS Amplify
---

This workflow guides you through deploying your Vite application to AWS Amplify Hosting.

# Prerequisites
1. An AWS Account.
2. The code pushed to a Git repository (GitHub, GitLab, AWS CodeCommit, or Bitbucket).

# Steps

1. **Login to AWS Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home).

2. **Create New App**
   - Click "New App" -> "Host Web App" (or "Get Started" under Hosting).
   - Select your Git provider (e.g., GitHub).
   - Authorize AWS Amplify to access your repository.

3. **Configure Build Settings**
   - Select the Repository and Branch (main/master).
   - Amplify should automatically detect the `amplify.yml` file we created.
   - Ensure the build settings look like this:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

4. **Add Environment Variables (Optional)**
   - If you are using Firebase, you need to add your Firebase config environment variables here usually, BUT your current code expects them to be entered in the UI (`CloudConfigModal`).
   - If later you want to bake them in, add them here.

5. **Deploy**
   - Click "Save and Deploy".
   - Amplify will provision a build environment, clone your repo, install dependencies, build the app, and deploy it to a CDN.

6. **Verify**
   - Once the deployment shows "Succeeded", click the provided URL to view your live app.

# Notes
- **Firebase**: Your app currently uses Firebase. This deployment only hosts the *frontend code* on AWS. The data will still reside in Google Firebase unless you migrate the backend.
