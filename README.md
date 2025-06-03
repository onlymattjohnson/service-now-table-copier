# 📋 ServiceNow Table Copier

## 📄 Overview

The **ServiceNow Table Copierr** is a Tampermonkey userscript designed to empower ServiceNow users who lack direct export permissions for reports and list views. This script allows you to easily copy the entire contents of a visible table (from a report or list) to your clipboard, enabling you to paste it into a spreadsheet program (like Excel, Google Sheets, or LibreOffice Calc) and then export it as a CSV or use the data as needed.

## 🌟 Problem Solved

Many ServiceNow users face limitations in exporting data due to restricted permissions. While you can view reports and lists, the "Export" options might be greyed out or simply unavailable. This script provides a simple and effective workaround, giving you the ability to extract the data you need for analysis, sharing, or record-keeping, even without elevated ServiceNow permissions.

## 🚀 Features

* **One-Click Table Copying:** Quickly copy the entire visible table data.
* **Clipboard Integration:** Seamlessly transfers data to your system clipboard.
* **Report and List View Compatibility:** Works on standard ServiceNow list views and report outputs.
* **Simple to Use:** Designed for straightforward activation and operation.

## 🛠️ Installation

This is a Tampermonkey script. If you don't have Tampermonkey installed, you'll need it first.

1.  **Install Tampermonkey:**
    * Download and install the Tampermonkey browser extension for your browser (Chrome, Firefox, Edge, Opera, Safari, etc.) from its official website or your browser's extension store.
        * [Chrome Web Store - Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
        * [Mozilla Add-ons - Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2.  **Install the Script:**
    * Once Tampermonkey is installed, open the raw `.js` file of this script (e.g., from your GitHub repository).
    * Tampermonkey will usually detect the userscript and prompt you to install it. Click "Install."
    * Alternatively, you can go to your Tampermonkey Dashboard, click the "Create a new script" icon (often a plus sign), and paste the entire code from `servicenow-table-extractor.user.js` into the editor, then save it.

## 💡 Usage

_TODO_ Write the usage

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## ⚠️ Disclaimer

This script is provided as-is and may not work with all ServiceNow versions or custom configurations. It relies on the structure of ServiceNow's HTML tables, which can change. Use responsibly and in accordance with your organization's IT policies. This script does *not* bypass security measures; it merely facilitates copying data that is already visible to the user in their browser.