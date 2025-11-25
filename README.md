# 🚀 PWA Converter

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

A client-side, zero-configuration tool to instantly transform any simple web application into a production-ready Progressive Web App (PWA).

![PWA Converter Screenshot](https://i.imgur.com/your-screenshot.png)
*(Suggestion: Replace this with a screenshot or GIF of your application)*

---

## ✨ Features

PWA Converter is a powerful, browser-based tool that requires no backend or build process. It automates the tedious task of converting a standard web project into a fully-featured PWA.

- **📁 Folder-Based Upload**: Simply select your project folder, and the tool intelligently processes your HTML, CSS, and JavaScript files.
- **🤖 Automatic Metadata Extraction**: Automatically reads your existing `index.html` to pre-fill the PWA configuration, saving you time.
- **🎨 Full PWA Customization**: Easily configure your PWA's name, short name, description, theme colors, display mode, orientation, and more.
- **⚙️ Service Worker Generation**: Creates a robust service worker with a choice of three common caching strategies:
  - Cache First (Fastest)
  - Network First (Freshest Content)
  - Stale While Revalidate (Balanced Approach)
- **🖼️ Automatic Icon Generation**: Upload a single high-resolution app icon, and the tool generates all necessary icon sizes (from 72x72 to 512x512) for cross-device compatibility. No icon? No problem—it will generate a placeholder for you.
- **🔌 Offline Ready**: Optionally generate a customizable offline fallback page to ensure a smooth user experience even without an internet connection.
- **⚡ JavaScript Enhancement**: Automatically injects a suite of PWA helper functions into your JavaScript for features like online/offline detection, install prompts, and more.
- **📦 Flexible Download Options**: Download individual generated files or get a complete, ready-to-deploy ZIP package that includes your new PWA files and a helpful README.

## 🛠️ How to Use

Transforming your web app into a PWA is a simple, three-step process:

1.  **Upload Your Project**:
    - Open `index.html` in your web browser.
    - Click **App Folder** and select the directory containing your web project (must include an `index.html` file).
    - (Optional) Upload a high-resolution **App Icon** (512x512px recommended).

2.  **Configure Your PWA**:
    - The tool will automatically navigate you to the configuration step.
    - Review the settings, which are pre-filled from your existing HTML where possible.
    - Customize the app name, colors, caching strategy, and other PWA features to your liking.

3.  **Generate & Download**:
    - Click **Generate PWA**.
    - On the final screen, download your PWA files. You can download them individually or as a single, organized **ZIP file**.

## 🚀 Deployment

To deploy your newly generated PWA, follow these steps:

1.  Extract the downloaded ZIP file.
2.  Upload the contents to a web hosting provider.
3.  **Serve over HTTPS**: PWAs require a secure connection to function correctly.

For easy and free hosting, you can use services like:
- [Netlify Drop](https://www.netlify.com/drop)
- [Vercel](https://vercel.com/new)
- [GitHub Pages](https://pages.github.com/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 💻 Local Development

This project is built with vanilla HTML, CSS, and JavaScript and requires no build tools.

To run the PWA Converter locally for development:
1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/pwa-converter.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd pwa-converter
    ```
3.  Start a local web server. A server is necessary for the browser to handle file uploads and for service worker testing.
    - If you have Node.js installed:
      ```bash
      npx serve
      ```
    - If you have Python installed:
      ```bash
      python -m http.server
      ```
4.  Open your browser and navigate to the local address provided by the server (e.g., `http://localhost:3000` or `http://localhost:8000`).

## 📂 Project Structure

The project is intentionally simple and contained in three main files:

-   `index.html`: Contains the complete HTML structure and user interface for the multi-step converter.
-   `styles.css`: Provides a modern, clean, and responsive design for the application.
-   `app.js`: The heart of the application. This file contains all the client-side logic for file handling, PWA generation, and UI interactions, all within the `PWAConverter` class.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or improvements, feel free to fork the repository, create a feature branch, and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
