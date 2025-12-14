// Popup script for Microsoft Certificate Validator

document.addEventListener('DOMContentLoaded', () => {
  loadValidationResult();
});

async function loadValidationResult() {
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  
  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (!currentTab || !currentTab.url) {
      showError('Unable to get current tab information');
      return;
    }
    
    const url = new URL(currentTab.url);
    
    // Check if this is a Microsoft domain
    const msDomains = [
      'login.microsoftonline.com',
      'login.live.com',
      'login.windows.net',
      'account.microsoft.com'
    ];
    
    if (!msDomains.includes(url.hostname)) {
      showNotMicrosoftDomain(url.hostname);
      return;
    }
    
    // Request validation result
    chrome.runtime.sendMessage(
      { action: 'getValidationResult' },
      (response) => {
        loadingDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        
        if (response) {
          displayResult(response);
        } else {
          showError('No validation data available');
        }
      }
    );
    
  } catch (error) {
    showError('Error: ' + error.message);
  }
}

function displayResult(result) {
  const resultDiv = document.getElementById('result');
  
  let statusClass = 'status-valid';
  let statusIcon = '[OK]';
  let statusTitle = 'Certificate Valid';
  let statusMessage = 'The certificate is properly signed and secure';
  
  if (!result.valid) {
    statusClass = 'status-invalid';
    statusIcon = '[ERROR]';
    statusTitle = 'Certificate Invalid';
    statusMessage = result.reason || 'Certificate validation failed';
  } else if (result.warning) {
    statusClass = 'status-warning';
    statusIcon = '[WARN]';
    statusTitle = 'Certificate Warning';
    statusMessage = result.reason || 'Minor security issue detected';
  }
  
  let html = '';
  
  // Status card
  html += '<div class="status-card">';
  html += '  <div class="status-header">';
  html += '    <div class="status-icon">' + statusIcon + '</div>';
  html += '    <div class="status-text">';
  html += '      <h2 class="' + statusClass + '">' + statusTitle + '</h2>';
  html += '      <p>' + escapeHtml(result.domain || 'Unknown domain') + '</p>';
  html += '    </div>';
  html += '  </div>';
  html += '  <p style="color: #666; font-size: 13px;">' + escapeHtml(statusMessage) + '</p>';
  html += '</div>';
  
  // Checks list
  if (result.checks && result.checks.length > 0) {
    html += '<div class="status-card">';
    html += '  <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Security Checks</h3>';
    html += '  <div class="checks-list">';
    
    result.checks.forEach(check => {
      const checkIcon = check.passed ? 'OK' : 'FAIL';
      const checkClass = check.passed ? 'status-valid' : 'status-invalid';
      
      html += '    <div class="check-item">';
      html += '      <span class="check-icon ' + checkClass + '" style="font-size: 10px; font-weight: bold;">' + checkIcon + '</span>';
      html += '      <span class="check-name">' + escapeHtml(check.name) + '</span>';
      html += '    </div>';
      if (check.detail) {
        html += '    <div class="check-detail">' + escapeHtml(check.detail) + '</div>';
      }
    });
    
    html += '  </div>';
    html += '</div>';
  }
  
  // Additional info
  if (result.protocol || result.cipher || result.issuer) {
    html += '<div class="status-card">';
    html += '  <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Technical Details</h3>';
    
    if (result.protocol) {
      html += '  <p style="font-size: 12px; margin: 4px 0;"><strong>Protocol:</strong> ' + escapeHtml(result.protocol) + '</p>';
    }
    if (result.cipher) {
      html += '  <p style="font-size: 12px; margin: 4px 0;"><strong>Cipher:</strong> ' + escapeHtml(result.cipher) + '</p>';
    }
    if (result.issuer) {
      html += '  <p style="font-size: 12px; margin: 4px 0;"><strong>Issuer:</strong> ' + escapeHtml(result.issuer) + '</p>';
    }
    
    html += '</div>';
  }
  
  // Info box
  html += '<div class="info-box">';
  html += '  <strong>What this means:</strong><br>';
  html += '  This extension verifies that the TLS certificate used by this Microsoft sign-in page is ';
  html += '  authentic and has not been tampered with. It checks for proper certificate signing, ';
  html += '  modern encryption standards, and potential man-in-the-middle attacks.';
  html += '</div>';
  
  // Timestamp
  if (result.timestamp) {
    const date = new Date(result.timestamp);
    html += '<div class="timestamp">Last checked: ' + date.toLocaleString() + '</div>';
  }
  
  // Refresh button
  html += '<button id="refresh-btn">Refresh Validation</button>';
  
  resultDiv.innerHTML = html;
  
  // Add refresh button handler
  document.getElementById('refresh-btn').addEventListener('click', () => {
    document.getElementById('result').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    setTimeout(loadValidationResult, 500);
  });
}

function showNotMicrosoftDomain(domain) {
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  
  loadingDiv.style.display = 'none';
  resultDiv.style.display = 'block';
  
  resultDiv.innerHTML = `
    <div class="not-ms-domain">
      <div class="icon" style="font-weight: bold; font-size: 24px;">INFO</div>
      <h3 style="margin-bottom: 8px;">Not a Microsoft Sign-In Page</h3>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">
        This extension only validates certificates for Microsoft sign-in domains:
      </p>
      <ul style="text-align: left; margin: 12px 0; padding-left: 40px; font-size: 12px; color: #666;">
        <li>login.microsoftonline.com</li>
        <li>login.live.com</li>
        <li>login.windows.net</li>
        <li>account.microsoft.com</li>
      </ul>
      <p style="font-size: 12px; color: #999; margin-top: 12px;">
        Current domain: ${escapeHtml(domain)}
      </p>
    </div>
  `;
}

function showError(message) {
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  
  loadingDiv.style.display = 'none';
  resultDiv.style.display = 'block';
  
  resultDiv.innerHTML = `
    <div class="status-card">
      <div class="status-header">
        <div class="status-icon" style="font-weight: bold;">[!]</div>
        <div class="status-text">
          <h2 class="status-warning">Error</h2>
          <p>Unable to validate certificate</p>
        </div>
      </div>
      <p style="color: #666; font-size: 13px; margin-top: 12px;">${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
