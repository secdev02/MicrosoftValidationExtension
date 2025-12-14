# Quick Installation Guide

## Install in 3 Steps

### Step 1: Download the Extension
Download the entire `microsoft-cert-validator` folder to your computer.

**Optional - Verify Installation:**
Before loading the extension, you can verify all files are present:
```bash
cd microsoft-cert-validator
python3 verify.py
```

This will check that all required files are present and valid.

### Step 2: Open Chrome Extensions
1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. Toggle "Developer mode" ON (top-right corner)

### Step 3: Load the Extension
1. Click "Load unpacked" button
2. Navigate to and select the `microsoft-cert-validator` folder
3. Click "Select Folder"

## You're Done!

The extension is now installed. Visit any Microsoft sign-in page to see it in action:
- Try: https://login.microsoftonline.com
- Try: https://login.live.com

## How to Use

### Automatic Protection
The extension automatically validates certificates when you visit Microsoft sign-in pages. Look for:
- Green success notification (top-right corner) = Certificate is valid
- Orange warning banner (top) = Minor security concern
- Red warning banner (top) = Critical security issue

### Manual Check
Click the extension icon in your Chrome toolbar to see detailed certificate information for the current page.

## Normal Behavior

You may see a brief "DevTools was disconnected" message - this is normal and expected. The extension needs to use Chrome's debugging tools to read certificate information.

## What Gets Checked

Every time you visit a Microsoft sign-in page, the extension validates:
- Certificate is properly signed
- Using modern TLS encryption (1.2 or higher)
- Certificate matches the domain
- No weak or deprecated cryptography
- No mixed content issues
- No signs of interception or tampering

## Privacy

This extension:
- Only works on Microsoft authentication pages
- Never collects or transmits data
- Never accesses passwords or credentials
- All validation happens locally in your browser

## When to Pay Attention

**Green Success**: Everything is good - you're connecting securely to Microsoft

**Orange Warning**: Minor concern detected (e.g., in a corporate network with SSL inspection). Review the details to understand what's happening.

**Red Critical**: Serious security issue detected - DO NOT enter credentials until you understand why. This could indicate:
- Man-in-the-middle attack
- Reverse proxy interception
- Certificate spoofing attempt
- Compromised network

## Need Help?

### Common Issues

**Error: "Could not load icon" or "Could not load manifest"**
- See TROUBLESHOOTING.md for detailed solutions
- Run `python3 verify.py` to check for file issues
- Make sure all files extracted properly from the download

**Extension not appearing after install:**
- Check that Developer mode is enabled
- Try refreshing the extensions page
- Look for error messages in red text

For detailed troubleshooting steps, see the TROUBLESHOOTING.md file included with the extension.

### Full Documentation

See the full README.md for:
- Detailed troubleshooting
- Technical documentation
- How to customize the extension
- Understanding validation results

---

**Remember**: This extension is a security verification tool. It helps you confirm you're connecting to legitimate Microsoft servers, not an attacker or intercepted connection.
