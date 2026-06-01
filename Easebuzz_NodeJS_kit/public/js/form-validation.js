/**
 * Easebuzz Form Validation - Client-side
 * Live validation on keystroke + submit validation
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // Reset auto-fill toggle to OFF on page load
    const autoFillToggle = document.getElementById('autoFillToggle');
    if (autoFillToggle) {
      autoFillToggle.checked = false;
    }

    // Live validation for fields with pattern attribute
    const patternFields = document.querySelectorAll('input[pattern]');
    patternFields.forEach(function (field) {
      field.addEventListener('input', function () {
        validatePatternField(field);
      });
    });

    // Live amount validation
    const amountFields = document.querySelectorAll('input[name="amount"], input[name="refund_amount"]');
    amountFields.forEach(function (field) {
      field.addEventListener('input', function () {
        validateAmountField(field);
      });
    });

    // Form submit validation
    const forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        const isValid = validateForm(form);
        if (!isValid) {
          e.preventDefault();
        }
      });
    });
  });

  function validatePatternField(field) {
    const pattern = field.getAttribute('pattern');
    if (!pattern) return true;

    const value = field.value;
    if (value === '') {
      clearError(field);
      return true;
    }

    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      showError(field, field.getAttribute('title') || 'Invalid format');
      return false;
    } else {
      clearError(field);
      return true;
    }
  }

  function validateAmountField(field) {
    const value = field.value;
    if (value === '') {
      clearError(field);
      return true;
    }

    // Must contain only numbers and one decimal point
    if (!/^[\d.]+$/.test(value)) {
      showError(field, 'Amount must contain only numbers and decimal point');
      return false;
    }

    // Must have decimal point
    if (!value.includes('.')) {
      showError(field, 'Amount must contain a decimal point');
      return false;
    }

    // Max 2 decimal places
    const parts = value.split('.');
    if (parts.length > 2) {
      showError(field, 'Invalid amount format');
      return false;
    }
    if (parts[1] && parts[1].length > 2) {
      showError(field, 'Amount supports up to 2 decimal places only');
      return false;
    }

    const amt = parseFloat(value);
    if (isNaN(amt)) {
      showError(field, 'Invalid amount');
      return false;
    }

    // Must be >= 1
    if (amt < 1) {
      showError(field, 'Amount must be Greater or Equal to 1');
      return false;
    }

    clearError(field);
    return true;
  }

  function validateForm(form) {
    let isValid = true;
    const missingFields = [];

    // Check required fields
    const requiredFields = form.querySelectorAll('input[required], select[required]');
    requiredFields.forEach(function (field) {
      if (field.disabled) return;
      if (!field.value.trim()) {
        isValid = false;
        highlightField(field);
        const label = field.closest('.form-field')?.querySelector('label')?.textContent?.replace('*', '').trim();
        missingFields.push(label || field.name);
      }
    });

    // Check patterns
    const patternFields = form.querySelectorAll('input[pattern]');
    patternFields.forEach(function (field) {
      if (field.disabled || !field.value) return;
      if (!validatePatternField(field)) {
        isValid = false;
      }
    });

    // Check amount fields
    const amountFields = form.querySelectorAll('input[name="amount"], input[name="refund_amount"]');
    amountFields.forEach(function (field) {
      if (field.disabled || !field.value) return;
      if (!validateAmountField(field)) {
        isValid = false;
      }
    });

    if (missingFields.length > 0) {
      alert('Please fill in the following required fields:\n\n• ' + missingFields.join('\n• '));
    }

    return isValid;
  }

  function showError(field, message) {
    field.style.borderColor = '#ff0000';
    field.style.backgroundColor = '#ffebee';

    let errorSpan = field.parentElement.querySelector('.field-error-msg');
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'field-error-msg';
      field.parentElement.appendChild(errorSpan);
    }
    errorSpan.textContent = message;
  }

  function clearError(field) {
    field.style.borderColor = '';
    field.style.backgroundColor = '';

    const errorSpan = field.parentElement.querySelector('.field-error-msg');
    if (errorSpan) {
      errorSpan.remove();
    }
  }

  function highlightField(field) {
    field.style.borderColor = '#ff0000';
    field.style.backgroundColor = '#ffebee';
  }
})();
