# Microsoft Certificate Validator - Chrome Extension

A Chrome extension that validates Microsoft sign-in pages are using legitimate TLS certificates signed by Microsoft's certificate authorities and haven't been tampered with through reverse proxies or man-in-the-middle attacks.

## What It Does

This extension provides strong assurance that when you visit Microsoft authentication pages, you're connecting to the legitimate Microsoft servers with properly validated certificates. It:

- Validates TLS certificates are properly signed
- Checks for certificate chain integrity
- Verifies modern encryption standards (TLS 1.2+)
- Detects weak or deprecated cryptography
- Identifies certificate name mismatches
- Warns about potential man-in-the-middle attacks
- Monitors for mixed content issues

## Protected Domains

The extension monitors these Microsoft authentication domains:
- `login.microsoftonline.com` (Azure AD / Microsoft 365)
- `login.live.com` (Microsoft Account)
- `login.windows.net` (Legacy Azure)
- `account.microsoft.com` (Microsoft Account Management)

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Download the Extension**
   - Download all files from the `microsoft-cert-validator` folder
   - Keep the folder structure intact

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `microsoft-cert-validator` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Microsoft Certificate Validator"
   - Click the pin icon to keep it visible

### Method 2: Package and Install

```bash
# Navigate to the extension directory
cd microsoft-cert-validator

# Package the extension (creates a .crx file)
# This requires Chrome to be installed
chrome --pack-extension=.
```

Then drag the `.crx` file into `chrome://extensions/`

## How to Use

### Automatic Validation

The extension works automatically when you visit Microsoft sign-in pages:

1. **Navigate** to any Microsoft login page (e.g., signing into Office 365)
2. **Look for** the validation indicator:
   - **Green notification** (top-right): Certificate is valid and secure
   - **Orange banner** (top): Security warning detected
   - **Red banner** (top): Critical security issue detected

3. **Click "View Details"** on warning banners to see:
   - Specific security checks performed
   - Technical certificate details
   - Reasons for warnings or failures

### Manual Check via Popup

1. **Click** the extension icon in Chrome's toolbar
2. **View** the detailed validation report:
   - Overall security status
   - Individual security checks
   - TLS protocol version
   - Cipher suite information
   - Certificate issuer
3. **Click "Refresh Validation"** to re-check the current page

## What Gets Validated

### Security Checks Performed

1. **HTTPS Enforcement**
   - Ensures the connection uses HTTPS protocol
   - Critical failure if HTTP is used

2. **Certificate Validity**
   - Verifies the certificate chain is valid
   - Checks for proper certificate signing
   - Validates certificate hasn't expired

3. **Certificate Name Matching**
   - Confirms the certificate matches the domain
   - Detects potential spoofing attempts

4. **Modern Cryptography**
   - Ensures TLS 1.2 or higher is used
   - Checks for deprecated SHA-1 signatures
   - Validates strong cipher suites

5. **Certificate Strength**
   - Detects weak signature algorithms
   - Warns about outdated cryptographic methods

6. **Content Security**
   - Checks for mixed HTTP/HTTPS content
   - Validates secure resource loading

### Technical Details Shown

- **Protocol Version**: TLS 1.2, TLS 1.3, etc.
- **Cipher Suite**: Encryption algorithm in use
- **Certificate Issuer**: CA that signed the certificate
- **Validation Timestamp**: When the check was performed

## Important Limitations

### Chrome Debugger API Requirement

This extension uses Chrome's Debugger API to access detailed certificate information. This means:

1. **Performance Impact**: The debugger briefly attaches to tabs for validation
2. **Console Warning**: You may see "DevTools was disconnected" messages
3. **Not for Production Use**: This is a security research/verification tool

### Privacy Note

- The extension only activates on Microsoft authentication domains
- No data is sent to external servers
- All validation happens locally in your browser
- No browsing history or credentials are collected

## Security Features

### Protection Against Common Attacks

1. **Man-in-the-Middle Detection**
   - Validates the entire certificate chain
   - Checks for certificate pinning violations
   - Detects proxy certificate injection

2. **Reverse Proxy Detection**
   - Verifies certificate matches expected domain
   - Checks for certificate transparency violations
   - Identifies suspicious certificate issuers

