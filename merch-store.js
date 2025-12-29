// Product Database
const products = [
    {
        id: 1,
        name: 'Thank You God Album Tee',
        category: 'apparel',
        price: 29.99,
        description: 'Premium cotton t-shirt featuring the iconic "Thank You God" album artwork. Soft, comfortable, and built to last. Perfect for everyday wear.',
        images: [
            'merch-images/tshirt-front.jpg',
            'merch-images/tshirt-back.jpg',
            'merch-images/tshirt-detail.jpg'
        ],
        colors: [
            { name: 'Black', hex: '#000000' },
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Gold', hex: '#D4AF37' },
            { name: 'Cream', hex: '#E8DCC4' }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        badge: 'Best Seller',
        featured: true
    },
    {
        id: 2,
        name: '24 Premium Hoodie',
        category: 'apparel',
        price: 59.99,
        description: 'Heavy-weight pullover hoodie with embroidered 24 logo. Fleece-lined for warmth. Perfect for those cold days and nights.',
        images: [
            'merch-images/hoodie-front.jpg',
            'merch-images/hoodie-back.jpg',
            'merch-images/hoodie-detail.jpg'
        ],
        colors: [
            { name: 'Black', hex: '#000000' },
            { name: 'Gold', hex: '#D4AF37' },
            { name: 'Charcoal', hex: '#36454F' }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        badge: 'New',
        featured: true
    },
    {
        id: 3,
        name: 'Gold Chain Logo Hat',
        category: 'accessories',
        price: 24.99,
        description: 'Classic snapback with embroidered 24 logo. Adjustable fit, curved brim. Rep the movement wherever you go.',
        images: [
            'merch-images/hat-front.jpg',
            'merch-images/hat-side.jpg',
            'merch-images/hat-back.jpg'
        ],
        colors: [
            { name: 'Black', hex: '#000000' },
            { name: 'Gold', hex: '#D4AF37' },
            { name: 'Cream', hex: '#E8DCC4' }
        ],
        sizes: ['One Size'],
        featured: true
    },
    {
        id: 4,
        name: 'Thank You God Beanie',
        category: 'accessories',
        price: 19.99,
        description: 'Warm knit beanie with woven 24 tag. Stretchy fit for all head sizes. Perfect for winter.',
        images: [
            'merch-images/beanie-front.jpg',
            'merch-images/beanie-worn.jpg'
        ],
        colors: [
            { name: 'Black', hex: '#000000' },
            { name: 'Gold', hex: '#D4AF37' }
        ],
        sizes: ['One Size'],
        featured: false
    },
    {
        id: 5,
        name: 'Album Art Poster Set',
        category: 'collectibles',
        price: 34.99,
        description: 'High-quality print set featuring all album artwork. 18x24 inches. Perfect for framing. Ships rolled in protective tube.',
        images: [
            'merch-images/poster-set.jpg',
            'merch-images/poster-detail.jpg'
        ],
        colors: [
            { name: 'Full Color', hex: '#D4AF37' }
        ],
        sizes: ['18x24'],
        badge: 'Limited',
        featured: true
    },
    {
        id: 6,
        name: '24 Sticker Pack',
        category: 'accessories',
        price: 9.99,
        description: 'Set of 5 weatherproof vinyl stickers. Perfect for laptops, water bottles, and more. Includes album art, logo, and track designs.',
        images: [
            'merch-images/stickers-pack.jpg',
            'merch-images/stickers-individual.jpg'
        ],
        colors: [
            { name: 'Mixed', hex: '#D4AF37' }
        ],
        sizes: ['Pack of 5'],
        featured: false
    },
    {
        id: 7,
        name: 'Oversized Tour Tee',
        category: 'apparel',
        price: 34.99,
        description: 'Oversized fit tour-style tee with track list on back. Washed for vintage feel. Drop shoulder cut.',
        images: [
            'merch-images/tour-tee-front.jpg',
            'merch-images/tour-tee-back.jpg'
        ],
        colors: [
            { name: 'Vintage Black', hex: '#2C2C2C' },
            { name: 'Vintage White', hex: '#F0F0F0' }
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        badge: 'Limited',
        featured: true
    },
    {
        id: 8,
        name: 'Thank You God Vinyl',
        category: 'collectibles',
        price: 44.99,
        description: 'Limited edition vinyl pressing of the complete album. Includes fold-out poster and lyric insert. Gold-colored vinyl.',
        images: [
            'merch-images/vinyl-front.jpg',
            'merch-images/vinyl-detail.jpg'
        ],
        colors: [
            { name: 'Gold Vinyl', hex: '#D4AF37' }
        ],
        sizes: ['12" LP'],
        badge: 'Limited Edition',
        featured: true
    }
];

// Shopping Cart
let cart = JSON.parse(localStorage.getItem('merchCart')) || [];

// Current selected product for modal
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

// Initialize store
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartDisplay();
    setupFilterButtons();
    setupSortDropdown();
});

// Load products into grid
function loadProducts(filter = 'all', sort = 'featured') {
    const grid = document.getElementById('productsGrid');
    let filteredProducts = products;

    // Apply filter
    if (filter !== 'all') {
        filteredProducts = products.filter(p => p.category === filter);
    }

    // Apply sort
    filteredProducts = sortProducts(filteredProducts, sort);

    // Render products
    grid.innerHTML = filteredProducts.map((product, index) => `
        <div class="product-card" onclick="openProductModal(${product.id})" style="animation-delay: ${index * 0.1}s">
            <div class="product-image-container">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x400/E8DCC4/1A1A1A?text=${encodeURIComponent(product.name)}'">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <div class="product-quick-view">Quick View</div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-colors">
                    ${product.colors.slice(0, 4).map(color => `
                        <div class="color-dot" style="background-color: ${color.hex}; ${color.hex === '#FFFFFF' ? 'border-color: #ccc;' : ''}"></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Sort products
function sortProducts(products, sortType) {
    const sorted = [...products];
    
    switch(sortType) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'newest':
            return sorted.reverse();
        case 'featured':
        default:
            return sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
}

// Setup filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            const sort = document.getElementById('sortSelect').value;
            loadProducts(filter, sort);
        });
    });
}

