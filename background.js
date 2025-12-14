// Microsoft Certificate Validator - Background Service Worker

// Known Microsoft certificate details
const MICROSOFT_CERT_FINGERPRINTS = {
  // Microsoft IT TLS CA 1, 2, 4, 5
  // DigiCert Global Root G2
  // Baltimore CyberTrust Root
  // These are common root/intermediate CAs used by Microsoft
  rootCAs: [
    'DF:3C:24:F9:BF:D6:66:76:1B:26:80:73:FE:06:D1:CC:8D:4F:82:A4',
    'A8:98:5D:3A:65:E5:E5:C4:B2:D7:D6:6D:40:C6:DD:2F:B1:9C:54:36',
    '16:AF:57:A9:F6:76:B0:AB:12:60:95:AA:5E:BA:DE:F2:2A:B3:11:19'
  ]
};

const MICROSOFT_DOMAINS = [
  'login.microsoftonline.com',
  'login.live.com',
  'login.windows.net',
  'account.microsoft.com'
];

// Store validation results
const validationCache = new Map();

// Listen for security info requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSecurityInfo') {
    getTabSecurityInfo(sender.tab.id)
      .then(info => sendResponse({ success: true, data: info }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'validateCurrentTab') {
    validateTab(sender.tab.id)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ valid: false, error: error.message }));
    return true;
  }
});

// Monitor navigation to Microsoft sign-in pages
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    const url = new URL(details.url);
    if (MICROSOFT_DOMAINS.includes(url.hostname)) {
      // Wait a bit for the page to load
      setTimeout(() => {
        validateTab(details.tabId).then(result => {
          // Store result and notify content script
          validationCache.set(details.tabId, result);
          chrome.tabs.sendMessage(details.tabId, {
            action: 'validationResult',
            result: result
          }).catch(() => {
            // Content script might not be ready yet
          });
        });
      }, 500);
    }
  }
});

// Clean up cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  validationCache.delete(tabId);
});

async function validateTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    
    // Check if this is a Microsoft domain
    if (!MICROSOFT_DOMAINS.includes(url.hostname)) {
      return {
        valid: false,
        reason: 'Not a Microsoft sign-in domain',
        domain: url.hostname
      };
    }
    
    // Check protocol
    if (url.protocol !== 'https:') {
      return {
        valid: false,
        reason: 'Not using HTTPS',
        domain: url.hostname,
        critical: true
      };
    }
    
    // Get security info using debugger API
    const securityInfo = await getTabSecurityInfo(tabId);
    
    return validateSecurityInfo(securityInfo, url.hostname);
    
  } catch (error) {
    return {
      valid: false,
      reason: 'Error during validation: ' + error.message,
      error: error.message
    };
  }
}

async function getTabSecurityInfo(tabId) {
  return new Promise((resolve, reject) => {
    // Attach debugger to get security information
    chrome.debugger.attach({ tabId: tabId }, '1.3', async () => {
      if (chrome.runtime.lastError) {
        reject(new Error('Cannot attach debugger: ' + chrome.runtime.lastError.message));
        return;
      }
      
      try {
        // Get security state
        const result = await chrome.debugger.sendCommand(
          { tabId: tabId },
          'Security.enable'
        );
        
        // Get certificate info
        const securityState = await chrome.debugger.sendCommand(
          { tabId: tabId },
          'Security.getSecurityState'
        );
        
        chrome.debugger.detach({ tabId: tabId });
        resolve(securityState);
        
      } catch (error) {
        chrome.debugger.detach({ tabId: tabId });
        reject(error);
      }
    });
  });
}

