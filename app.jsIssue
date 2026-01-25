/**
 * PWA Converter - Main Application Logic
 * Converts standard web applications into Progressive Web Apps
 * FOLDER UPLOAD VERSION - Preserves entire folder structure
 * 
 * @version 2.0.1
 * @author PWA Converter Team
 */

'use strict';

// ============================================================================
// PWAConverter Class - Main Application Controller
// ============================================================================

class PWAConverter {
    constructor() {
        // File storage - UPDATED for folder upload
        this.files = {
            folderName: null,           // Original folder name
            sanitizedName: null,        // Sanitized folder name for URLs
            allFiles: [],               // Array of all files from folder
            totalSize: 0,               // Total folder size
            
            // Quick references to important files
            index: null,                // index.html content
            css: null,                  // CSS file content (if exists)
            js: null,                   // JavaScript content (if exists)
            
            // Separate icon upload (kept as before)
            icon: null                  // App icon for generation
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
        console.log('PWA Converter initialized successfully (v2.0.1 - Folder Upload)');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Folder upload handler (NEW)
        document.getElementById('folder-input').addEventListener('change', (e) => 
            this.handleFolderUpload(e));

        // Icon upload handler (kept separate)
        document.getElementById('icon-file').addEventListener('change', (e) => 
            this.handleIconUpload(e));

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

        // Download button
        document.getElementById('download-all').addEventListener('click', () => 
            this.downloadAll());

        // Auto-generate short name from app name
        document.getElementById('app-name').addEventListener('input', (e) => {
            const shortNameInput = document.getElementById('short-name');
            if (!shortNameInput.value || shortNameInput.value === '') {
                shortNameInput.value = e.target.value.substring(0, 12);
            }
        });

        // Auto-generate app ID from short name
        document.getElementById('short-name').addEventListener('input', (e) => {
            const appIdInput = document.getElementById('app-id');
            if (!appIdInput.dataset.userModified) {
                const appId = this.sanitizeFolderName(e.target.value) + '-id';
                appIdInput.value = appId;
            }
        });

        // Update start URL and scope when folder name changes
        document.getElementById('folder-name').addEventListener('input', (e) => {
            this.updateUrlFields(e.target.value);
        });

        // Track manual modifications to prevent auto-updates
        ['app-id', 'start-url', 'scope'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('focus', () => {
                    field.dataset.userModified = 'true';
                });
            }
        });
    }

    /**
     * Handle folder upload (NEW MAIN FUNCTION)
     */
    async handleFolderUpload(event) {
        const files = Array.from(event.target.files);
        
        if (files.length === 0) {
            return;
        }

        const statusElement = document.getElementById('folder-status');
        const infoElement = document.getElementById('folder-info');
        const contentsElement = document.getElementById('folder-contents');
        const treeElement = document.getElementById('folder-tree');

        statusElement.textContent = 'Processing folder...';
        statusElement.className = 'file-status';

        try {
            // Extract folder name from first file
            const folderPath = files[0].webkitRelativePath || files[0].name;
            const folderName = folderPath.split('/')[0];
            
            this.files.folderName = folderName;
            this.files.sanitizedName = this.sanitizeFolderName(folderName);

            // Calculate total size
            this.files.totalSize = files.reduce((sum, file) => sum + file.size, 0);

            // Check folder size limits
            const maxSize = 100 * 1024 * 1024; // 100MB
            const warnSize = 50 * 1024 * 1024; // 50MB

            if (this.files.totalSize > maxSize) {
                throw new Error(`Folder too large (${this.formatFileSize(this.files.totalSize)}). Maximum size is 100MB.`);
            }

            if (this.files.totalSize > warnSize) {
                statusElement.textContent = `⚠ Warning: Large folder (${this.formatFileSize(this.files.totalSize)}). Processing may take time...`;
                statusElement.className = 'file-status warning';
                await this.delay(1000);
            }

            // Process all files
            await this.processAllFiles(files);

            // Validate folder structure
            this.validateFolderStructure();

            // Auto-fill configuration fields
            this.autoFillConfiguration();

            // Show success status
            statusElement.textContent = `✓ Folder "${folderName}" loaded successfully (${files.length} files, ${this.formatFileSize(this.files.totalSize)})`;
            statusElement.className = 'file-status success';

            // Show folder info
            infoElement.textContent = `Total: ${files.length} files in ${this.countFolders(files)} folders`;
            infoElement.className = 'file-info visible';

            // Display folder tree
            this.displayFolderTree(files, treeElement);
            contentsElement.style.display = 'block';

            // Enable next button
            document.getElementById('next-to-config').disabled = false;

            this.showToast(`Folder "${folderName}" uploaded successfully!`, 'success');

        } catch (error) {
            statusElement.textContent = `✗ Error: ${error.message}`;
            statusElement.className = 'file-status error';
            this.files = {
                folderName: null,
                sanitizedName: null,
                allFiles: [],
                totalSize: 0,
                index: null,
                css: null,
                js: null,
                icon: null
            };
            infoElement.className = 'file-info';
            contentsElement.style.display = 'none';
            document.getElementById('next-to-config').disabled = true;
            this.showToast(`Failed to upload folder: ${error.message}`, 'error');
            console.error('Folder upload error:', error);
        }
    }

    /**
     * Process all files from folder
     */
    async processAllFiles(files) {
        this.files.allFiles = [];
        
        for (const file of files) {
            const relativePath = this.getRelativePath(file);
            
            // Store file info
            const fileInfo = {
                path: relativePath,
                blob: file,
                type: file.type || this.guessFileType(relativePath),
                size: file.size,
                name: file.name
            };

            this.files.allFiles.push(fileInfo);

            // Read important files
            if (relativePath === 'index.html') {
                this.files.index = {
                    path: relativePath,
                    content: await this.readTextFile(file),
                    blob: file
                };
            } else if (relativePath.endsWith('.css') && !this.files.css) {
                // Store first CSS file found
                this.files.css = {
                    path: relativePath,
                    content: await this.readTextFile(file),
                    blob: file
                };
            } else if (relativePath.endsWith('.js') && !this.files.js) {
                // Store first JS file found (excluding node_modules, etc.)
                if (!relativePath.includes('node_modules') && !relativePath.includes('dist')) {
                    this.files.js = {
                        path: relativePath,
                        content: await this.readTextFile(file),
                        blob: file
                    };
                }
            }
        }
    }

    /**
     * Get relative path from file
     */
    getRelativePath(file) {
        const fullPath = file.webkitRelativePath || file.name;
        const parts = fullPath.split('/');
        // Remove first part (folder name) to get relative path
        return parts.slice(1).join('/');
    }

    /**
     * Guess file type from extension
     */
    guessFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'txt': 'text/plain',
            'xml': 'application/xml'
        };
        return types[ext] || 'application/octet-stream';
    }

    /**
     * Validate folder structure
     */
    validateFolderStructure() {
        // Check if index.html exists in root
        if (!this.files.index) {
            throw new Error('index.html not found in folder root. Please make sure index.html is in the root of your selected folder.');
        }

        // Validate HTML content
        if (!this.validateHTML(this.files.index.content)) {
            throw new Error('index.html appears to be invalid. Please check your HTML file.');
        }
    }

    /**
     * Validate HTML content
     */
    validateHTML(content) {
        const lower = content.toLowerCase();
        return lower.includes('<!doctype') || lower.includes('<html');
    }

    /**
     * Count folders in file list
     */
    countFolders(files) {
        const folders = new Set();
        files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            for (let i = 0; i < parts.length - 1; i++) {
                folders.add(parts.slice(0, i + 2).join('/'));
            }
        });
        return folders.size;
    }

    /**
     * Display folder tree
     */
    displayFolderTree(files, container) {
        const tree = this.buildFileTree(files);
        container.innerHTML = this.renderFileTree(tree, 0);
    }

    /**
     * Build file tree structure
     */
    buildFileTree(files) {
        const tree = {};
        
        files.forEach(file => {
            const path = this.getRelativePath(file);
            const parts = path.split('/');
            
            let current = tree;
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    // It's a file
                    if (!current._files) current._files = [];
                    current._files.push({ name: part, path: path, file: file });
                } else {
                    // It's a folder
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });
        
        return tree;
    }

    /**
     * Render file tree as HTML
     */
    renderFileTree(tree, level) {
        let html = '';
        const indent = '  '.repeat(level);
        
        // Render folders first
        Object.keys(tree).forEach(key => {
            if (key !== '_files') {
                html += `<div class="folder-tree-item subfolder" style="padding-left: ${level * 1.5}rem">`;
                html += `<span class="folder-tree-icon">📁</span> ${key}/`;
                html += `</div>`;
                html += this.renderFileTree(tree[key], level + 1);
            }
        });
        
        // Render files
        if (tree._files) {
            tree._files.forEach(fileInfo => {
                const isImportant = fileInfo.name === 'index.html' || 
                                   fileInfo.name.endsWith('.css') || 
                                   fileInfo.name.endsWith('.js');
                const className = isImportant ? 'folder-tree-item file important' : 'folder-tree-item file';
                html += `<div class="${className}" style="padding-left: ${level * 1.5}rem">`;
                html += `<span class="folder-tree-icon">${this.getFileIcon(fileInfo.name)}</span> ${fileInfo.name}`;
                html += `</div>`;
            });
        }
        
        return html;
    }

    /**
     * Get icon for file type
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'html': '📄',
            'css': '🎨',
            'js': '⚡',
            'json': '📋',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'gif': '🖼️',
            'svg': '🖼️',
            'mp3': '🎵',
            'wav': '🎵',
            'ogg': '🎵',
            'mp4': '🎬',
            'webm': '🎬',
            'txt': '📝',
            'md': '📝'
        };
        return icons[ext] || '📄';
    }

    /**
     * Sanitize folder name for use in URLs
     */
    sanitizeFolderName(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // Replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '')     // Remove special characters
            .replace(/-+/g, '-')            // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
    }

    /**
     * Auto-fill configuration from folder and files
     */
    autoFillConfiguration() {
        // Set folder name (read-only)
        document.getElementById('folder-name').value = this.files.sanitizedName;

        // Generate App ID
        document.getElementById('app-id').value = this.files.sanitizedName + '-id';

        // Update URL fields
        this.updateUrlFields(this.files.sanitizedName);

        // Extract metadata from HTML
        if (this.files.index) {
            this.extractMetadata(this.files.index.content);
        }

        // Show sanitization info if name was changed
        if (this.files.folderName !== this.files.sanitizedName) {
            this.showToast(
                `Folder name sanitized: "${this.files.folderName}" → "${this.files.sanitizedName}"`, 
                'info'
            );
        }
    }

    /**
     * Update URL fields based on folder name
     */
    updateUrlFields(folderName) {
        if (!folderName) return;

        const startUrlInput = document.getElementById('start-url');
        const scopeInput = document.getElementById('scope');

        // Only update if user hasn't manually modified these fields
        if (!startUrlInput.dataset.userModified) {
            startUrlInput.value = `/${folderName}/`;
        }

        if (!scopeInput.dataset.userModified) {
            scopeInput.value = `/${folderName}/`;
        }
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
            
            const shortName = title.substring(0, 12);
            if (!document.getElementById('short-name').value) {
                document.getElementById('short-name').value = shortName;
            }
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
        if (descMatch && !document.getElementById('description').value) {
            document.getElementById('description').value = descMatch[1];
        }
    }

    /**
     * Handle icon upload (kept separate as before)
     */
    async handleIconUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const statusElement = document.getElementById('icon-status');
        const infoElement = document.getElementById('icon-info');

        statusElement.textContent = 'Processing...';
        statusElement.className = 'file-status';

        try {
            this.files.icon = await this.processIcon(file);

            statusElement.textContent = `✓ ${file.name} loaded successfully`;
            statusElement.className = 'file-status success';

            infoElement.textContent = `Size: ${this.formatFileSize(file.size)} | ${this.files.icon.width}x${this.files.icon.height}`;
            infoElement.className = 'file-info visible';

            this.showToast(`Icon ${file.name} uploaded successfully`, 'success');

        } catch (error) {
            statusElement.textContent = `✗ Error: ${error.message}`;
            statusElement.className = 'file-status error';
            this.files.icon = null;
            infoElement.className = 'file-info';
            this.showToast(`Failed to upload icon: ${error.message}`, 'error');
        }
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
     * Read file as text
     */
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
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
            'cache-first': 'Serves cached content immediately, updates cache in background (fastest, may show stale content). All your files will be cached.',
            'network-first': 'Always tries network first, falls back to cache if offline (fresh content, slower). All your files will be cached.',
            'stale-while-revalidate': 'Serves cached content while fetching updates in background (balanced approach). All your files will be cached.'
        };

        cacheStrategy.addEventListener('change', (e) => {
            description.textContent = descriptions[e.target.value];
        });
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
                appId: document.getElementById('app-id').value,
                folderName: document.getElementById('folder-name').value,
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

            // Process JavaScript if exists
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
                this.updateLoadingStatus('Generating app icons from uploaded image...');
                await this.generateIcons();
            } else {
                this.updateLoadingStatus('Creating default app icons...');
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
            id: this.config.appId,
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

        // Add categories
        manifest.categories = ['utilities', 'productivity'];

        return JSON.stringify(manifest, null, 2);
    }

    /**
     * Generate service worker with ALL user files
     */
    generateServiceWorker() {
        const cacheName = `${this.config.folderName}-v1`;
        
        // Build URLs to cache - include ALL user files
        const urlsToCache = [
            this.config.startUrl,
            `${this.config.startUrl}index.html`,
            `${this.config.startUrl}manifest.json`
        ];

        // Add all user files to cache
        this.files.allFiles.forEach(file => {
            urlsToCache.push(`${this.config.startUrl}${file.path}`);
        });

        // Add offline page if enabled
        if (this.config.enableOffline) {
            urlsToCache.push(`${this.config.startUrl}offline.html`);
        }

        const cacheStrategies = {
            'cache-first': this.generateCacheFirstStrategy(),
            'network-first': this.generateNetworkFirstStrategy(),
            'stale-while-revalidate': this.generateStaleWhileRevalidateStrategy()
        };

        return `/**
 * Service Worker for ${this.config.name}
 * Generated by PWA Converter v2.0.1
 * Cache Strategy: ${this.config.cacheStrategy}
 * Folder: ${this.config.folderName}
 * Total Files Cached: ${urlsToCache.length}
 */

const CACHE_NAME = '${cacheName}';
const OFFLINE_URL = '${this.config.enableOffline ? `${this.config.startUrl}offline.html` : ''}';

const urlsToCache = ${JSON.stringify(urlsToCache, null, 2)};

// Install event - cache ALL resources
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing for ${this.config.name}...');
    console.log('[Service Worker] Caching ${urlsToCache.length} files...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell and all files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[Service Worker] All files cached successfully');
                return self.skipWaiting();
            })
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

console.log('[Service Worker] Loaded successfully for ${this.config.name}');
console.log('[Service Worker] Scope: ${this.config.scope}');
console.log('[Service Worker] Caching ${urlsToCache.length} files including all your assets');`;
    }

    /**
     * Generate cache-first strategy
     */
    generateCacheFirstStrategy() {
        return `    // Cache First Strategy - Serves cached content immediately
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
        return `    // Network First Strategy - Always tries network first
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
        return `    // Stale While Revalidate Strategy - Balanced approach
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
        icon: '${this.config.startUrl}icons/icon-192x192.png',
        badge: '${this.config.startUrl}icons/icon-72x72.png',
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
     * Inject PWA code into HTML - RELATIVE PATHS
     */
    injectPWACode() {
        let html = this.files.index.content;

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

        // Add manifest link - RELATIVE PATH
        const manifestLink = '<link rel="manifest" href="manifest.json">';
        if (!html.toLowerCase().includes('manifest')) {
            html = html.replace(/<\/head>/i, `    ${manifestLink}\n</head>`);
        }

        // Add apple-specific meta tags - RELATIVE PATHS
        const appleMeta = `    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${this.config.shortName}">
    <link rel="apple-touch-icon" href="icons/icon-192x192.png">`;

        if (!html.toLowerCase().includes('apple-mobile-web-app')) {
            html = html.replace(/<\/head>/i, `${appleMeta}\n</head>`);
        }

        // Add service worker registration - RELATIVE PATH
        const swRegistration = `
    <script>
        // PWA Service Worker Registration
        // Generated by PWA Converter v2.0.1
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                // Use RELATIVE path for service worker (works with multi-app setup)
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('✓ Service Worker registered:', registration.scope);
                        console.log('✓ Service Worker URL:', registration.active ? registration.active.scriptURL : 'installing...');
                        console.log('✓ App: ${this.config.name}');
                        console.log('✓ Folder: ${this.config.folderName}');
                        console.log('✓ Total files cached: ${this.files.allFiles.length + 3}'); // +3 for manifest, sw, offline
                        
                        // Check for updates periodically
                        setInterval(() => {
                            registration.update();
                        }, 60000); // Check every minute
                    })
                    .catch(error => {
                        console.error('✗ Service Worker registration failed:', error);
                    });
            });
        } else {
            console.warn('⚠ Service Workers not supported in this browser');
        }

        // PWA Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('💡 PWA install prompt available');
            // Show custom install UI
            showInstallPromotion();
        });

        function showInstallPromotion() {
            // You can implement custom install UI here
            console.log('📱 App can be installed - Click browser menu or use custom UI');
        }

        // Install PWA function (call from your custom install button)
        async function installPWA() {
            if (!deferredPrompt) {
                console.log('❌ Install prompt not available');
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(\`User response to install prompt: \${outcome}\`);
            deferredPrompt = null;
        }

        // Track installation
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installed successfully!');
            console.log('✅ App: ${this.config.name}');
            console.log('✅ App ID: ${this.config.appId}');
            console.log('✅ Folder: ${this.config.folderName}');
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

        const displayMode = getPWADisplayMode();
        console.log('🖥️ Display mode:', displayMode);
        
        // Log PWA configuration
        console.log('⚙️ PWA Configuration:');
        console.log('  - App Name: ${this.config.name}');
        console.log('  - App ID: ${this.config.appId}');
        console.log('  - Start URL: ${this.config.startUrl}');
        console.log('  - Scope: ${this.config.scope}');
        console.log('  - Folder: ${this.config.folderName}');
        console.log('  - Files included: ${this.files.allFiles.length}');
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
// PWA Helper Functions (Auto-generated by PWA Converter v2.0.1)
// App: ${this.config.name}
// Folder: ${this.config.folderName}
// Files: ${this.files.allFiles.length}
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
            icon: '${this.config.startUrl}icons/icon-192x192.png',
            badge: '${this.config.startUrl}icons/icon-72x72.png',
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
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
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
    
    console.log('🚀 PWA features initialized for ${this.config.name}');
    console.log('📱 Running as PWA:', isPWA());
    console.log('📂 App folder: ${this.config.folderName}');
    console.log('📦 Total files: ${this.files.allFiles.length}');
});

// ============================================================================
// Original Application Code
// ============================================================================

`;

        return pwaHelpers + (this.files.js ? this.files.js.content : '');
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
            border: none;
            cursor: pointer;
            font-size: 1rem;
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
            <a href="${this.config.startUrl}" class="retry-btn">Return to App</a>
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
        
        console.log('Offline page loaded for ${this.config.name}');
        console.log('Folder: ${this.config.folderName}');
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
     * FIXED: Changed const to let to allow totalFiles increment
     */
    showDownloadSection() {
        // Update statistics - FIXED: Changed const to let
        let totalFiles = this.files.allFiles.length + 3; // +3 for manifest, sw, README
        
        // Now we can safely increment
        if (this.generatedFiles.offline) {
            totalFiles++;
        }
        
        const iconsCount = Object.keys(this.generatedFiles.icons || {}).length;
        const foldersCount = this.countUniqueFolders();

        document.getElementById('files-generated').textContent = totalFiles + iconsCount;
        document.getElementById('icons-generated').textContent = iconsCount;
        document.getElementById('folders-preserved').textContent = foldersCount;

        // Update folder URL display
        document.getElementById('folder-url-display').textContent = this.config.folderName;
    }

    /**
     * Count unique folders in file list
     */
    countUniqueFolders() {
        const folders = new Set();
        this.files.allFiles.forEach(file => {
            const parts = file.path.split('/');
            for (let i = 0; i < parts.length - 1; i++) {
                folders.add(parts.slice(0, i + 1).join('/'));
            }
        });
        return folders.size;
    }

    /**
     * Download all files as ZIP
     */
    async downloadAll() {
        this.showLoading('Creating ZIP file...');

        try {
            const zip = new JSZip();

            // Add all USER files (preserve structure)
            this.updateLoadingStatus('Adding your files...');
            for (const file of this.files.allFiles) {
                if (file.path === 'index.html') {
                    // Use modified HTML with PWA code
                    zip.file('index.html', this.generatedFiles.html);
                } else if (this.files.js && file.path === this.files.js.path) {
                    // Use enhanced JavaScript
                    zip.file(file.path, this.generatedFiles.js);
                } else {
                    // Copy file as-is (preserve everything!)
                    zip.file(file.path, file.blob);
                }
            }

            // Add PWA generated files
            this.updateLoadingStatus('Adding PWA files...');
            zip.file('manifest.json', this.generatedFiles.manifest);
            zip.file('sw.js', this.generatedFiles.serviceWorker);

            if (this.generatedFiles.offline) {
                zip.file('offline.html', this.generatedFiles.offline);
            }

            // Add icons
            this.updateLoadingStatus('Adding icons...');
            if (this.generatedFiles.icons) {
                const iconsFolder = zip.folder('icons');
                for (const [filename, blob] of Object.entries(this.generatedFiles.icons)) {
                    iconsFolder.file(filename, blob);
                }
            }

            // Add README
            this.updateLoadingStatus('Generating README...');
            const readme = this.generateReadme();
            zip.file('README.md', readme);

            // Generate ZIP
            this.updateLoadingStatus('Compressing files...');
            const content = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            }, (metadata) => {
                const percent = metadata.percent.toFixed(0);
                this.updateLoadingStatus(`Compressing... ${percent}%`);
            });

            this.hideLoading();

            // Download
            const filename = `${this.config.folderName}-pwa.zip`;
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
        const filesList = this.files.allFiles
            .slice(0, 20) // Show first 20 files
            .map(f => `- ${f.path}`)
            .join('\n');
        const moreFiles = this.files.allFiles.length > 20 ? `\n- ... and ${this.files.allFiles.length - 20} more files` : '';

        return `# ${this.config.name}

Generated by **PWA Converter v2.0.1** - Folder Upload Edition

## 📦 Package Contents

This package contains **${this.files.allFiles.length + (this.generatedFiles.offline ? 4 : 3)}** files total:

### Your Original Files (${this.files.allFiles.length} files preserved)
${filesList}${moreFiles}

### PWA Generated Files
- \`manifest.json\` - PWA manifest configuration
- \`sw.js\` - Service Worker (caches ALL ${this.files.allFiles.length} files!)
- \`icons/\` - 8 app icons (72px to 512px)
${this.generatedFiles.offline ? '- `offline.html` - Offline fallback page\n' : ''}- \`README.md\` - This file

### Enhanced Files
- \`index.html\` - Your HTML with PWA code injected
${this.files.js ? '- `' + this.files.js.path + '` - Your JS enhanced with PWA helpers\n' : ''}

## ⚙️ Configuration

**App Name:** ${this.config.name}  
**Short Name:** ${this.config.shortName}  
**App ID:** ${this.config.appId}  
**Folder Name:** ${this.config.folderName}  
**Start URL:** ${this.config.startUrl}  
**Scope:** ${this.config.scope}  
**Display Mode:** ${this.config.display}  
**Orientation:** ${this.config.orientation}  
**Theme Color:** ${this.config.themeColor}  
**Background Color:** ${this.config.backgroundColor}  
**Cache Strategy:** ${this.config.cacheStrategy}  
**Offline Support:** ${this.config.enableOffline ? 'Enabled' : 'Disabled'}  
**Push Notifications:** ${this.config.enableNotifications ? 'Enabled' : 'Disabled'}  
**Total Files Cached:** ${this.files.allFiles.length + 3}

## 🚀 Installation Steps

### 1. Extract Files
\`\`\`bash
cd /path/to/pwaApps
unzip ${this.config.folderName}-pwa.zip -d ${this.config.folderName}
\`\`\`

### 2. Verify Structure
\`\`\`bash
ls -R ${this.config.folderName}/
# You should see all ${this.files.allFiles.length} of your original files plus PWA files
\`\`\`

### 3. Start Server (from parent directory)
\`\`\`bash
cd /path/to/pwaApps
python -m http.server 8000
\`\`\`

### 4. Access Your PWA
\`\`\`
http://localhost:8000/${this.config.folderName}/
\`\`\`
**Don't forget the trailing slash!**

### 5. Install on Device
- Open the URL in Chrome
- Click "Install" button or Chrome menu → "Install app"
- App icon will appear on your home screen
- All ${this.files.allFiles.length} files work offline!

## ✅ Testing Checklist

### In Browser Console (F12)
\`\`\`
✓ Service Worker registered: http://localhost:8000/${this.config.folderName}/
✓ App: ${this.config.name}
✓ Folder: ${this.config.folderName}
✓ Total files cached: ${this.files.allFiles.length + 3}
\`\`\`

### Expected Server Logs
\`\`\`
GET /${this.config.folderName}/ HTTP/1.1" 200 -
GET /${this.config.folderName}/manifest.json HTTP/1.1" 200 -
GET /${this.config.folderName}/sw.js HTTP/1.1" 200 -
\`\`\`
All 200 OK - No 404 errors!

### Offline Test
1. Install the PWA
2. Open Chrome DevTools → Network tab
3. Toggle "Offline" checkbox
4. Reload app
5. **All ${this.files.allFiles.length} files should load from cache!**

## 📱 For Termux Users (Android)

\`\`\`bash
# Setup
cd ~
mkdir pwaApps
cd pwaApps

# Extract
unzip ~/storage/downloads/${this.config.folderName}-pwa.zip -d ${this.config.folderName}

# Verify all files are there
ls -la ${this.config.folderName}/
# Should show ${this.files.allFiles.length} files

# Start server from parent directory
cd ~/pwaApps
python -m http.server 8000

# Access in Chrome
# http://localhost:8000/${this.config.folderName}/
\`\`\`

## 🎯 What's Included

### ✅ ALL Your Files Preserved
Every single file and folder from your original app is included:
- HTML, CSS, JavaScript files
- JSON configuration files
- Images, audio, video files
- Assets folders
- Data files
- Everything else!

### ✅ PWA Enhancements
- Service Worker caches ALL ${this.files.allFiles.length} files
- Works completely offline
- Install as native app
- Fast loading from cache
- Auto-updates when online

### ✅ Multi-App Ready
Perfect folder structure for hosting multiple PWAs:
\`\`\`
pwaApps/
├── ${this.config.folderName}/    ← This app (${this.files.allFiles.length} files)
├── anotherapp/                    ← Another app
└── games/                          ← Yet another app
\`\`\`

## 🐛 Troubleshooting

### Issue: 404 for service worker or files
**Solution:** Make sure you:
1. Started server from **parent directory** (pwaApps)
2. Access with trailing slash: \`http://localhost:8000/${this.config.folderName}/\`
3. All ${this.files.allFiles.length} files were extracted correctly

### Issue: Files not loading offline
**Solution:** 
1. Check service worker is active (Chrome DevTools → Application)
2. Verify all files are in cache storage
3. Check console for caching errors

### Issue: Some files missing
**Solution:**
1. Re-extract the ZIP file
2. Verify all ${this.files.allFiles.length} files are present
3. Check folder structure matches original

## 🌐 Production Deployment

### Deploy Complete Package
Upload the entire \`${this.config.folderName}\` folder to:
- **Netlify:** https://www.netlify.com/drop
- **Vercel:** https://vercel.com
- **GitHub Pages:** https://pages.github.com
- **Firebase:** https://firebase.google.com

All ${this.files.allFiles.length} files will be deployed together!

## 📊 Statistics

- **Original Files:** ${this.files.allFiles.length}
- **Generated Files:** ${this.generatedFiles.offline ? '4' : '3'} (manifest, SW, icons${this.generatedFiles.offline ? ', offline' : ''})
- **Total Package Size:** ~${this.formatFileSize(this.files.totalSize + 50000)} (estimated)
- **Files Cached Offline:** ALL ${this.files.allFiles.length} files
- **Unique Folders:** ${this.countUniqueFolders()}
- **Icons Generated:** 8 sizes

## 🎉 Features

✅ **Complete Folder Preservation** - All files and structure maintained  
✅ **Full Offline Support** - Every file cached and available offline  
✅ **Relative Paths** - Works in any subfolder  
✅ **Multi-App Ready** - Perfect for multiple PWAs  
✅ **Zero Configuration** - Just extract and run  
✅ **Production Ready** - Deploy anywhere  

---

**Generated on:** ${new Date().toLocaleString()}  
**PWA Converter Version:** 2.0.1 (Folder Upload Edition)  
**Original Folder:** ${this.files.folderName}  
**Sanitized Name:** ${this.config.folderName}  
**Files Included:** ${this.files.allFiles.length}  
**Access URL:** http://localhost:8000/${this.config.folderName}/  

Happy deploying! 🚀

All your files are preserved and ready to work offline!
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
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
            info: 'ℹ',
            warning: '⚠'
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
        this.files = {
            folderName: null,
            sanitizedName: null,
            allFiles: [],
            totalSize: 0,
            index: null,
            css: null,
            js: null,
            icon: null
        };
        this.config = {};
        this.generatedFiles = {};

        // Reset folder input
        document.getElementById('folder-input').value = '';
        document.getElementById('icon-file').value = '';

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

        // Hide folder contents
        document.getElementById('folder-contents').style.display = 'none';
        document.getElementById('folder-tree').innerHTML = '';

        // Reset form
        document.getElementById('pwa-config-form').reset();

        // Reset color inputs
        document.getElementById('theme-color').value = '#2196F3';
        document.getElementById('theme-color-text').value = '#2196F3';
        document.getElementById('background-color').value = '#ffffff';
        document.getElementById('background-color-text').value = '#FFFFFF';

        // Reset orientation
        document.getElementById('orientation').value = 'portrait-primary';

        // Clear user modification flags
        ['app-id', 'start-url', 'scope'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                delete field.dataset.userModified;
            }
        });

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
console.log('%c🚀 PWA Converter v2.0.1', 'font-size: 20px; font-weight: bold; color: #2196F3;');
console.log('%cFolder Upload Edition - Preserves ALL files!', 'font-size: 14px; color: #4CAF50;');
console.log('%c✨ Ready to transform your complete app into a PWA!', 'font-size: 12px; color: #757575;');
console.log('%c✅ Bug Fix: const to let in showDownloadSection()', 'font-size: 11px; color: #FF9800;');
