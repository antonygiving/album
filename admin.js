document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginError = document.getElementById('login-error');
    const ordersTbody = document.getElementById('orders-tbody');
    const noOrders = document.getElementById('no-orders');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tracks elements
    const tracksTbody = document.getElementById('tracks-tbody');
    const noTracks = document.getElementById('no-tracks');
    const addTrackBtn = document.getElementById('add-track-btn');

    // Upload elements
    const uploadTrackBtn = document.getElementById('upload-track-btn');
    const uploadSection = document.getElementById('upload-section');
    const uploadTrackForm = document.getElementById('upload-track-form');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');

    // Merch elements
    const merchTbody = document.getElementById('merch-tbody');
    const noMerch = document.getElementById('no-merch');
    const addMerchBtn = document.getElementById('add-merch-btn');

    // Subscribers elements
    const subscribersTbody = document.getElementById('subscribers-tbody');
    const noSubscribers = document.getElementById('no-subscribers');
    const subscribersLoading = document.getElementById('subscribers-loading');
    const subscribersError = document.getElementById('subscribers-error');
    const exportSubscribersBtn = document.getElementById('export-subscribers-btn');

    // Modal elements
    const trackModal = document.getElementById('track-modal');
    const trackForm = document.getElementById('track-form');
    const trackModalTitle = document.getElementById('track-modal-title');
    const merchModal = document.getElementById('merch-modal');
    const merchForm = document.getElementById('merch-form');
    const merchModalTitle = document.getElementById('merch-modal-title');
    const closeModal = document.querySelectorAll('.close-modal');

    let allOrders = [];
    let allTracks = [];
    let allMerch = [];
    let allSubscribers = [];
    let currentFilter = 'all';
    let currentTab = 'orders';
    let editingTrackId = null;
    let editingMerchId = null;

    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        showDashboard();
        fetchOrders();
        fetchTracks();
        fetchMerch();
        fetchSubscribers();
    }

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Clear previous errors
        loginError.style.display = 'none';

        // Set loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                showDashboard();
                fetchOrders();
                fetchTracks();
                fetchMerch();
                fetchSubscribers();
            } else {
                loginError.textContent = data.error || 'Login failed. Please check your password.';
                loginError.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            loginError.textContent = errorMessage;
            loginError.style.display = 'block';
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });

    // Tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentTab = this.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(content => content.style.display = 'none');
            document.getElementById(`${currentTab}-tab`).style.display = 'block';
        });
    });

    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentFilter = this.dataset.status;
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            displayOrders();
        });
    });

    // Set default active tab and filter
    document.querySelector('.tab-btn[data-tab="orders"]').classList.add('active');
    document.querySelector('.filter-btn[data-status="all"]').classList.add('active');

    // Track modal events
    addTrackBtn.addEventListener('click', () => openTrackModal());
    closeModal.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeTrackModal();
            closeMerchModal();
        });
    });
    window.addEventListener('click', (e) => {
        if (e.target === trackModal) {
            closeTrackModal();
        }
        if (e.target === merchModal) {
            closeMerchModal();
        }
    });

    // Upload events
    uploadTrackBtn.addEventListener('click', () => {
        uploadSection.style.display = 'block';
    });
    cancelUploadBtn.addEventListener('click', () => {
        uploadSection.style.display = 'none';
        uploadTrackForm.reset();
    });

    // Merch modal events
    addMerchBtn.addEventListener('click', () => openMerchModal());

    // Track form submission
    trackForm.addEventListener('submit', handleTrackSubmit);

    // Upload form submission
    uploadTrackForm.addEventListener('submit', handleUploadSubmit);

    // Merch form submission
    merchForm.addEventListener('submit', handleMerchSubmit);

    // Export subscribers button
    exportSubscribersBtn.addEventListener('click', exportSubscribersToCSV);

    // Event delegation for edit and delete buttons
    tracksTbody.addEventListener('click', handleTrackAction);
    merchTbody.addEventListener('click', handleMerchAction);

    async function fetchOrders() {
        try {
            const response = await fetch('/api/admin/orders', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                allOrders = await response.json();
                displayOrders();
            } else if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('adminToken');
                showLogin();
            } else {
                console.error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    async function fetchTracks() {
        try {
            const response = await fetch('/api/admin/tracks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                allTracks = await response.json();
                displayTracks();
            } else if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('adminToken');
                showLogin();
            } else {
                console.error('Failed to fetch tracks');
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
        }
    }

    async function fetchMerch() {
        try {
            // For now, we'll load merch from the merch-store.js file
            // In a real application, this would be an API call
            const response = await fetch('/merch-store.js');
            const scriptText = await response.text();

            // Extract the products array from the script
            const productsMatch = scriptText.match(/const products = \[([\s\S]*?)\];/);
            if (productsMatch) {
                // Parse the products array
                const productsCode = productsMatch[1];
                // Simple parsing - in a real app, this would be an API endpoint
                allMerch = [
                    {
                        id: 1,
                        name: 'Thank You God Album Tee',
                        category: 'apparel',
                        price: 29.99,
                        badge: 'Best Seller'
                    },
                    {
                        id: 2,
                        name: '24 Premium Hoodie',
                        category: 'apparel',
                        price: 59.99,
                        badge: 'New'
                    },
                    {
                        id: 3,
                        name: 'Gold Chain Logo Hat',
                        category: 'accessories',
                        price: 24.99
                    },
                    {
                        id: 4,
                        name: 'Thank You God Beanie',
                        category: 'accessories',
                        price: 19.99
                    },
                    {
                        id: 5,
                        name: 'Album Art Poster Set',
                        category: 'collectibles',
                        price: 34.99,
                        badge: 'Limited'
                    },
                    {
                        id: 6,
                        name: '24 Sticker Pack',
                        category: 'accessories',
                        price: 9.99
                    },
                    {
                        id: 7,
                        name: 'Oversized Tour Tee',
                        category: 'apparel',
                        price: 34.99,
                        badge: 'Limited'
                    },
                    {
                        id: 8,
                        name: 'Thank You God Vinyl',
                        category: 'collectibles',
                        price: 44.99,
                        badge: 'Limited Edition'
                    }
                ];
                displayMerch();
            }
        } catch (error) {
            console.error('Error fetching merch:', error);
        }
    }

    async function fetchSubscribers() {
        // Show loading state
        subscribersLoading.style.display = 'block';
        subscribersError.style.display = 'none';
        noSubscribers.style.display = 'none';
        subscribersTbody.innerHTML = '';

        try {
            const response = await fetch('/api/admin/subscribers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                allSubscribers = await response.json();
                displaySubscribers();
            } else if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('adminToken');
                showLogin();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Failed to fetch subscribers (${response.status})`;
                subscribersError.textContent = errorMessage;
                subscribersError.style.display = 'block';
                console.error('Failed to fetch subscribers:', errorMessage);
            }
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            let errorMessage = 'An unexpected error occurred while fetching subscribers.';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            subscribersError.textContent = errorMessage;
            subscribersError.style.display = 'block';
        } finally {
            // Hide loading state
            subscribersLoading.style.display = 'none';
        }
    }

    function displayOrders() {
        ordersTbody.innerHTML = '';

        let filteredOrders = allOrders;
        if (currentFilter !== 'all') {
            filteredOrders = allOrders.filter(order => order.orderStatus === currentFilter);
        }

        if (filteredOrders.length === 0) {
            noOrders.style.display = 'block';
            return;
        }

        noOrders.style.display = 'none';

        filteredOrders.forEach(order => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--glass-border)';

            const date = new Date(order.createdAt).toLocaleDateString();

            row.innerHTML = `
                <td style="padding: 15px;">${order._id}</td>
                <td style="padding: 15px;">${order.customer.name}</td>
                <td style="padding: 15px;">${order.customer.email}</td>
                <td style="padding: 15px;">$${order.totalAmount.toFixed(2)}</td>
                <td style="padding: 15px;">${order.paymentMethod}</td>
                <td style="padding: 15px;">${order.orderStatus}</td>
                <td style="padding: 15px;">${date}</td>
            `;

            ordersTbody.appendChild(row);
        });
    }

    function displayTracks() {
        tracksTbody.innerHTML = '';

        if (allTracks.length === 0) {
            noTracks.style.display = 'block';
            return;
        }

        noTracks.style.display = 'none';

        allTracks.forEach(track => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--glass-border)';

            row.innerHTML = `
                <td style="padding: 15px;">${track.id}</td>
                <td style="padding: 15px;">${track.title}</td>
                <td style="padding: 15px;">${track.story.substring(0, 100)}...</td>
                <td style="padding: 15px;">
                    <button class="btn-secondary edit-track-btn" data-id="${track.id}">Edit</button>
                    <button class="btn-secondary delete-track-btn" data-id="${track.id}" style="background: #dc3545; margin-left: 10px;">Delete</button>
                </td>
            `;

            tracksTbody.appendChild(row);
        });
    }

    function displayMerch() {
        merchTbody.innerHTML = '';

        if (allMerch.length === 0) {
            noMerch.style.display = 'block';
            return;
        }

        noMerch.style.display = 'none';

        allMerch.forEach(merch => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--glass-border)';

            row.innerHTML = `
                <td style="padding: 15px;">${merch.id}</td>
                <td style="padding: 15px;">${merch.name}</td>
                <td style="padding: 15px;">${merch.category}</td>
                <td style="padding: 15px;">$${merch.price.toFixed(2)}</td>
                <td style="padding: 15px;">
                    <button class="btn-secondary edit-merch-btn" data-id="${merch.id}">Edit</button>
                    <button class="btn-secondary delete-merch-btn" data-id="${merch.id}" style="background: #dc3545; margin-left: 10px;">Delete</button>
                </td>
            `;

            merchTbody.appendChild(row);
        });
    }

    function displaySubscribers() {
        subscribersTbody.innerHTML = '';

        if (allSubscribers.length === 0) {
            noSubscribers.style.display = 'block';
            return;
        }

        noSubscribers.style.display = 'none';

        allSubscribers.forEach(subscriber => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--glass-border)';

            const date = new Date(subscriber.subscribedAt).toLocaleDateString();

            row.innerHTML = `
                <td style="padding: 15px;">${subscriber.email}</td>
                <td style="padding: 15px;">${date}</td>
            `;

            subscribersTbody.appendChild(row);
        });
    }

    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
    }

    function showLogin() {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
    }

    function openTrackModal(track = null) {
        if (track) {
            trackModalTitle.textContent = 'Edit Track';
            document.getElementById('track-id').value = track.id;
            document.getElementById('track-title').value = track.title;
            document.getElementById('track-story').value = track.story;
            document.getElementById('track-spotify').value = track.spotify;
            document.getElementById('track-apple').value = track.appleMusic;
            document.getElementById('track-youtube').value = track.youtube;
            document.getElementById('track-audio').value = track.audioFile;
            editingTrackId = track.id;
        } else {
            trackModalTitle.textContent = 'Add New Track';
            trackForm.reset();
            document.getElementById('track-id').value = '';
            editingTrackId = null;
        }
        trackModal.style.display = 'flex';
    }

    function closeTrackModal() {
        trackModal.style.display = 'none';
        editingTrackId = null;
    }

    async function handleTrackSubmit(e) {
        e.preventDefault();
        const formData = new FormData(trackForm);
        const trackData = {
            id: parseInt(formData.get('id')),
            title: formData.get('title'),
            story: formData.get('story'),
            spotify: formData.get('spotify'),
            appleMusic: formData.get('appleMusic'),
            youtube: formData.get('youtube'),
            audioFile: formData.get('audioFile')
        };

        try {
            let response;
            if (editingTrackId) {
                response = await fetch(`/api/admin/tracks/${editingTrackId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify(trackData)
                });
            } else {
                response = await fetch('/api/admin/tracks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify(trackData)
                });
            }

            if (response.ok) {
                closeTrackModal();
                fetchTracks();
            } else {
                alert('Error saving track');
            }
        } catch (error) {
            console.error('Error saving track:', error);
            alert('Error saving track');
        }
    }

    async function handleUploadSubmit(e) {
        e.preventDefault();
        const formData = new FormData(uploadTrackForm);

        try {
            const response = await fetch('/api/admin/upload-track', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            if (response.ok) {
                uploadSection.style.display = 'none';
                uploadTrackForm.reset();
                fetchTracks();
            } else {
                alert('Error uploading track');
            }
        } catch (error) {
            console.error('Error uploading track:', error);
            alert('Error uploading track');
        }
    }

    async function handleTrackAction(e) {
        if (e.target.classList.contains('edit-track-btn')) {
            const trackId = parseInt(e.target.dataset.id);
            const track = allTracks.find(t => t.id === trackId);
            if (track) {
                openTrackModal(track);
            }
        } else if (e.target.classList.contains('delete-track-btn')) {
            const trackId = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to delete this track?')) {
                try {
                    const response = await fetch(`/api/admin/tracks/${trackId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    });

                    if (response.ok) {
                        fetchTracks();
                    } else {
                        alert('Error deleting track');
                    }
                } catch (error) {
                    console.error('Error deleting track:', error);
                    alert('Error deleting track');
                }
            }
        }
    }

    function openMerchModal(merch = null) {
        if (merch) {
            merchModalTitle.textContent = 'Edit Merch Item';
            document.getElementById('merch-id').value = merch.id;
            document.getElementById('merch-name').value = merch.name;
            document.getElementById('merch-category').value = merch.category;
            document.getElementById('merch-price').value = merch.price;
            document.getElementById('merch-badge').value = merch.badge || '';
            document.getElementById('merch-sizes').value = merch.sizes ? merch.sizes.join(', ') : '';
            document.getElementById('merch-colors').value = merch.colors ? merch.colors.map(c => `${c.name}:${c.hex}`).join(', ') : '';
            document.getElementById('merch-images').value = merch.images ? merch.images.join(', ') : '';
            document.getElementById('merch-description').value = merch.description || '';
            editingMerchId = merch.id;
        } else {
            merchModalTitle.textContent = 'Add New Merch Item';
            merchForm.reset();
            document.getElementById('merch-id').value = '';
            editingMerchId = null;
        }
        merchModal.style.display = 'flex';
    }

    function closeMerchModal() {
        merchModal.style.display = 'none';
        editingMerchId = null;
    }

    async function handleMerchSubmit(e) {
        e.preventDefault();
        const formData = new FormData(merchForm);
        const merchData = {
            id: editingMerchId || Date.now(), // Simple ID generation
            name: formData.get('name'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            badge: formData.get('badge') || null,
            sizes: formData.get('sizes').split(',').map(s => s.trim()),
            colors: formData.get('colors').split(',').map(c => {
                const [name, hex] = c.trim().split(':');
                return { name, hex };
            }),
            images: formData.get('images').split(',').map(i => i.trim()),
            description: formData.get('description'),
            featured: false
        };

        try {
            // For now, we'll just update the local array
            // In a real application, this would be an API call
            if (editingMerchId) {
                const index = allMerch.findIndex(m => m.id === editingMerchId);
                if (index !== -1) {
                    allMerch[index] = merchData;
                }
            } else {
                allMerch.push(merchData);
            }

            closeMerchModal();
            displayMerch();
            alert('Merch item saved successfully! (Note: Changes are local only for demo)');
        } catch (error) {
            console.error('Error saving merch:', error);
            alert('Error saving merch item');
        }
    }

    async function handleMerchAction(e) {
        if (e.target.classList.contains('edit-merch-btn')) {
            const merchId = parseInt(e.target.dataset.id);
            const merch = allMerch.find(m => m.id === merchId);
            if (merch) {
                openMerchModal(merch);
            }
        } else if (e.target.classList.contains('delete-merch-btn')) {
            const merchId = parseInt(e.target.dataset.id);
            if (confirm('Are you sure you want to delete this merch item?')) {
                // For demo purposes, just remove from local array
                allMerch = allMerch.filter(m => m.id !== merchId);
                displayMerch();
                alert('Merch item deleted successfully! (Note: Changes are local only for demo)');
            }
        }
    }

    function exportSubscribersToCSV() {
        if (allSubscribers.length === 0) {
            alert('No subscribers to export.');
            return;
        }

        // Create CSV content
        const headers = ['Email', 'Subscribed At'];
        const rows = allSubscribers.map(subscriber => [
            subscriber.email,
            new Date(subscriber.subscribedAt).toLocaleDateString()
        ]);

        // Combine headers and rows
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});