function validateSecurityInfo(securityInfo, hostname) {
  const result = {
    valid: false,
    domain: hostname,
    timestamp: new Date().toISOString(),
    checks: []
  };
  
  // Check security state
  if (!securityInfo || securityInfo.securityState !== 'secure') {
    result.reason = 'Connection is not secure';
    result.critical = true;
    result.checks.push({
      name: 'TLS Security',
      passed: false,
      detail: 'Connection is not marked as secure'
    });
    return result;
  }
  
  result.checks.push({
    name: 'TLS Security',
    passed: true,
    detail: 'Connection is secure'
  });
  
  // Check for certificate errors
  if (securityInfo.certificateSecurityState) {
    const certState = securityInfo.certificateSecurityState;
    
    // Check for certificate errors
    if (certState.certificateNetworkError) {
      result.reason = 'Certificate network error detected';
      result.critical = true;
      result.checks.push({
        name: 'Certificate Validity',
        passed: false,
        detail: 'Network error: ' + certState.certificateNetworkError
      });
      return result;
    }
    
    // Check certificate validity
    if (certState.certificateHasWeakSignature) {
      result.reason = 'Weak certificate signature detected';
      result.warning = true;
      result.checks.push({
        name: 'Certificate Strength',
        passed: false,
        detail: 'Weak signature algorithm'
      });
    } else {
      result.checks.push({
        name: 'Certificate Strength',
        passed: true,
        detail: 'Strong signature algorithm'
      });
    }
    
    // Check for SHA-1
    if (certState.certificateHasSha1Signature) {
      result.reason = 'Certificate uses deprecated SHA-1';
      result.warning = true;
      result.checks.push({
        name: 'Modern Cryptography',
        passed: false,
        detail: 'Uses deprecated SHA-1'
      });
    } else {
      result.checks.push({
        name: 'Modern Cryptography',
        passed: true,
        detail: 'Uses modern hash algorithm'
      });
    }
    
    // Check subject name
    if (certState.subjectName && !certState.subjectName.includes(hostname)) {
      result.reason = 'Certificate subject name mismatch';
      result.critical = true;
      result.checks.push({
        name: 'Certificate Name Match',
        passed: false,
        detail: 'Expected: ' + hostname + ', Got: ' + certState.subjectName
      });
      return result;
    }
    
    result.checks.push({
      name: 'Certificate Name Match',
      passed: true,
      detail: 'Certificate matches domain'
    });
    
    // Check issuer
    if (certState.issuer) {
      result.issuer = certState.issuer;
      result.checks.push({
        name: 'Certificate Issuer',
        passed: true,
        detail: certState.issuer
      });
    }
    
    // Check protocol version
    if (certState.protocol) {
      result.protocol = certState.protocol;
      const isTLS12OrHigher = certState.protocol === 'TLS 1.2' || 
                              certState.protocol === 'TLS 1.3';
      
      result.checks.push({
        name: 'Protocol Version',
        passed: isTLS12OrHigher,
        detail: certState.protocol
      });
      
      if (!isTLS12OrHigher) {
        result.reason = 'Using outdated TLS version';
        result.warning = true;
      }
    }
    
    // Check cipher suite
    if (certState.cipher) {
      result.cipher = certState.cipher;
      result.checks.push({
        name: 'Cipher Suite',
        passed: true,
        detail: certState.cipher
      });
    }
  }
  
  // Check for mixed content
  if (securityInfo.securityStateIssueIds && securityInfo.securityStateIssueIds.length > 0) {
    const hasMixedContent = securityInfo.securityStateIssueIds.some(id => 
      id.includes('mixed-content') || id.includes('insecure')
    );
    
    if (hasMixedContent) {
      result.reason = 'Mixed content detected';
      result.warning = true;
      result.checks.push({
        name: 'Content Security',
        passed: false,
        detail: 'Page contains mixed/insecure content'
      });
    }
  }
  
  // If no critical issues found, mark as valid
  const hasCriticalIssue = result.checks.some(check => 
    !check.passed && (result.critical || result.reason)
  );
  
  if (!hasCriticalIssue) {
    result.valid = true;
    result.reason = 'All security checks passed';
  }
  
  return result;
}

// Export validation result for popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getValidationResult') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const cached = validationCache.get(tabs[0].id);
        if (cached) {
          sendResponse(cached);
        } else {
          validateTab(tabs[0].id).then(result => {
            validationCache.set(tabs[0].id, result);
            sendResponse(result);
          });
        }
      }
    });
    return true;
  }
});