3. **Downgrade Attack Prevention**
   - Enforces TLS 1.2 minimum
   - Rejects weak cipher suites
   - Warns about deprecated protocols

## Troubleshooting

### Extension Not Working

**Problem**: No validation appears when visiting Microsoft sign-in pages

**Solutions**:
- Ensure the extension is enabled in `chrome://extensions/`
- Check that Developer Mode is enabled
- Reload the extension by clicking the refresh icon
- Check browser console for errors (F12 → Console tab)

### "DevTools was disconnected" Warning

**This is normal** - The extension uses Chrome's Debugger API to read certificate information. This briefly attaches DevTools and may show a disconnection message. It's harmless and expected.

### False Warnings

**Problem**: Extension shows warnings on legitimate Microsoft pages

**Possible Causes**:
- Corporate proxy intercepting HTTPS (common in enterprise networks)
- Antivirus software with SSL/TLS inspection
- VPN with certificate inspection
- Network security appliance

**Action**: Verify your network setup. In corporate environments, IT may intentionally intercept SSL for security scanning.

### Extension Permissions

**Problem**: Concerned about permissions requested

**Explanation**:
- `webRequest`: Monitor navigation to Microsoft domains
- `webNavigation`: Detect when authentication pages load
- `debugger`: Access detailed certificate information (read-only)
- `tabs`: Identify current active tab
- `storage`: Cache validation results

All permissions are used solely for certificate validation.

## Development

### File Structure

```
microsoft-cert-validator/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for certificate validation
├── content.js            # In-page warnings and notifications
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

### Modifying Protected Domains

To add additional domains to monitor, edit `manifest.json`:

```json
"host_permissions": [
  "https://login.microsoftonline.com/*",
  "https://your-domain.com/*"
]
```

And update the domain list in `background.js`:

```javascript
const MICROSOFT_DOMAINS = [
  'login.microsoftonline.com',
  'your-domain.com'
];
```

### Adding Custom Validation Rules

Edit the `validateSecurityInfo()` function in `background.js` to add custom checks:

```javascript
// Example: Require specific cipher suite
if (certState.cipher && !certState.cipher.includes('AES_256_GCM')) {
  result.checks.push({
    name: 'Strong Encryption',
    passed: false,
    detail: 'Requires AES-256-GCM cipher'
  });
}
```

## Technical Background

### Why This Extension?

Modern browsers validate TLS certificates, but they don't provide:
1. Detailed visibility into certificate chains
2. Real-time warnings about certificate anomalies
3. Detection of corporate proxy interception
4. Validation that certificates match expected CAs

This extension fills that gap for security-conscious users who need to verify they're connecting to legitimate Microsoft services.

### How It Works

1. **Navigation Detection**: Monitors when you navigate to Microsoft domains
2. **Debugger Attachment**: Briefly attaches Chrome's Debugger to read security state
3. **Certificate Analysis**: Extracts and validates certificate chain details
4. **Validation Rules**: Applies security checks against known-good configurations
5. **User Notification**: Shows results via banner and popup UI

### Limitations of Browser Certificate Validation

Standard browser validation only checks:
- Certificate is trusted by OS/browser certificate store
- Certificate hasn't expired
- Domain name matches

It doesn't easily expose:
- Specific CA that signed the certificate
- TLS protocol version details
- Cipher suite information
- Certificate transparency logs

This extension makes this information visible and actionable.

## Contributing

This is a security research tool. If you find issues or have suggestions:

1. Test thoroughly before suggesting changes
2. Document any new validation rules
3. Consider privacy implications
4. Follow Chrome extension best practices

## License

This extension is provided as-is for security research and verification purposes. Use at your own risk.

## Disclaimer

This extension is not affiliated with, endorsed by, or sponsored by Microsoft Corporation. It's an independent security tool for validating TLS certificates on Microsoft authentication pages.

The extension does not modify, intercept, or store any authentication credentials. It only reads certificate metadata for validation purposes.

## Privacy Policy

- **No data collection**: This extension does not collect any user data
- **No external communication**: All validation happens locally
- **No credential access**: The extension never accesses passwords or tokens
- **Read-only operation**: Only reads certificate information, never modifies anything

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Chrome's console for error messages
3. Ensure you're using the latest version of Chrome
4. Verify the extension has required permissions enabled

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Minimum Chrome Version**: 88+
