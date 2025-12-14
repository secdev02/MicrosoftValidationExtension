# Troubleshooting - Icon Loading Errors

## Error: "Could not load icon 'icons/icon16.png'"

This error typically occurs when Chrome cannot find or read the icon files. Here's how to fix it:

### Solution 1: Verify Files Are Present

1. Open the extension folder
2. Check that the `icons` folder exists
3. Verify these files are inside the `icons` folder:
   - icon16.png
   - icon48.png
   - icon128.png

### Solution 2: Run the Verification Script

Open a terminal/command prompt in the extension folder and run:

```bash
python3 verify.py
```

This will check all files and report any issues.

### Solution 3: Re-download or Re-extract

If you're extracting from a ZIP file:
1. Make sure you're extracting ALL files, not just viewing them
2. Extract to a location where you have full read/write permissions
3. Avoid extracting to system folders (like Program Files or C:\Windows)

### Solution 4: Check File Permissions

On Linux/Mac:
```bash
chmod -R 755 microsoft-cert-validator/
```

On Windows:
- Right-click the folder → Properties → Security
- Ensure your user account has "Read" permissions

### Solution 5: Try a Different Location

Sometimes Chrome has issues with certain folder locations:
- Move the extension to your Desktop or Documents folder
- Avoid network drives or cloud-synced folders (OneDrive, Dropbox, etc.)
- Don't use folders with special characters or very long paths

### Solution 6: Manually Verify Icon Files

Check that the icon files are valid:

**On Windows:**
- Try opening each icon file in Photos or Paint
- If they don't open, they may be corrupted

**On Mac:**
- Try opening each icon file in Preview
- If they don't open, they may be corrupted

**On Linux:**
```bash
file icons/*.png
```

Should show: "PNG image data" for each file

### Solution 7: Reload the Extension

If you've made changes:
1. Go to `chrome://extensions/`
2. Find "Microsoft Sign-In Certificate Validator"
3. Click the refresh icon ⟳
4. If that doesn't work, click "Remove" and load it again

## Error: "Could not load manifest"

This means the manifest.json file has a problem:

### Check JSON Syntax
Run this command in the extension folder:
```bash
python3 -m json.tool manifest.json
```

If it shows an error, the JSON is malformed.

### Common Manifest Issues:
- Extra commas at the end of lists
- Missing quotes around strings
- Incorrect file paths

## Still Having Issues?

1. Make sure you're using Chrome version 88 or higher
2. Try restarting Chrome completely
3. Disable other extensions temporarily to rule out conflicts
4. Check Chrome's console for detailed error messages:
   - Open Chrome
   - Press F12 to open DevTools
   - Go to the Console tab
   - Try loading the extension again
   - Look for error messages in red

## Getting More Help

If none of these solutions work:

1. Run the verification script and save the output
2. Check the exact error message in chrome://extensions/
3. Note your operating system and Chrome version
4. Check if antivirus software might be blocking the files

The verification script output will help diagnose the specific issue with your installation.
