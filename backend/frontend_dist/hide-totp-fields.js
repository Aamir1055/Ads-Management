(function() {
  'use strict';

  console.log('🔒 TOTP Field Hider - Loading...');

  /**
   * Hide TOTP-related form fields and elements
   */
  function hideTotpFields() {
    console.log('🔒 Hiding TOTP fields from user interface...');

    // Array of selectors to hide TOTP-related elements
    const totpSelectors = [
      // Input fields by name/id
      'input[name*="totp" i]',
      'input[name*="totp_secret" i]',
      'input[name*="totp-secret" i]',
      'input[id*="totp" i]',
      'input[id*="totp_secret" i]',
      'input[id*="totp-secret" i]',
      
      // Labels for TOTP fields
      'label[for*="totp" i]',
      'label[for*="totp_secret" i]',
      'label[for*="totp-secret" i]',
      
      // Buttons with TOTP-related actions
      'button[data-action*="generate-totp" i]',
      'button[data-action*="generate_totp" i]',
      'input[type="button"][value*="Generate TOTP" i]',
      'input[type="submit"][value*="Generate TOTP" i]',
      
      // Elements with TOTP-related class names
      '.totp-field',
      '.totp-secret-field',
      '.totp_secret_field',
      '.totp-container',
      '.totp_container',
      '.generate-totp',
      '.generate_totp',
      
      // Data attributes
      '[data-field*="totp" i]',
      '[data-field*="totp-secret" i]',
      '[data-field*="totp_secret" i]',
      '[data-name*="totp" i]',
      '[data-name*="totp-secret" i]',
      '[data-name*="totp_secret" i]'
    ];

    let hiddenCount = 0;

    // Hide elements using CSS selectors
    totpSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.setAttribute('hidden', 'true');
          hiddenCount++;
          
          // Also hide parent container if it's a form group
          const parent = element.closest('.form-group, .form-field, .field-container, .input-group, .row, tr');
          if (parent) {
            parent.style.display = 'none';
            parent.style.visibility = 'hidden';
            parent.setAttribute('hidden', 'true');
          }
        });
      } catch (error) {
        console.warn(`⚠️ Error hiding elements for selector "${selector}":`, error);
      }
    });

    // Text-based hiding for elements containing "TOTP Secret" or "Generate TOTP"
    const searchTexts = [
      'TOTP Secret',
      'Generate TOTP',
      'TOTP secret',
      'totp secret',
      'Two-Factor Authentication Secret',
      'Authenticator Secret'
    ];

    searchTexts.forEach(searchText => {
      try {
        // Find all text nodes containing the search text
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent && node.textContent.toLowerCase().includes(searchText.toLowerCase())) {
            textNodes.push(node);
          }
        }

        textNodes.forEach(textNode => {
          let element = textNode.parentElement;
          
          // Find the appropriate container to hide
          let attempts = 0;
          while (element && element.tagName !== 'BODY' && attempts < 10) {
            attempts++;
            
            // If it's a form element, label, button, or div, hide it
            if (['INPUT', 'LABEL', 'BUTTON', 'DIV', 'SPAN', 'TR', 'TD', 'TH', 'P', 'FORM'].includes(element.tagName)) {
              element.style.display = 'none';
              element.style.visibility = 'hidden';
              element.setAttribute('hidden', 'true');
              hiddenCount++;
              
              console.log(`🔒 Hidden element containing text "${searchText}":`, element.tagName, element.className || 'no class');
              break;
            }
            element = element.parentElement;
          }
        });
      } catch (error) {
        console.warn(`⚠️ Error hiding elements by text "${searchText}":`, error);
      }
    });

    // Hide specific buttons by text content
    try {
      const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
      buttons.forEach(button => {
        const text = (button.textContent || button.value || '').toLowerCase();
        if (text.includes('generate totp') || 
            text.includes('generate secret') ||
            text.includes('totp secret')) {
          button.style.display = 'none';
          button.style.visibility = 'hidden';
          button.setAttribute('hidden', 'true');
          hiddenCount++;
          
          // Also hide parent container
          const parent = button.closest('.form-group, .form-field, .field-container, .button-group, .row, tr');
          if (parent) {
            parent.style.display = 'none';
            parent.style.visibility = 'hidden';
            parent.setAttribute('hidden', 'true');
          }
          
          console.log(`🔒 Hidden button with text: "${text}"`);
        }
      });
    } catch (error) {
      console.warn('⚠️ Error hiding buttons by text:', error);
    }

    if (hiddenCount > 0) {
      console.log(`✅ TOTP fields hiding completed - Hidden ${hiddenCount} elements`);
    } else {
      console.log('ℹ️ No TOTP fields found to hide');
    }
  }

  /**
   * Initialize TOTP field hiding
   */
  function initTotpFieldHiding() {
    console.log('🔒 Initializing TOTP field hiding...');

    // Hide fields immediately if DOM is already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideTotpFields);
    } else {
      hideTotpFields();
    }

    // Set up observer to hide fields when new content is added
    const observer = new MutationObserver((mutations) => {
      let shouldHide = false;
      
      mutations.forEach((mutation) => {
        // Check if new nodes were added
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the new node or its children contain TOTP-related content
              try {
                const totpRelated = node.querySelector && (
                  node.querySelector('input[name*="totp" i]') ||
                  node.querySelector('*[class*="totp" i]') ||
                  (node.textContent && (
                    node.textContent.toLowerCase().includes('totp secret') ||
                    node.textContent.toLowerCase().includes('generate totp')
                  ))
                );
                
                if (totpRelated) {
                  shouldHide = true;
                }
              } catch (error) {
                // Ignore selector errors for individual nodes
              }
            }
          });
        }
      });

      // Hide fields if TOTP-related content was detected
      if (shouldHide) {
        console.log('🔒 New TOTP content detected, hiding fields...');
        setTimeout(hideTotpFields, 100); // Small delay to ensure content is rendered
      }
    });

    // Observe the entire document for changes
    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id', 'name']
      });
      
      console.log('✅ TOTP field hiding initialized with mutation observer');
    } catch (error) {
      console.warn('⚠️ Could not initialize mutation observer:', error);
      // Fallback: re-run hiding every 2 seconds
      setInterval(hideTotpFields, 2000);
      console.log('✅ TOTP field hiding initialized with fallback polling');
    }
  }

  // Auto-initialize when script loads
  initTotpFieldHiding();

  // Expose functions globally for manual testing
  if (typeof window !== 'undefined') {
    window.hideTotpFields = hideTotpFields;
    window.initTotpFieldHiding = initTotpFieldHiding;
  }

  console.log('✅ TOTP Field Hider - Loaded successfully');
})();
