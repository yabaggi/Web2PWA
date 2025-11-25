/**
 * PWA Converter - Main Application Logic
 * Converts standard web applications into Progressive Web Apps
 * 
 * @version 1.0.0
 * @author PWA Converter Team
 */

'use strict';

// ============================================================================
// PWAConverter Class - Main Application Controller
// ============================================================================

class PWAConverter {
    constructor() {
        // File storage
        this.files = {
            html: null,
            css: null,
            js: null,
            icon: null
        };

        // Configuration storage
        this.config = {};

        // Generated files storage
        this.generatedFiles = {};

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupColorInputSync();
        this.setupCacheStrategyDescription();
        console.log('PWA Converter initialized successfully');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // File upload handlers
        document.getElementById('app-folder').addEventListener('change', (e) => 
            this.handleFolderUpload(e));
        document.getElementById('icon-file').addEventListener('change', (e) => 
            this.handleFileUpload(e, 'icon'));

        // Navigation buttons
        document.getElementById('next-to-config').addEventListener('click', () => 
            this.showSection('config'));
        document.getElementById('back-to-upload').addEventListener('click', () => 
            this.showSection('upload'));
        document.getElementById('start-over').addEventListener('click', () => 
            this.reset());

        // Form submission
        document.getElementById('pwa-config-form').addEventListener('submit', (e) => 
            this.generatePWA(e));

        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filename = btn.getAttribute('data-file');
                this.downloadFile(filename);
            });
        });

        document.getElementById('download-all').addEventListener('click', () => 
            this.downloadAll());

        // Auto-generate short name from app name
        document.getElementById('app-name').addEventListener('input', (e) => {
            const shortNameInput = document.getElementById('short-name');
            if (!shortNameInput.value || shortNameInput.value === '') {
                shortNameInput.value = e.target.value.substring(0, 12);
            }
        });
    }

    /**
     * Synchronize color inputs (color picker and text input)
     */
    setupColorInputSync() {
        // Theme color sync
        const themeColor = document.getElementById('theme-color');
        const themeColorText = document.getElementById('theme-color-text');

        themeColor.addEventListener('input', (e) => {
            themeColorText.value = e.target.value.toUpperCase();
        });

        themeColorText.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                themeColor.value = value;
            }
        });

        // Background color sync
        const bgColor = document.getElementById('background-color');
        const bgColorText = document.getElementById('background-color-text');

        bgColor.addEventListener('input', (e) => {
            bgColorText.value = e.target.value.toUpperCase();
        });

        bgColorText.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                bgColor.value = value;
            }
        });
    }

    /**
     * Update cache strategy description
     */
    setupCacheStrategyDescription() {
        const cacheStrategy = document.getElementById('cache-strategy');
        const description = document.querySelector('.strategy-description');

        const descriptions = {
            'cache-first': 'Serves cached content immediately, updates cache in background (fastest, may show stale content)',
            'network-first': 'Always tries network first, falls back to cache if offline (fresh content, slower)',
            'stale-while-revalidate': 'Serves cached content while fetching updates in background (balanced approach)'
        };

        cacheStrategy.addEventListener('change', (e) => {
            description.textContent = descriptions[e.target.value];
        });
    }

    /**
     * Handle folder upload
     */
    async handleFolderUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const statusElement = document.getElementById('folder-status');
        const infoElement = document.getElementById('folder-info');

        statusElement.textContent = 'Processing...';
        statusElement.className = 'file-status';

        // Reset previous files
        this.files.html = null;
        this.files.css = null;
        this.files.js = null;

        try {
            const fileArray = Array.from(files);

            // Find HTML file (prioritize index.html)
            let htmlFile = fileArray.find(f => f.name.toLowerCase() === 'index.html');
            if (!htmlFile) {
                htmlFile = fileArray.find(f => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));
            }

            if (!htmlFile) {
                throw new Error('No HTML file found in the selected folder.');
            }

            // Find CSS and JS files
            const cssFiles = fileArray.filter(f => f.name.toLowerCase().endsWith('.css'));
            const jsFiles = fileArray.filter(f => f.name.toLowerCase().endsWith('.js'));

            // Read HTML file
            const htmlContent = await this.readFile(htmlFile);
            if (!this.validateHTML(htmlContent)) {
                throw new Error('Invalid HTML file - must contain HTML tags');
            }
            this.files.html = htmlContent;

            // Read and concatenate CSS files
            if (cssFiles.length > 0) {
                let cssContent = '';
                for (const file of cssFiles) {
                    cssContent += await this.readFile(file) + '\n';
                }
                this.files.css = cssContent;
            }

            // Read and concatenate JS files
            if (jsFiles.length > 0) {
                let jsContent = '';
                for (const file of jsFiles) {
                    jsContent += await this.readFile(file) + '\n';
                }
                this.files.js = jsContent;
            }

            // Update UI
            const totalSize = fileArray.reduce((acc, file) => acc + file.size, 0);
            statusElement.textContent = `✓ Folder loaded successfully`;
            statusElement.className = 'file-status success';
            
            let infoText = `Found: ${htmlFile.name}`;
            if (cssFiles.length > 0) infoText += `, ${cssFiles.length} CSS file(s)`;
            if (jsFiles.length > 0) infoText += `, ${jsFiles.length} JS file(s)`;
            
            infoElement.textContent = `${infoText}. Total size: ${this.formatFileSize(totalSize)}`;
            infoElement.className = 'file-info visible';

            // Extract metadata from HTML
            this.extractMetadata(this.files.html);

            // Enable next button
            document.getElementById('next-to-config').disabled = false;

            this.showToast('Folder processed successfully', 'success');

        } catch (error) {
            statusElement.textContent = `✗ Error: ${error.message}`;
            statusElement.className = 'file-status error';
            this.files.html = null;
            this.files.css = null;
            this.files.js = null;
            infoElement.className = 'file-info';
            document.getElementById('next-to-config').disabled = true;
            this.showToast(`Failed to process folder: ${error.message}`, 'error');
        }
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(event, fileType) {
        const file = event.target.files[0];
        if (!file) return;

        const statusElement = document.getElementById(`${fileType}-status`);
        const infoElement = document.getElementById(`${fileType}-info`);

        statusElement.textContent = 'Processing...';
        statusElement.className = 'file-status';

        try {
            if (fileType === 'icon') {
                this.files[fileType] = await this.processIcon(file);
            } else {
                throw new Error(`Unsupported file type for single upload: ${fileType}`);
            }

            // Show success status
            statusElement.textContent = `✓ ${file.name} loaded successfully`;
            statusElement.className = 'file-status success';

            // Show file info
            infoElement.textContent = `Size: ${this.formatFileSize(file.size)}`;
            infoElement.className = 'file-info visible';

            this.showToast(`${file.name} uploaded successfully`, 'success');

        } catch (error) {
            statusElement.textContent = `✗ Error: ${error.message}`;
            statusElement.className = 'file-status error';
            this.files[fileType] = null;
            infoElement.className = 'file-info';
            this.showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
        }
    }

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Process image icon
     */
    processIcon(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        dataUrl: e.target.result,
                        width: img.width,
                        height: img.height,
                        file: file
                    });
                };
                img.onerror = () => reject(new Error('Invalid image file'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Validate HTML content
     */
    validateHTML(content) {
        return content.toLowerCase().includes('<!doctype') || 
               content.toLowerCase().includes('<html');
    }

    /**
     * Extract metadata from HTML
     */
    extractMetadata(html) {
        // Extract title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && !document.getElementById('app-name').value) {
            const title = titleMatch[1].trim();
            document.getElementById('app-name').value = title;
            document.getElementById('short-name').value = title.substring(0, 12);
        }

        // Extract theme color
        const themeMatch = html.match(/<meta\s+name=["']theme-color["']\s+content=["'](.*?)["']/i);
        if (themeMatch) {
            const color = themeMatch[1];
            document.getElementById('theme-color').value = color;
            document.getElementById('theme-color-text').value = color.toUpperCase();
        }

        // Extract description
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        if (descMatch) {
            document.getElementById('description').value = descMatch[1];
        }

        this.showToast('Metadata extracted from HTML', 'info');
    }

    /**
     * Show section (navigation)
     */
    showSection(section) {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Generate PWA files
     */
    async generatePWA(event) {
        event.preventDefault();

        this.showLoading('Generating PWA files...');

        try {
            // Collect configuration
            this.config = {
                name: document.getElementById('app-name').value,
                shortName: document.getElementById('short-name').value,
                description: document.getElementById('description').value,
                themeColor: document.getElementById('theme-color').value,
                backgroundColor: document.getElementById('background-color').value,
                startUrl: document.getElementById('start-url').value,
                scope: document.getElementById('scope').value,
                display: document.getElementById('display-mode').value,
                orientation: document.getElementById('orientation').value,
                cacheStrategy: document.getElementById('cache-strategy').value,
                enableOffline: document.getElementById('enable-offline').checked,
                enableNotifications: document.getElementById('enable-notifications').checked
            };

            // Generate manifest
            this.updateLoadingStatus('Generating manifest.json...');
            await this.delay(300);
            this.generatedFiles.manifest = this.generateManifest();

            // Generate service worker
            this.updateLoadingStatus('Generating service worker...');
            await this.delay(300);
            this.generatedFiles.serviceWorker = this.generateServiceWorker();

            // Generate modified HTML
            this.updateLoadingStatus('Injecting PWA code into HTML...');
            await this.delay(300);
            this.generatedFiles.html = this.injectPWACode();

            // Process CSS if provided
            if (this.files.css) {
                this.generatedFiles.css = this.files.css;
            }

            // Process JavaScript if provided
            if (this.files.js) {
                this.updateLoadingStatus('Enhancing JavaScript...');
                await this.delay(300);
                this.generatedFiles.js = this.enhanceJavaScript();
            }

            // Generate offline page if enabled
            if (this.config.enableOffline) {
                this.updateLoadingStatus('Creating offline fallback page...');
                await this.delay(300);
                this.generatedFiles.offline = this.generateOfflinePage();
            }

            // Generate icons
            if (this.files.icon) {
                this.updateLoadingStatus('Generating app icons...');
                await this.generateIcons();
            } else {
                this.updateLoadingStatus('Creating default icons...');
                await this.generateDefaultIcons();
            }

            // Show success
            await this.delay(500);
            this.hideLoading();
            this.showDownloadSection();
            this.showSection('download');
            this.showToast('PWA generated successfully!', 'success');

        } catch (error) {
            this.hideLoading();
            this.showToast(`Error generating PWA: ${error.message}`, 'error');
            console.error('Generation error:', error);
        }
    }

    /**
     * Generate manifest.json
     */
    generateManifest() {
        const manifest = {
            name: this.config.name,
            short_name: this.config.shortName,
            description: this.config.description,
            start_url: this.config.startUrl,
            scope: this.config.scope,
            display: this.config.display,
            orientation: this.config.orientation,
            theme_color: this.config.themeColor,
            background_color: this.config.backgroundColor,
            icons: []
        };

        // Add icon definitions
        const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
        sizes.forEach(size => {
            manifest.icons.push({
                src: `icons/icon-${size}x${size}.png`,
                sizes: `${size}x${size}`,
                type: 'image/png',
                purpose: size >= 192 ? 'any maskable' : 'any'
            });
        });

        // Add categories if applicable
        manifest.categories = ['utilities', 'productivity'];

        return JSON.stringify(manifest, null, 2);
    }

    /**
     * Generate service worker
     */
    generateServiceWorker() {
        const cacheName = `${this.config.shortName.toLowerCase().replace(/\s+/g, '-')}-v1`;
        
        const urlsToCache = [
            this.config.startUrl,
            '/index.html',
            '/manifest.json'
        ];

        if (this.files.css) urlsToCache.push('/style.css');
        if (this.files.js) urlsToCache.push('/script.js');
        if (this.config.enableOffline) urlsToCache.push('/offline.html');

        const cacheStrategies = {
            'cache-first': this.generateCacheFirstStrategy(),
            'network-first': this.generateNetworkFirstStrategy(),
            'stale-while-revalidate': this.generateStaleWhileRevalidateStrategy()
        };

        return `/**
 * Service Worker for ${this.config.name}
 * Generated by PWA Converter
 * Cache Strategy: ${this.config.cacheStrategy}
 */

const CACHE_NAME = '${cacheName}';
const OFFLINE_URL = '${this.config.enableOffline ? '/offline.html' : ''}';

const urlsToCache = ${JSON.stringify(urlsToCache, null, 2)};

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[Service Worker] Cache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    ${cacheStrategies[this.config.cacheStrategy]}
});

${this.config.enableNotifications ? this.generateNotificationHandlers() : ''}

// Background sync (if supported)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    console.log('[Service Worker] Background sync triggered');
    // Implement your sync logic here
}

// Helper function to check if request is navigational
function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

console.log('[Service Worker] Loaded successfully');`;
    }

    /**
     * Generate cache-first strategy
     */
    generateCacheFirstStrategy() {
        return `    // Cache First Strategy
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                }).catch(error => {
                    ${this.config.enableOffline ? `
                    if (isNavigationRequest(event.request)) {
                        return caches.match(OFFLINE_URL);
                    }` : ''}
                    throw error;
                });
            })
    );`;
    }

    /**
     * Generate network-first strategy
     */
    generateNetworkFirstStrategy() {
        return `    // Network First Strategy
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(error => {
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    ${this.config.enableOffline ? `
                    if (isNavigationRequest(event.request)) {
                        return caches.match(OFFLINE_URL);
                    }` : ''}
                    throw error;
                });
            })
    );`;
    }

    /**
     * Generate stale-while-revalidate strategy
     */
    generateStaleWhileRevalidateStrategy() {
        return `    // Stale While Revalidate Strategy
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(response => {
                if (response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            }).catch(error => {
                ${this.config.enableOffline ? `
                if (isNavigationRequest(event.request)) {
                    return caches.match(OFFLINE_URL);
                }` : ''}
                throw error;
            });

            return cachedResponse || fetchPromise;
        })
    );`;
    }

    /**
     * Generate notification handlers
     */
    generateNotificationHandlers() {
        return `
// Push notification handler
self.addEventListener('push', event => {
    console.log('[Service Worker] Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from ${this.config.name}',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'notification-tag',
        requireInteraction: false,
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'close', title: 'Close' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('${this.config.name}', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('${this.config.startUrl}')
        );
    }
});`;
    }

    /**
     * Inject PWA code into HTML
     */
    injectPWACode() {
        let html = this.files.html;

        // Ensure viewport meta tag
        if (!html.toLowerCase().includes('viewport')) {
            html = html.replace(
                /<head>/i,
                '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
            );
        }

        // Add theme color
        const themeColorTag = `<meta name="theme-color" content="${this.config.themeColor}">`;
        if (!html.toLowerCase().includes('theme-color')) {
            html = html.replace(/<\/head>/i, `    ${themeColorTag}\n</head>`);
        }

        // Add manifest link
        const manifestLink = '<link rel="manifest" href="manifest.json">';
        if (!html.toLowerCase().includes('manifest')) {
            html = html.replace(/<\/head>/i, `    ${manifestLink}\n</head>`);
        }

        // Add apple-specific meta tags
        const appleMeta = `    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${this.config.shortName}">
    <link rel="apple-touch-icon" href="icons/icon-192x192.png">`;

        if (!html.toLowerCase().includes('apple-mobile-web-app')) {
            html = html.replace(/<\/head>/i, `${appleMeta}\n</head>`);
        }

        // Add service worker registration
        const swRegistration = `
    <script>
        // PWA Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('✓ Service Worker registered:', registration.scope);
                        
                        // Check for updates periodically
                        setInterval(() => {
                            registration.update();
                        }, 60000); // Check every minute
                    })
                    .catch(error => {
                        console.error('✗ Service Worker registration failed:', error);
                    });
            });
        }

        // PWA Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show custom install UI
            showInstallPromotion();
        });

        function showInstallPromotion() {
            // You can implement custom install UI here
            console.log('PWA install prompt available');
        }

        // Show install button (example)
        async function installPWA() {
            if (!deferredPrompt) {
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(\`User response to install prompt: \${outcome}\`);
            deferredPrompt = null;
        }

        // Track installation
        window.addEventListener('appinstalled', () => {
            console.log('✓ PWA installed successfully');
            deferredPrompt = null;
        });

        // Display mode detection
        function getPWADisplayMode() {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (document.referrer.startsWith('android-app://')) {
                return 'twa';
            } else if (navigator.standalone || isStandalone) {
                return 'standalone';
            }
            return 'browser';
        }

        console.log('Display mode:', getPWADisplayMode());
    </script>`;

        html = html.replace(/<\/body>/i, `${swRegistration}\n</body>`);

        return html;
    }

    /**
     * Enhance JavaScript with PWA features
     */
    enhanceJavaScript() {
        const pwaHelpers = `
// ============================================================================
// PWA Helper Functions (Auto-generated by PWA Converter)
// ============================================================================

/**
 * Check if app is running as PWA
 */
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

/**
 * Request persistent storage
 */
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        console.log(\`Persistent storage granted: \${isPersisted}\`);
        return isPersisted;
    }
    return false;
}

/**
 * Check storage quota
 */
async function checkStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
        console.log(\`Storage used: \${percentUsed}% (\${estimate.usage} / \${estimate.quota} bytes)\`);
        return estimate;
    }
    return null;
}

/**
 * Update online status
 */
function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    const statusClass = isOnline ? 'online' : 'offline';
    document.body.classList.remove('online', 'offline');
    document.body.classList.add(statusClass);
    console.log(\`App is \${statusClass}\`);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('connectionchange', { 
        detail: { online: isOnline } 
    }));
}

// Listen for online/offline events
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

/**
 * Share content using Web Share API
 */
async function shareContent(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            console.log('Content shared successfully');
            return true;
        } catch (error) {
            console.error('Error sharing:', error);
            return false;
        }
    } else {
        console.log('Web Share API not supported');
        return false;
    }
}

/**
 * Request notification permission
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return false;
    }

    const permission = await Notification.requestPermission();
    console.log(\`Notification permission: \${permission}\`);
    return permission === 'granted';
}

/**
 * Show local notification
 */
function showNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            ...options
        });
        return notification;
    }
    return null;
}

/**
 * Register background sync
 */
async function registerBackgroundSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in registration) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register(tag);
            console.log(\`Background sync registered: \${tag}\`);
            return true;
        } catch (error) {
            console.error('Background sync registration failed:', error);
            return false;
        }
    }
    return false;
}

// Initialize PWA features on load
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    requestPersistentStorage();
    checkStorageQuota();
    
    console.log('PWA features initialized');
    console.log('Running as PWA:', isPWA());
});

// ============================================================================
// Original Application Code
// ============================================================================

`;

        return pwaHelpers + (this.files.js || '');
    }

    /**
     * Generate offline fallback page
     */
    generateOfflinePage() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - ${this.config.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, ${this.config.backgroundColor} 0%, ${this.config.themeColor} 100%);
            color: #333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }

        .offline-container {
            text-align: center;
            max-width: 500px;
            background: white;
            padding: 3rem 2rem;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .offline-icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }

        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #212121;
        }

        p {
            color: #757575;
            margin-bottom: 2rem;
            line-height: 1.6;
        }

        .retry-btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: ${this.config.themeColor};
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .connection-status {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 0.875rem;
            color: #757575;
        }

        .online {
            display: none;
        }

        body.online .offline {
            display: none;
        }

        body.online .online {
            display: block;
        }
    </style>
</head>
<body class="offline">
    <div class="offline-container">
        <div class="offline-icon">📡</div>
        <div class="offline">
            <h1>You're Offline</h1>
            <p>It looks like you've lost your internet connection. Don't worry, ${this.config.name} will work again once you're back online.</p>
            <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
        <div class="online">
            <h1>You're Back Online!</h1>
            <p>Your connection has been restored.</p>
            <a href="/" class="retry-btn">Return to App</a>
        </div>
        <div class="connection-status">
            Connection status: <strong id="status">Checking...</strong>
        </div>
    </div>

    <script>
        function updateStatus() {
            const status = document.getElementById('status');
            const isOnline = navigator.onLine;
            
            document.body.classList.toggle('online', isOnline);
            status.textContent = isOnline ? 'Connected' : 'Disconnected';
            status.style.color = isOnline ? '#4CAF50' : '#f44336';
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    </script>
</body>
</html>`;
    }

    /**
     * Generate icons from uploaded image
     */
    async generateIcons() {
        const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
        this.generatedFiles.icons = {};
        let generated = 0;

        for (const size of sizes) {
            this.updateLoadingStatus(`Generating ${size}x${size} icon...`);
            const blob = await this.resizeImage(this.files.icon.dataUrl, size, size);
            this.generatedFiles.icons[`icon-${size}x${size}.png`] = blob;
            generated++;
            await this.delay(100);
        }

        return generated;
    }

    /**
     * Generate default icons (colored squares with text)
     */
    async generateDefaultIcons() {
        const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
        this.generatedFiles.icons = {};

        for (const size of sizes) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, this.config.themeColor);
            gradient.addColorStop(1, this.adjustColor(this.config.themeColor, -30));
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // Draw text
            const firstLetter = this.config.shortName.charAt(0).toUpperCase();
            ctx.fillStyle = 'white';
            ctx.font = `bold ${size * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(firstLetter, size / 2, size / 2);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            this.generatedFiles.icons[`icon-${size}x${size}.png`] = blob;
        }
    }

    /**
     * Resize image to specified dimensions
     */
    resizeImage(dataUrl, width, height) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Draw image centered and scaled
                const scale = Math.max(width / img.width, height / img.height);
                const x = (width / 2) - (img.width / 2) * scale;
                const y = (height / 2) - (img.height / 2) * scale;

                ctx.fillStyle = this.config.backgroundColor;
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                canvas.toBlob(resolve, 'image/png');
            };
            img.src = dataUrl;
        });
    }

    /**
     * Adjust color brightness
     */
    adjustColor(color, amount) {
        const clamp = (num) => Math.min(Math.max(num, 0), 255);
        const num = parseInt(color.slice(1), 16);
        const r = clamp((num >> 16) + amount);
        const g = clamp(((num >> 8) & 0x00FF) + amount);
        const b = clamp((num & 0x0000FF) + amount);
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Show download section with file info
     */
    showDownloadSection() {
        // Show optional download buttons
        if (this.generatedFiles.css) {
            document.getElementById('css-download').style.display = 'flex';
            document.getElementById('size-css').textContent = 
                this.formatFileSize(new Blob([this.generatedFiles.css]).size);
        }
        
        if (this.generatedFiles.js) {
            document.getElementById('js-download').style.display = 'flex';
            document.getElementById('size-js').textContent = 
                this.formatFileSize(new Blob([this.generatedFiles.js]).size);
        }

        if (this.generatedFiles.offline) {
            document.getElementById('offline-download').style.display = 'flex';
            document.getElementById('size-offline').textContent = 
                this.formatFileSize(new Blob([this.generatedFiles.offline]).size);
        }

        // Update file sizes
        document.getElementById('size-html').textContent = 
            this.formatFileSize(new Blob([this.generatedFiles.html]).size);
        document.getElementById('size-manifest').textContent = 
            this.formatFileSize(new Blob([this.generatedFiles.manifest]).size);
        document.getElementById('size-sw').textContent = 
            this.formatFileSize(new Blob([this.generatedFiles.serviceWorker]).size);

        // Update statistics
        let filesCount = 3; // HTML, manifest, SW
        if (this.generatedFiles.css) filesCount++;
        if (this.generatedFiles.js) filesCount++;
        if (this.generatedFiles.offline) filesCount++;

        const iconsCount = Object.keys(this.generatedFiles.icons || {}).length;

        document.getElementById('files-generated').textContent = filesCount;
        document.getElementById('icons-generated').textContent = iconsCount;
    }

    /**
     * Download individual file
     */
    downloadFile(filename) {
        let content, mimeType;

        switch (filename) {
            case 'index.html':
                content = this.generatedFiles.html;
                mimeType = 'text/html';
                break;
            case 'manifest.json':
                content = this.generatedFiles.manifest;
                mimeType = 'application/json';
                break;
            case 'sw.js':
                content = this.generatedFiles.serviceWorker;
                mimeType = 'application/javascript';
                break;
            case 'style.css':
                content = this.generatedFiles.css;
                mimeType = 'text/css';
                break;
            case 'script.js':
                content = this.generatedFiles.js;
                mimeType = 'application/javascript';
                break;
            case 'offline.html':
                content = this.generatedFiles.offline;
                mimeType = 'text/html';
                break;
            default:
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        this.triggerDownload(blob, filename);
        this.showToast(`Downloaded ${filename}`, 'success');
    }

    /**
     * Download all files as ZIP
     */
    async downloadAll() {
        this.showLoading('Creating ZIP file...');

        try {
            const zip = new JSZip();

            // Add main files
            zip.file('index.html', this.generatedFiles.html);
            zip.file('manifest.json', this.generatedFiles.manifest);
            zip.file('sw.js', this.generatedFiles.serviceWorker);

            if (this.generatedFiles.css) {
                zip.file('style.css', this.generatedFiles.css);
            }
            if (this.generatedFiles.js) {
                zip.file('script.js', this.generatedFiles.js);
            }
            if (this.generatedFiles.offline) {
                zip.file('offline.html', this.generatedFiles.offline);
            }

            // Add icons
            if (this.generatedFiles.icons) {
                const iconsFolder = zip.folder('icons');
                for (const [filename, blob] of Object.entries(this.generatedFiles.icons)) {
                    iconsFolder.file(filename, blob);
                }
            }

            // Add README
            const readme = this.generateReadme();
            zip.file('README.md', readme);

            // Generate ZIP
            this.updateLoadingStatus('Compressing files...');
            const content = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });

            this.hideLoading();

            // Download
            const filename = `${this.config.shortName.toLowerCase().replace(/\s+/g, '-')}-pwa.zip`;
            this.triggerDownload(content, filename);
            this.showToast('All files downloaded successfully!', 'success');

        } catch (error) {
            this.hideLoading();
            this.showToast(`Error creating ZIP: ${error.message}`, 'error');
            console.error('ZIP creation error:', error);
        }
    }

    /**
     * Generate README.md file
     */
    generateReadme() {
        const hasOptionalFiles = this.generatedFiles.css || this.generatedFiles.js;
        
        return `# ${this.config.name}

Generated by **PWA Converter** - Transform web apps into Progressive Web Apps

## 📦 Package Contents

This package contains all the files needed to deploy your Progressive Web App:

### Core Files
- \`index.html\` - Main HTML file with PWA integration
- \`manifest.json\` - PWA manifest configuration
- \`sw.js\` - Service Worker for offline support and caching
${this.generatedFiles.css ? '- `style.css` - Application styles\n' : ''}${this.generatedFiles.js ? '- `script.js` - Application logic with PWA enhancements\n' : ''}${this.generatedFiles.offline ? '- `offline.html` - Offline fallback page\n' : ''}
### Assets
- \`icons/\` - App icons in multiple resolutions (72px to 512px)
  - icon-72x72.png
  - icon-96x96.png
  - icon-128x128.png
  - icon-144x144.png
  - icon-152x152.png
  - icon-192x192.png
  - icon-384x384.png
  - icon-512x512.png

## ⚙️ Configuration

**App Name:** ${this.config.name}  
**Short Name:** ${this.config.shortName}  
**Display Mode:** ${this.config.display}  
**Theme Color:** ${this.config.themeColor}  
**Background Color:** ${this.config.backgroundColor}  
**Cache Strategy:** ${this.config.cacheStrategy}  
**Offline Support:** ${this.config.enableOffline ? 'Enabled' : 'Disabled'}  
**Push Notifications:** ${this.config.enableNotifications ? 'Enabled' : 'Disabled'}

## 🚀 Installation Steps

### 1. Extract Files
Extract all files from this ZIP archive to your project directory.

### 2. File Structure
Maintain the following structure:
\`\`\`
your-project/
├── index.html
├── manifest.json
├── sw.js${this.generatedFiles.css ? '\n├── style.css' : ''}${this.generatedFiles.js ? '\n├── script.js' : ''}${this.generatedFiles.offline ? '\n├── offline.html' : ''}
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png
\`\`\`

### 3. Deploy with HTTPS
**Important:** PWAs require HTTPS to function properly.

#### Option A: Free Hosting Services
- **Netlify**: Drag & drop deployment at https://www.netlify.com/drop
- **Vercel**: Git-based deployment at https://vercel.com
- **GitHub Pages**: Free hosting at https://pages.github.com
- **Firebase Hosting**: Google's platform at https://firebase.google.com/docs/hosting

#### Option B: Your Own Server
Ensure your web server is configured with:
- Valid SSL certificate (Let's Encrypt is free)
- Proper MIME types for all files
- Service Worker scope permissions

### 4. Test Your PWA

#### Browser Testing
1. Open Chrome DevTools (F12)
2. Navigate to the **Application** tab
3. Check:
   - Service Worker is registered and running
   - Manifest is detected and valid
   - Cache Storage contains expected files

#### Lighthouse Audit
1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select "Progressive Web App" category
4. Click "Generate report"
5. Aim for a score of 90+

### 5. Install on Devices

#### Desktop (Chrome/Edge)
- Look for install icon in address bar
- Click to install as desktop app

#### Mobile (Android)
- Tap browser menu
- Select "Add to Home Screen"
- Follow prompts

#### Mobile (iOS)
- Tap Share button
- Select "Add to Home Screen"
- Confirm installation

## 🔧 Customization

### Updating Icons
Replace files in the \`icons/\` directory with your own icons. Maintain the same sizes and filenames.

### Modifying Cache Strategy
Edit \`sw.js\` and change the caching logic in the fetch event listener. Current strategy: **${this.config.cacheStrategy}**

### Adding More Files to Cache
Edit the \`urlsToCache\` array in \`sw.js\`:
\`\`\`javascript
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // Add your files here
];
\`\`\`

### Updating Manifest
Edit \`manifest.json\` to change:
- App name and description
- Theme and background colors
- Display mode and orientation
- Start URL and scope

## 📱 PWA Features

### ✅ Included Features
- **Offline Support**: App works without internet connection
- **Installable**: Can be installed on home screen
- **Responsive**: Works on all device sizes
- **Fast Loading**: Cached resources load instantly
- **App-like Experience**: Runs in standalone window${this.config.enableNotifications ? '\n- **Push Notifications**: Supports web push notifications' : ''}${this.config.enableOffline ? '\n- **Offline Fallback**: Custom offline page' : ''}

### 🔜 Optional Enhancements
- Background sync for offline actions
- Web push notifications server
- App shortcuts and share target
- File handling capabilities
- Periodic background sync

## 🐛 Troubleshooting

### Service Worker Not Registering
- Ensure you're serving over HTTPS (or localhost)
- Check browser console for errors
- Verify file paths are correct
- Clear browser cache and hard reload

### App Not Installable
- Run Lighthouse audit to check requirements
- Verify manifest.json is valid
- Ensure all required icons exist
- Check for HTTPS deployment

### Icons Not Displaying
- Verify icon files exist in \`icons/\` directory
- Check file sizes and formats (PNG required)
- Clear cache and reload
- Validate manifest.json icon paths

### Offline Mode Not Working
- Check Service Worker is active
- Verify cache strategy in sw.js
- Ensure cached files exist
- Test in airplane mode

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox (Advanced Caching)](https://developers.google.com/web/tools/workbox)

## 🤝 Support

For issues or questions:
- Review the troubleshooting section above
- Check browser console for errors
- Validate your deployment meets PWA requirements
- Test with Lighthouse in Chrome DevTools

## 📄 License

This PWA was generated using PWA Converter. The generated code is yours to use, modify, and distribute as needed.

---

**Generated on:** ${new Date().toLocaleString()}  
**PWA Converter Version:** 1.0.0  

Happy building! 🚀
`;
    }

    /**
     * Trigger file download
     */
    triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Show loading overlay
     */
    showLoading(message) {
        const overlay = document.getElementById('loading-overlay');
        const text = document.querySelector('.loading-text');
        text.textContent = message;
        overlay.style.display = 'flex';
    }

    /**
     * Update loading status
     */
    updateLoadingStatus(status) {
        const statusElement = document.getElementById('loading-status');
        statusElement.textContent = status;
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ'
        };
        
        toast.textContent = `${icons[type]} ${message}`;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset application
     */
    reset() {
        // Clear files
        this.files = { html: null, css: null, js: null, icon: null };
        this.config = {};
        this.generatedFiles = {};

        // Reset all file inputs
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.value = '';
        });

        // Reset all status messages
        document.querySelectorAll('.file-status').forEach(status => {
            status.textContent = '';
            status.className = 'file-status';
        });

        // Reset all file info
        document.querySelectorAll('.file-info').forEach(info => {
            info.textContent = '';
            info.className = 'file-info';
        });

        // Reset form
        document.getElementById('pwa-config-form').reset();

        // Reset color inputs
        document.getElementById('theme-color').value = '#2196F3';
        document.getElementById('theme-color-text').value = '#2196F3';
        document.getElementById('background-color').value = '#ffffff';
        document.getElementById('background-color-text').value = '#FFFFFF';

        // Hide download buttons
        document.getElementById('css-download').style.display = 'none';
        document.getElementById('js-download').style.display = 'none';
        document.getElementById('offline-download').style.display = 'none';

        // Disable next button
        document.getElementById('next-to-config').disabled = true;

        // Show upload section
        this.showSection('upload');

        this.showToast('Application reset', 'info');
    }
}

// ============================================================================
// Initialize Application
// ============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaConverter = new PWAConverter();
    });
} else {
    window.pwaConverter = new PWAConverter();
}

// Log initialization
console.log('%c🚀 PWA Converter', 'font-size: 20px; font-weight: bold; color: #2196F3;');
console.log('%cReady to transform your web app into a PWA!', 'font-size: 14px; color: #757575;');