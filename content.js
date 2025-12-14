// Content script for Microsoft Certificate Validator

(function() {
  'use strict';
  
  let validationResult = null;
  let warningBanner = null;
  
  // Listen for validation results from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'validationResult') {
      validationResult = message.result;
      displayValidationStatus(message.result);
    }
  });
  
  // Request validation on page load
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'validateCurrentTab' }, (response) => {
      if (response) {
        validationResult = response;
        displayValidationStatus(response);
      }
    });
  }, 1000);
  
  function displayValidationStatus(result) {
    // Remove existing banner
    if (warningBanner) {
      warningBanner.remove();
      warningBanner = null;
    }
    
    // Only show banner if there's an issue
    if (!result.valid || result.warning) {
      createWarningBanner(result);
    } else {
      // Show success indicator briefly
      createSuccessBanner(result);
    }
  }
  
  function createWarningBanner(result) {
    const banner = document.createElement('div');
    banner.id = 'ms-cert-validator-banner';
    
    const isError = result.critical || !result.valid;
    const bgColor = isError ? '#dc3545' : '#ff9800';
    const icon = isError ? '!' : '!';
    
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: ${bgColor};
      color: white;
      padding: 15px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = 'flex: 1; display: flex; align-items: center;';
    
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.cssText = 'font-size: 20px; margin-right: 12px;';
    
    const textDiv = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = isError ? 'SECURITY WARNING: ' : 'Security Notice: ';
    
    const message = document.createElement('span');
    message.textContent = result.reason || 'Certificate validation issue detected';
    
    textDiv.appendChild(title);
    textDiv.appendChild(message);
    
    const detailsButton = document.createElement('button');
    detailsButton.textContent = 'View Details';
    detailsButton.style.cssText = `
      background: white;
      color: ${bgColor};
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 15px;
      font-size: 13px;
    `;
    detailsButton.onclick = showDetailsModal;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: transparent;
      color: white;
      border: none;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      margin-left: 15px;
      line-height: 1;
      width: 30px;
      height: 30px;
    `;
    closeButton.onclick = () => banner.remove();
    
    content.appendChild(iconSpan);
    content.appendChild(textDiv);
    
    banner.appendChild(content);
    banner.appendChild(detailsButton);
    banner.appendChild(closeButton);
    
    document.body.insertBefore(banner, document.body.firstChild);
    warningBanner = banner;
    
    // Adjust page content to avoid overlap
    document.body.style.paddingTop = '60px';
  }
  
  function createSuccessBanner(result) {
    const banner = document.createElement('div');
    banner.id = 'ms-cert-validator-success';
    
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #28a745;
      color: white;
      padding: 12px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      z-index: 2147483647;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      animation: slideIn 0.3s ease-out, fadeOut 0.5s ease-in 2.5s;
      pointer-events: none;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    banner.innerHTML = '<span style="font-size: 16px; margin-right: 8px; font-weight: bold;">OK</span><span>Microsoft certificate validated</span>';
    
    document.body.appendChild(banner);
    
    setTimeout(() => banner.remove(), 3000);
  }
  
  function showDetailsModal() {
    const modal = document.createElement('div');
    modal.id = 'ms-cert-validator-modal';
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 2147483648;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    let html = '<h2 style="margin-top: 0; color: #333;">Certificate Validation Details</h2>';
    html += '<div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 4px;">';
    html += '<strong>Domain:</strong> ' + escapeHtml(validationResult.domain) + '<br>';
    html += '<strong>Status:</strong> <span style="color: ' + (validationResult.valid ? '#28a745' : '#dc3545') + ';">';
    html += validationResult.valid ? 'Valid' : 'Invalid';
    html += '</span></div>';
    
    if (validationResult.checks && validationResult.checks.length > 0) {
      html += '<h3 style="color: #555; font-size: 16px;">Security Checks:</h3>';
      html += '<table style="width: 100%; border-collapse: collapse;">';
      
      validationResult.checks.forEach(check => {
        const statusColor = check.passed ? '#28a745' : '#dc3545';
        const statusIcon = check.passed ? 'PASS' : 'FAIL';
        
        html += '<tr style="border-bottom: 1px solid #e9ecef;">';
        html += '<td style="padding: 10px 5px; font-weight: 500;">' + escapeHtml(check.name) + '</td>';
        html += '<td style="padding: 10px 5px; text-align: center; color: ' + statusColor + '; font-size: 11px; font-weight: 600;">' + statusIcon + '</td>';
        html += '<td style="padding: 10px 5px; color: #666; font-size: 13px;">' + escapeHtml(check.detail) + '</td>';
        html += '</tr>';
      });
      
      html += '</table>';
    }
    
    if (validationResult.reason) {
      html += '<div style="margin-top: 20px; padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">';
      html += '<strong>Details:</strong> ' + escapeHtml(validationResult.reason);
      html += '</div>';
    }
    
    html += '<button id="ms-cert-close-modal" style="margin-top: 20px; padding: 10px 24px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">Close</button>';
    
    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    document.getElementById('ms-cert-close-modal').onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
})();
