// Checkout functionality
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupPaymentMethods();
    setupFormSubmission();
});

// Load cart from localStorage and display order summary
function loadCart() {
    const cart = JSON.parse(localStorage.getItem('merchCart')) || [];
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');

    if (cart.length === 0) {
        window.location.href = 'merch-store.html';
        return;
    }

    let total = 0;
    orderItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="order-item">
                <div>
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-details">${item.size} / ${item.color} × ${item.quantity}</div>
                </div>
                <div class="order-item-price">$${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    orderTotal.textContent = `$${total.toFixed(2)}`;
    return { cart, total };
}

// Setup payment method toggles
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const stripePayment = document.getElementById('stripePayment');
    const paypalPayment = document.getElementById('paypalPayment');
    const mpesaPayment = document.getElementById('mpesaPayment');

    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            // Hide all payment details
            stripePayment.style.display = 'none';
            paypalPayment.style.display = 'none';
            mpesaPayment.style.display = 'none';

            // Show selected payment details
            if (e.target.value === 'stripe') {
                stripePayment.style.display = 'block';
            } else if (e.target.value === 'paypal') {
                paypalPayment.style.display = 'block';
            } else if (e.target.value === 'mpesa') {
                mpesaPayment.style.display = 'block';
            }
        });
    });

    // Initialize Stripe
    initializeStripe();

    // Initialize PayPal
    initializePayPal();
}

// Initialize Stripe Elements
function initializeStripe() {
    const stripe = Stripe('pk_test_51EXAMPLE...'); // Replace with your Stripe publishable key
    const elements = stripe.elements();

    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#1A1A1A',
                '::placeholder': {
                    color: '#666',
                },
            },
        },
    });

    cardElement.mount('#card-element');

    // Handle card errors
    cardElement.addEventListener('change', (event) => {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    return { stripe, cardElement };
}

// Initialize PayPal Buttons
function initializePayPal() {
    paypal.Buttons({
        createOrder: async (data, actions) => {
            try {
                const { cart, total } = loadCart();
                const customer = getCustomerData();

                const response = await fetch('/api/create-paypal-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customer,
                        items: cart.map(item => ({
                            productName: item.name,
                            quantity: item.quantity,
                            price: item.price
                        })),
                        totalAmount: total
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create PayPal order.');
                }

                const orderData = await response.json();
                return orderData.orderId;
            } catch (error) {
                console.error('PayPal createOrder error:', error);
                showError('general-errors', 'Failed to initialize PayPal payment. Please try again.');
                throw error;
            }
        },
        onApprove: async (data, actions) => {
            try {
                const response = await fetch('/api/capture-paypal-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: data.orderID
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to capture PayPal payment.');
                }

                const orderData = await response.json();
                if (orderData.success) {
                    showSuccessModal();
                    clearCart();
                } else {
                    throw new Error('PayPal payment capture failed.');
                }
            } catch (error) {
                console.error('PayPal onApprove error:', error);
                showError('general-errors', 'PayPal payment failed. Please try again.');
            }
        },
        onError: (error) => {
            console.error('PayPal error:', error);
            showError('general-errors', 'PayPal encountered an error. Please try again.');
        }
    }).render('#paypal-button-container');
}

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('checkoutForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearAllErrors();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Set loading state
        setLoadingState(true);

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        try {
            if (paymentMethod === 'stripe') {
                await processStripePayment();
            } else if (paymentMethod === 'paypal') {
                // PayPal is handled by the buttons
            } else if (paymentMethod === 'mpesa') {
                await processMpesaPayment();
            }
        } catch (error) {
            console.error('Payment error:', error);
            handlePaymentError(error, paymentMethod);
        } finally {
            setLoadingState(false);
        }
    });
}

// Process Stripe payment
async function processStripePayment() {
    const { stripe, cardElement } = initializeStripe();
    const { cart, total } = loadCart();
    const customer = getCustomerData();

    try {
        // Create payment intent
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer,
                items: cart.map(item => ({
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: total
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent.');
        }

        const { client_secret } = await response.json();

        // Confirm payment
        const { error } = await stripe.confirmCardPayment(client_secret, {
            payment_method: {
                card: cardElement,
            }
        });

        if (error) {
            throw new Error(error.message);
        } else {
            showSuccessModal();
            clearCart();
        }
    } catch (error) {
        throw error; // Re-throw to be handled by handlePaymentError
    }
}

// Process M-Pesa payment
async function processMpesaPayment() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const { cart, total } = loadCart();
    const customer = getCustomerData();

    try {
        const response = await fetch('/api/mpesa/stkpush', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber,
                customer,
                items: cart.map(item => ({
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: total
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to initiate M-Pesa payment.');
        }

        const result = await response.json();

        if (result.success) {
            showError('mpesa-errors', 'M-Pesa STK Push sent to your phone. Please complete the payment on your device.');
            // In a real app, you'd poll for payment status or use webhooks
            // For now, assume success after STK push
            setTimeout(() => {
                showSuccessModal();
                clearCart();
            }, 3000); // Simulate waiting for payment
        } else {
            throw new Error(result.error || 'M-Pesa payment initiation failed.');
        }
    } catch (error) {
        throw error; // Re-throw to be handled by handlePaymentError
    }
}

// Get customer data from form
function getCustomerData() {
    return {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value
    };
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
}

// Close success modal
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
}

// Clear cart after successful payment
function clearCart() {
    localStorage.removeItem('merchCart');
}

// Form validation
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    let isValid = true;

    if (!name) {
        showError('general-errors', 'Please enter your full name.');
        isValid = false;
    }

    if (!email) {
        showError('general-errors', 'Please enter your email address.');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('general-errors', 'Please enter a valid email address.');
        isValid = false;
    }

    if (!address) {
        showError('general-errors', 'Please enter your shipping address.');
        isValid = false;
    }

    if (!paymentMethod) {
        showError('general-errors', 'Please select a payment method.');
        isValid = false;
    } else if (paymentMethod.value === 'mpesa') {
        const phone = document.getElementById('phoneNumber').value.trim();
        if (!phone) {
            showError('mpesa-errors', 'Please enter your M-Pesa phone number.');
            isValid = false;
        } else if (!isValidPhone(phone)) {
            showError('mpesa-errors', 'Please enter a valid M-Pesa phone number (254XXXXXXXXX).');
            isValid = false;
        }
    }

    return isValid;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation for M-Pesa
function isValidPhone(phone) {
    const phoneRegex = /^254[0-9]{9}$/;
    return phoneRegex.test(phone);
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// Clear all errors
function clearAllErrors() {
    document.getElementById('general-errors').style.display = 'none';
    document.getElementById('card-errors').style.display = 'none';
    document.getElementById('mpesa-errors').style.display = 'none';
}

// Set loading state
function setLoadingState(loading) {
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('checkoutForm');
    const inputs = form.querySelectorAll('input, textarea, select');

    if (loading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        inputs.forEach(input => input.disabled = true);
    } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Order';
        inputs.forEach(input => input.disabled = false);
    }
}

// Handle payment errors
function handlePaymentError(error, paymentMethod) {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        message = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
        message = error.message;
    }

    if (paymentMethod === 'stripe') {
        showError('card-errors', message);
    } else if (paymentMethod === 'mpesa') {
        showError('mpesa-errors', message);
    } else {
        showError('general-errors', message);
    }
}