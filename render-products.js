// Dynamic Product Renderer for JoyFix
// Loads products.json and product-card.html, renders each card into #products-list

async function renderProducts() {
  const productsList = document.getElementById('products-list');
  if (!productsList) return;

  // Fetch product data
  const [products, cardTemplate] = await Promise.all([
    fetch('products.json').then(r => r.json()),
    fetch('product-card.html').then(r => r.text())
  ]);

  productsList.innerHTML = '';

  products.forEach(product => {
    let html = cardTemplate;
    // Images carousel
    const imagesJson = JSON.stringify(product.images);
    let carouselImages = '';
    for (const img of product.images) {
      carouselImages += `<img src="${img}" alt="${product.name}" class=\"w-full h-56 object-cover bg-white rounded-t-xl mx-auto block flex-shrink-0\" />`;
    }
    // Sold style
    const soldStyle = product.sold ? 'filter: grayscale(0.5) brightness(0.8); opacity: 0.7;' : '';
    // Sold button
    const soldBtnBg = product.sold ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 whatsapp-buy-btn';
    const soldBtnExtra = product.sold ? 'cursor-not-allowed opacity-60' : '';
    const soldBtnDisabled = product.sold ? 'disabled' : '';
    const soldBtnText = product.sold ? 'Vendido' : 'Comprar Agora';
    // Badge bg fallback
    const badgeBg = product.badge_bg || 'bg-gray-700';
    // Free shipping
    const freeShipping = product.free_shipping ? 'true' : '';

    html = html
      .replace(/\{\{name\}\}/g, product.name)
      .replace(/\{\{description\}\}/g, product.description)
      .replace(/\{\{images_json\}\}/g, imagesJson)
      .replace(/\{\{carousel_images\}\}/g, carouselImages)
      .replace(/\{\{sold\}\}/g, product.sold ? 'true' : '')
      .replace(/\{\{sold_style\}\}/g, soldStyle)
      .replace(/\{\{badge\}\}/g, product.badge)
      .replace(/\{\{badge_bg\}\}/g, badgeBg)
      .replace(/\{\{price\}\}/g, product.price)
      .replace(/\{\{installments\}\}/g, product.installments)
      .replace(/\{\{free_shipping\}\}/g, freeShipping)
      .replace(/\{\{sold_btn_bg\}\}/g, soldBtnBg)
      .replace(/\{\{sold_btn_extra\}\}/g, soldBtnExtra)
      .replace(/\{\{sold_btn_disabled\}\}/g, soldBtnDisabled)
      .replace(/\{\{sold_btn_text\}\}/g, soldBtnText);

    // Sold badge logic
    if (product.sold) {
      html = html.replace(/\{\{#if sold\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
    } else {
      html = html.replace(/\{\{#if sold\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
    }
    // Free shipping logic
    if (product.free_shipping) {
      html = html.replace(/\{\{#if free_shipping\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
    } else {
      html = html.replace(/\{\{#if free_shipping\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
    }
    productsList.insertAdjacentHTML('beforeend', html);
  });
}

// Load external script once by id
function loadScriptOnce(src, id) {
  if (id && document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    if (id) s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Render products if the list exists
  renderProducts();

  // Load budget calculator logic and auto-init if the form exists
  loadScriptOnce('js/orcamento-calculator.js', 'orcamento-calculator')
    .catch(() => {/* ignore load errors on pages without the script */});
});
