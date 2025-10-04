/**
 * JoyFix - Orçamento Calculator Component
 * Componentized calculator with fixed logic and improved UI
 * @version 2.0
 */

(function () {
  'use strict';

  // State management
  const STATE = {
    initialized: false,
    total: 0,
    baseLabor: 60, // Default labor cost
    laborPS5: 70,  // PS5 labor cost
    controllers: [],
    prices: {
      analogicoOriginal: 20,
      analogicoMagnetico: 35,
      membranaBotoes: 25,
      bateria: 40,
    },
  };

  // Utility functions
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function formatBRL(value) {
    return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
  }

  function sanitizeNumber(value, min = 0) {
    const num = parseInt(value, 10);
    return Number.isFinite(num) ? Math.max(min, num) : min;
  }

  // Controller management
  let isAddingController = false; // Prevent multiple simultaneous adds
  
  function setupQuantityButtons() {
    // Remove old listeners and set up new ones for all buttons
    $$('.number-btn').forEach((button) => {
      // Clone to remove old listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleQuantityButton(newButton);
      });
    });
  }
  
  function addController() {
    // Prevent adding multiple controllers at once
    if (isAddingController) return;
    isAddingController = true;
    
    const container = $('#controllers-container');
    const template = $('#controller-template');
    if (!container || !template) {
      isAddingController = false;
      return;
    }

    const newController = template.firstElementChild.cloneNode(true);
    newController.classList.remove('hidden');
    container.insertBefore(newController, template);
    setupRemoveButton(newController);
    
    // Add animation
    newController.style.opacity = '0';
    newController.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      newController.style.transition = 'all 0.3s ease';
      newController.style.opacity = '1';
      newController.style.transform = 'translateY(0)';
      
      // Re-enable adding after animation completes
      setTimeout(() => {
        isAddingController = false;
      }, 300);
    }, 10);
  }

  function setupRemoveButton(controllerElement) {
    const removeBtn = controllerElement.querySelector('.remove-controller');
    if (!removeBtn) return;

    // Clone to remove old listeners
    const newBtn = removeBtn.cloneNode(true);
    removeBtn.parentNode.replaceChild(newBtn, removeBtn);

    newBtn.addEventListener('click', function () {
      const allControllers = $$('.controller-item:not(.hidden)');
      if (allControllers.length > 1) {
        // Animate removal
        controllerElement.style.transition = 'all 0.3s ease';
        controllerElement.style.opacity = '0';
        controllerElement.style.transform = 'translateX(-20px)';
        setTimeout(() => controllerElement.remove(), 300);
      } else {
        // Reset the last controller
        const select = controllerElement.querySelector('select');
        if (select) select.selectedIndex = 0;
      }
    });
  }

  // Parts quantity management
  function syncCheckboxToQuantity(checkbox) {
    const id = checkbox.id;
    if (!id) return;

    const qtyInput = $(`input[data-target="${id}"]`);
    if (!qtyInput) return;

    if (checkbox.checked) {
      const current = sanitizeNumber(qtyInput.value, 0);
      qtyInput.value = Math.max(1, current);
    } else {
      qtyInput.value = 0;
    }
  }

  function syncQuantityToCheckbox(input) {
    const targetId = input.getAttribute('data-target');
    if (!targetId) return;

    const checkbox = $(`#${targetId}`);
    if (!checkbox) return;

    const value = sanitizeNumber(input.value, 0);
    checkbox.checked = value > 0;
  }

  function handleQuantityButton(button) {
    const action = button.getAttribute('data-action');
    const targetId = button.getAttribute('data-target');
    const input = $(`input[data-target="${targetId}"]`);
    
    if (!input) return;

    let value = sanitizeNumber(input.value, 0);

    if (action === 'increment') {
      value++;
    } else if (action === 'decrement' && value > 0) {
      value--;
    }

    input.value = value;
    syncQuantityToCheckbox(input);
    calculateTotal();
  }

  // Check if any PS5 controller is selected
  function hasPS5Controller() {
    return $$('select[name="modelo[]"]').some(select => select.value === 'PS5');
  }

  // Get current labor cost based on controller selection
  function getCurrentLaborCost() {
    return hasPS5Controller() ? STATE.laborPS5 : STATE.baseLabor;
  }

  // Update labor display
  function updateLaborDisplay() {
    const laborElement = $('.text-gray-700.dark\\:text-gray-300.font-semibold');
    const laborPriceElement = laborElement ? laborElement.parentElement.querySelector('.font-bold.text-xl') : null;
    
    if (laborPriceElement) {
      const currentLabor = getCurrentLaborCost();
      laborPriceElement.textContent = formatBRL(currentLabor);
    }
  }

  // Total calculation
  function calculateTotal() {
    const totalElement = $('#total-orcamento');
    if (!totalElement) return;

    let total = getCurrentLaborCost(); // Use dynamic labor cost

    // Calculate parts total
    Object.keys(STATE.prices).forEach((partId) => {
      const checkbox = $(`#${partId}`);
      if (!checkbox || !checkbox.checked) return;

      const qtyInput = $(`input[data-target="${partId}"]`);
      const quantity = qtyInput ? sanitizeNumber(qtyInput.value, 1) : 1;
      
      // Ensure at least 1 if checked
      const finalQty = Math.max(1, quantity);
      total += STATE.prices[partId] * finalQty;
    });

    STATE.total = total;
    totalElement.textContent = formatBRL(total);

    // Add pulse animation on change
    totalElement.classList.add('pulse-animation');
    setTimeout(() => totalElement.classList.remove('pulse-animation'), 300);
  }

  // WhatsApp message builder
  function buildWhatsAppMessage() {
    const lines = ['*Orçamento para Conserto de Controle*', ''];

    // Controllers
    const selectedControllers = $$('select[name="modelo[]"]')
      .filter(select => select.value !== '')
      .map(select => select.options[select.selectedIndex].text);

    if (selectedControllers.length > 0) {
      lines.push(`*Controles (${selectedControllers.length}):*`);
      selectedControllers.forEach((controller, index) => {
        lines.push(`${index + 1}. ${controller}`);
      });
      lines.push('');
    }

    // Parts
    const selectedParts = [];
    Object.keys(STATE.prices).forEach((partId) => {
      const checkbox = $(`#${partId}`);
      if (!checkbox || !checkbox.checked) return;

      const label = $(`label[for="${partId}"]`);
      const labelText = label ? label.textContent.trim().split(' - ')[0] : partId;
      
      const qtyInput = $(`input[data-target="${partId}"]`);
      const quantity = qtyInput ? Math.max(1, sanitizeNumber(qtyInput.value, 1)) : 1;
      
      const itemTotal = STATE.prices[partId] * quantity;
      selectedParts.push(`• ${labelText} (${quantity}x): ${formatBRL(itemTotal)}`);
    });

    if (selectedParts.length > 0) {
      lines.push('*Peças Selecionadas:*');
      lines.push(...selectedParts);
      lines.push('');
    }

    lines.push(`*Mão de Obra:* ${formatBRL(STATE.baseLabor)}`);
    lines.push('');
    lines.push(`*Total: ${formatBRL(STATE.total)}*`);
    lines.push('');
    lines.push('*Informações Adicionais:*');
    lines.push('• Orçamento válido por 7 dias');
    lines.push('• Pagamento à vista no ato da entrega');
    lines.push('• Garantia de 90 dias para peças e mão de obra');

    return lines.join('\n');
  }

  function sendToWhatsApp() {
    // Allow sending even without controller selection
    const message = buildWhatsAppMessage();
    const phone = (window.WHATSAPP_NUMBER || '5512992265665').replace(/\D+/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    showNotification('Abrindo WhatsApp...', 'success');
  }

  // Notification system
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Check if any Xbox controller (One or Series) is selected
  function hasXboxController() {
    return $$('select[name="modelo[]"]').some(select => 
      select.value === 'XboxOne' || select.value === 'XboxSeries'
    );
  }

  // Update battery option visibility based on controller selection
  function updateBatteryOption() {
    const batteryCheckbox = $('#bateria');
    const batteryContainer = batteryCheckbox ? batteryCheckbox.closest('.flex.items-center.justify-between') : null;
    
    if (!batteryContainer) return;

    if (hasXboxController()) {
      // Disable battery option for Xbox controllers (One and Series)
      batteryContainer.style.opacity = '0.5';
      batteryContainer.style.pointerEvents = 'none';
      batteryCheckbox.checked = false;
      batteryCheckbox.disabled = true;
      
      // Clear quantity if exists
      const qtyInput = $('input[data-target="bateria"]');
      if (qtyInput) qtyInput.value = 0;
      
      calculateTotal();
    } else {
      // Enable battery option for other controllers (PS4, PS5, etc.)
      batteryContainer.style.opacity = '1';
      batteryContainer.style.pointerEvents = 'auto';
      batteryCheckbox.disabled = false;
    }
  }

  // Event handlers
  function wireEvents() {
    const form = $('#orcamentoForm');
    if (!form) return;

    // Add controller button
    const addBtn = $('#add-controller');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addController();
        // Check battery option after adding controller
        setTimeout(updateBatteryOption, 100);
      });
    }

    // Setup initial remove buttons
    $$('.controller-item').forEach(setupRemoveButton);

    // Checkbox changes
    $$('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        syncCheckboxToQuantity(checkbox);
        calculateTotal();
      });
    });

    // Quantity inputs
    $$('input[type="number"][data-target]').forEach((input) => {
      input.addEventListener('input', () => {
        input.value = sanitizeNumber(input.value, 0);
      });

      input.addEventListener('change', () => {
        syncQuantityToCheckbox(input);
        calculateTotal();
      });
    });

    // Quantity buttons (+ and -) - initial setup
    setupQuantityButtons();

    // WhatsApp button
    const whatsappBtn = $('#enviarWhatsApp');
    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendToWhatsApp();
      });
    }

    // Controller select changes
    $$('select[name="modelo[]"]').forEach((select) => {
      select.addEventListener('change', () => {
        // Add visual feedback when controller is selected
        if (select.value) {
          select.classList.add('selected');
        } else {
          select.classList.remove('selected');
        }
        
        // Update battery option based on controller selection
        updateBatteryOption();
        
        // Update labor cost display and recalculate total
        updateLaborDisplay();
        calculateTotal();
      });
    });
  }

  // Initialization
  function init() {
    if (STATE.initialized) return;
    
    const form = $('#orcamentoForm');
    if (!form) return;

    STATE.initialized = true;

    // Initialize checkbox-quantity sync
    $$('input[type="checkbox"]').forEach(syncCheckboxToQuantity);

    // Wire all events
    wireEvents();

    // Check battery option on initial load
    updateBatteryOption();

    // Update labor display on initial load
    updateLaborDisplay();

    // Calculate initial total
    calculateTotal();

    console.log('✓ JoyFix Budget Calculator initialized');
  }

  // Public API
  window.JoyfixBudget = {
    init,
    calculateTotal,
    addController,
  };

  // Backward compatibility
  window.initOrcamentoCalculator = init;

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Add CSS animations
  if (!$('#calculator-animations')) {
    const style = document.createElement('style');
    style.id = 'calculator-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .pulse-animation {
        animation: pulse 0.3s ease;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      select.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
})();
