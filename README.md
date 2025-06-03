# 📋 ServiceNow Table Copier

## 📄 Overview

The **ServiceNow Table Copierr** is a Tampermonkey userscript designed to empower ServiceNow users who lack direct export permissions for reports and list views. This script allows you to easily copy the entire contents of a visible table (from a report or list) to your clipboard, enabling you to paste it into a spreadsheet program (like Excel, Google Sheets, or LibreOffice Calc) and then export it as a CSV or use the data as needed.

## 🌟 Problem Solved

Many ServiceNow users face limitations in exporting data due to restricted permissions. While you can view reports and lists, the "Export" options might be greyed out or simply unavailable. This script provides a simple and effective workaround, giving you the ability to extract the data you need for analysis, sharing, or record-keeping, even without elevated ServiceNow permissions.

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

### 1. Opening the Table Copier
- The control panel appears automatically in the top-right corner when you visit ServiceNow
- If you close it, press `Alt+T` to reopen

### 2. Detecting Tables
1. Click the **"Detect Tables"** button
2. The script will scan the entire page, including iframes
3. A counter will show "Table 1 of X" with table details

### 3. Navigating Tables
- Use the **`‹`** and **`›`** buttons to navigate between tables
- Or use the **arrow keys** (← →) on your keyboard
- The selected table will be highlighted with a **blue outline**
- Tables automatically scroll into view when selected

### 4. Copying Tables
- Click the **clipboard button** 📋 to copy the selected table
- Or press `Alt+C`
- A green outline briefly confirms the copy
- The data is now in your clipboard!

### 5. Choosing Format
- **CSV** (default): Perfect for Excel/Google Sheets
- **HTML**: Preserves formatting and links
- Toggle between formats using the buttons or press `Alt+F`

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+T` | Toggle panel visibility |
| `Alt+C` | Copy selected table |
| `Alt+F` | Toggle between CSV/HTML format |
| `←` `→` | Navigate between tables (when panel is open) |

## 🚀 Features

### CSV Export
- Properly handles special characters
- Escapes quotes and commas
- Converts line breaks to spaces
- Can be pasted directly into Excel/Google Sheets

### Table Information
Shows helpful details for each table:
- Number of rows and columns
- Table ID (if available)
- Whether it's in an iframe
- Example: `15 rows × 8 cols | ID: incident_table | In iframe0`

### Visual Feedback
- **Blue outline**: Currently selected table
- **Green outline**: Successful copy confirmation
- **Toast notifications**: Status messages appear in bottom-right

## 🔎 Tips

1. **For ServiceNow Lists**: The main data tables are usually the largest ones on the page
2. **Multiple Tables**: Use the navigation to find the exact table you need
3. **Iframe Tables**: The script automatically detects tables inside iframes (common in ServiceNow)
4. **Quick Workflow**: `Alt+T` → Click "Detect Tables" → Arrow keys to select → `Alt+C` to copy

## 🙋‍♂️ Troubleshooting

**No tables found?**
- Some ServiceNow pages load content dynamically
- Wait a moment and try "Detect Tables" again

**Copy not working?**
- The script will show a fallback prompt if clipboard access fails
- Simply copy the text from the prompt manually

**Can't see the panel?**
- Press `Alt+T` to toggle visibility
- Check if it's hidden behind other ServiceNow elements
- Refresh the page to reset

## Example Workflow

1. Navigate to a ServiceNow list view (e.g., Incidents, Changes, Problems)
2. Click "Detect Tables" in the Table Copier panel
3. Use arrow keys to find your data table (usually the largest one)
4. Press `Alt+C` to copy as CSV
5. Open Excel/Google Sheets and paste!

## Privacy & Security

- The script only runs on ServiceNow domains
- No data is sent anywhere - everything happens locally
- The script only reads table data when you explicitly request it

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