// Setup sort dropdown
function setupSortDropdown() {
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', () => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        loadProducts(activeFilter, sortSelect.value);
    });
}

// Open product modal
function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    const modal = document.getElementById('productModal');
    
    // Set product info
    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalPrice').textContent = `$${currentProduct.price.toFixed(2)}`;
    document.getElementById('modalDescription').textContent = currentProduct.description;
    
    // Set main image
    document.getElementById('modalMainImage').src = currentProduct.images[0];
    document.getElementById('modalMainImage').onerror = function() {
        this.src = `https://via.placeholder.com/600x600/E8DCC4/1A1A1A?text=${encodeURIComponent(currentProduct.name)}`;
    };
    
    // Load thumbnails
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    thumbnailGallery.innerHTML = currentProduct.images.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', ${index})">
            <img src="${img}" alt="Thumbnail ${index + 1}" onerror="this.src='https://via.placeholder.com/80x80/E8DCC4/1A1A1A?text=Img'">
        </div>
    `).join('');
    
    // Load sizes
    const sizeSelector = document.getElementById('sizeSelector');
    sizeSelector.innerHTML = currentProduct.sizes.map(size => `
        <button class="size-btn" onclick="selectSize('${size}')">${size}</button>
    `).join('');
    
    // Load colors
    const colorSelector = document.getElementById('colorSelector');
    colorSelector.innerHTML = currentProduct.colors.map((color, index) => `
        <div class="color-option ${index === 0 ? 'selected' : ''}" 
             style="background-color: ${color.hex}; ${color.hex === '#FFFFFF' ? 'border: 2px solid #ccc;' : ''}" 
             onclick="selectColor('${color.name}', '${color.hex}')"
             title="${color.name}">
        </div>
    `).join('');
    
    // Reset selections
    selectedSize = null;
    selectedColor = currentProduct.colors[0].name;
    document.getElementById('quantityInput').value = 1;
    
    updateTotalPrice();
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close product modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Change main image
function changeMainImage(imageSrc, index) {
    document.getElementById('modalMainImage').src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Select size
function selectSize(size) {
    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === size);
    });
}

// Select color
function selectColor(colorName, colorHex) {
    selectedColor = colorName;
    document.querySelectorAll('.color-option').forEach(option => {
        const isSelected = option.style.backgroundColor === colorHex.toLowerCase() || 
                          (colorHex === '#FFFFFF' && option.style.backgroundColor === 'rgb(255, 255, 255)');
        option.classList.toggle('selected', isSelected);
    });
}

// Quantity controls
function increaseQuantity() {
    const input = document.getElementById('quantityInput');
    if (input.value < 10) {
        input.value = parseInt(input.value) + 1;
        updateTotalPrice();
    }
}

function decreaseQuantity() {
    const input = document.getElementById('quantityInput');
    if (input.value > 1) {
        input.value = parseInt(input.value) - 1;
        updateTotalPrice();
    }
}

// Update total price
function updateTotalPrice() {
    if (!currentProduct) return;
    const quantity = parseInt(document.getElementById('quantityInput').value);
    const total = (currentProduct.price * quantity).toFixed(2);
    document.getElementById('totalPrice').textContent = `$${total}`;
}

// Add to cart
function addToCart() {
    if (!currentProduct) return;
    
    // Validate size selection for apparel
    if (currentProduct.category === 'apparel' && !selectedSize && currentProduct.sizes.length > 1) {
        alert('Please select a size');
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    const cartItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.images[0],
        size: selectedSize || currentProduct.sizes[0],
        color: selectedColor,
        quantity: quantity
    };
    
    // Check if item already exists in cart
    const existingIndex = cart.findIndex(item => 
        item.id === cartItem.id && 
        item.size === cartItem.size && 
        item.color === cartItem.color
    );
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }
    
    saveCart();
    updateCartDisplay();
    
    // Show feedback
    const btn = document.querySelector('.add-to-cart-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Added to Cart!';
    btn.style.background = '#27ae60';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
    
    // Open cart
    setTimeout(() => {
        toggleCart();
        closeProductModal();
    }, 1000);
}

// Toggle cart sidebar
function toggleCart() {
    const cart = document.getElementById('cartSidebar');
    const backdrop = document.getElementById('cartBackdrop');
    
    cart.classList.toggle('active');
    backdrop.classList.toggle('active');
    
    if (cart.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// Update cart display
function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const subtotal = document.getElementById('subtotalAmount');
    
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80x80/E8DCC4/1A1A1A?text=Product'">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-options">${item.size} / ${item.color}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${index})">×</button>
            </div>
        `).join('');
    }
    
    // Update subtotal
    const subtotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    subtotal.textContent = `$${subtotalAmount.toFixed(2)}`;
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('merchCart', JSON.stringify(cart));
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        if (document.getElementById('cartSidebar').classList.contains('active')) {
            toggleCart();
        }
    }
});

// Image zoom on hover (advanced)
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('mousemove', (e) => {
        const mainImage = document.getElementById('modalMainImage');
        if (!mainImage) return;
        
        const container = mainImage.parentElement;
        if (!container.matches(':hover')) return;
        
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        mainImage.style.transformOrigin = `${x}% ${y}%`;
    });
});
