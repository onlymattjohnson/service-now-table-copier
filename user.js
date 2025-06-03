// ==UserScript==
// @name         ServiceNow Table to CSV Copier
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Copy tables from ServiceNow as CSV or HTML with reliable clipboard support
// @author       You
// @match        https://*.service-now.com/*
// @match        https://*.servicenow.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add styles
    GM_addStyle(`
        .sn-table-copier-highlight {
            outline: 3px solid #ff9800 !important;
            outline-offset: 2px !important;
            cursor: pointer !important;
        }
        
        .sn-table-copier-copied {
            outline: 3px solid #4CAF50 !important;
        }
        
        .sn-table-copier-panel {
            position: fixed;
            top: 60px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            min-width: 250px;
        }
        
        .sn-table-copier-panel h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
        }
        
        .sn-table-copier-btn {
            display: block;
            width: 100%;
            padding: 8px 12px;
            margin: 5px 0;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-align: center;
        }
        
        .sn-table-copier-btn:hover {
            background: #45a049;
        }
        
        .sn-table-copier-btn.active {
            background: #ff9800;
        }
        
        .sn-table-copier-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .sn-table-copier-info {
            margin: 10px 0;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .sn-table-copier-close {
            position: absolute;
            top: 5px;
            right: 5px;
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 25px;
            height: 25px;
            line-height: 25px;
        }
        
        .sn-table-copier-close:hover {
            color: #000;
        }
        
        .sn-format-toggle {
            display: flex;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .sn-format-toggle button {
            flex: 1;
            padding: 6px;
            border: none;
            background: #f0f0f0;
            cursor: pointer;
            font-size: 12px;
        }
        
        .sn-format-toggle button.active {
            background: #4CAF50;
            color: white;
        }
        
        .sn-format-toggle button:first-child {
            border-right: 1px solid #ddd;
        }
        
        /* Invisible textarea for clipboard operations */
        .sn-clipboard-helper {
            position: fixed;
            top: -1000px;
            left: -1000px;
            opacity: 0;
            pointer-events: none;
        }
    `);

    let autoMode = false;
    let panel = null;
    let highlightedTable = null;
    let copyFormat = 'csv'; // Default to CSV

    // Create control panel
    function createPanel() {
        if (panel) return;
        
        panel = document.createElement('div');
        panel.className = 'sn-table-copier-panel';
        panel.innerHTML = `
            <button class="sn-table-copier-close" title="Close panel (Alt+T to reopen)">×</button>
            <h3>Table Copier</h3>
            <div class="sn-format-toggle">
                <button id="sn-format-csv" class="active">CSV</button>
                <button id="sn-format-html">HTML</button>
            </div>
            <button class="sn-table-copier-btn" id="sn-detect-tables">Detect Tables</button>
            <button class="sn-table-copier-btn" id="sn-auto-mode">Enable Auto Mode</button>
            <button class="sn-table-copier-btn" id="sn-copy-first">Copy First Table</button>
            <div class="sn-table-copier-info" id="sn-info">
                <strong>Shortcuts:</strong><br>
                Alt+T: Toggle panel<br>
                Alt+C: Copy highlighted<br>
                Alt+A: Toggle auto mode<br>
                Alt+F: Toggle format
            </div>
            <div id="sn-table-list"></div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('sn-detect-tables').addEventListener('click', detectTables);
        document.getElementById('sn-auto-mode').addEventListener('click', toggleAutoMode);
        document.getElementById('sn-copy-first').addEventListener('click', copyFirstTable);
        document.getElementById('sn-format-csv').addEventListener('click', () => setFormat('csv'));
        document.getElementById('sn-format-html').addEventListener('click', () => setFormat('html'));
        panel.querySelector('.sn-table-copier-close').addEventListener('click', () => {
            panel.remove();
            panel = null;
        });
    }

    // Set copy format
    function setFormat(format) {
        copyFormat = format;
        document.getElementById('sn-format-csv').classList.toggle('active', format === 'csv');
        document.getElementById('sn-format-html').classList.toggle('active', format === 'html');
        showToast(`Copy format set to ${format.toUpperCase()}`);
    }

    // Show toast notification
    function showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'sn-table-copier-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Reliable clipboard copy function
    function copyToClipboard(text) {
        // Create a textarea element
        const textarea = document.createElement('textarea');
        textarea.className = 'sn-clipboard-helper';
        textarea.value = text;
        document.body.appendChild(textarea);
        
        // Select and copy
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Copy command failed');
            }
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback: show the content in a prompt
            prompt('Copy failed. Please copy manually:', text);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }

    // Convert table to CSV
    function tableToCSV(table) {
        const rows = [];
        const tableRows = table.querySelectorAll('tr');
        
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            const rowData = [];
            
            cells.forEach(cell => {
                // Get text content and clean it up
                let text = cell.textContent.trim();
                
                // Handle line breaks
                text = text.replace(/\n/g, ' ');
                
                // Escape quotes
                text = text.replace(/"/g, '""');
                
                // Wrap in quotes if contains comma, quote, or newline
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = `"${text}"`;
                }
                
                rowData.push(text);
            });
            
            if (rowData.length > 0) {
                rows.push(rowData.join(','));
            }
        });
        
        return rows.join('\n');
    }

    // Find all tables including in iframes
    function findAllTables() {
        const tables = [];
        
        // Main document tables
        document.querySelectorAll('table').forEach((table, index) => {
            tables.push({
                element: table,
                frame: 'main',
                index: index,
                rows: table.querySelectorAll('tr').length,
                cols: table.querySelector('tr') ? table.querySelector('tr').querySelectorAll('td, th').length : 0,
                id: table.id,
                className: table.className
            });
        });
        
        // Tables in iframes
        document.querySelectorAll('iframe').forEach((iframe, frameIndex) => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.querySelectorAll('table').forEach((table, index) => {
                    tables.push({
                        element: table,
                        frame: `iframe${frameIndex}`,
                        index: index,
                        rows: table.querySelectorAll('tr').length,
                        cols: table.querySelector('tr') ? table.querySelector('tr').querySelectorAll('td, th').length : 0,
                        id: table.id,
                        className: table.className
                    });
                });
            } catch (e) {
                console.log('Cannot access iframe:', e);
            }
        });
        
        return tables;
    }

    // Detect and highlight tables
    function detectTables() {
        const tables = findAllTables();
        
        if (tables.length === 0) {
            showToast('No tables found!');
            return;
        }
        
        // Update info
        const info = document.getElementById('sn-info');
        info.innerHTML = `
            <strong>Found ${tables.length} table(s)</strong><br>
            Format: ${copyFormat.toUpperCase()}<br>
            Click any highlighted table to copy<br>
            <strong>Shortcuts:</strong><br>
            Alt+C: Copy highlighted<br>
            Alt+F: Toggle format
        `;
        
        // Highlight all tables
        tables.forEach((tableInfo, index) => {
            const table = tableInfo.element;
            table.classList.add('sn-table-copier-highlight');
            table.dataset.tableIndex = index;
            
            // Remove existing listeners
            table.replaceWith(table.cloneNode(true));
            const newTable = document.querySelectorAll('.sn-table-copier-highlight')[index];
            
            // Add click handler
            newTable.addEventListener('click', function(e) {
                if (newTable.classList.contains('sn-table-copier-highlight')) {
                    e.preventDefault();
                    e.stopPropagation();
                    copyTable(newTable);
                }
            });
        });
        
        showToast(`Found ${tables.length} table(s) - Click any to copy as ${copyFormat.toUpperCase()}`);
    }

    // Copy table
    function copyTable(table) {
        let content;
        let message;
        
        if (copyFormat === 'csv') {
            content = tableToCSV(table);
            message = 'Table copied as CSV!';
        } else {
            content = table.outerHTML;
            message = 'Table HTML copied!';
        }
        
        const success = copyToClipboard(content);
        
        if (success) {
            // Visual feedback
            table.classList.add('sn-table-copier-copied');
            setTimeout(() => {
                table.classList.remove('sn-table-copier-copied');
            }, 500);
            
            showToast(message);
        } else {
            showToast('Copy failed - check the prompt', 3000);
        }
    }

    // Copy first visible table
    function copyFirstTable() {
        const tables = findAllTables();
        if (tables.length > 0) {
            copyTable(tables[0].element);
        } else {
            showToast('No tables found!');
        }
    }

    // Toggle auto mode
    function toggleAutoMode() {
        autoMode = !autoMode;
        const btn = document.getElementById('sn-auto-mode');
        
        if (autoMode) {
            btn.textContent = 'Disable Auto Mode';
            btn.classList.add('active');
            enableAutoMode();
            showToast('Auto mode enabled - Hover to highlight, click to copy');
        } else {
            btn.textContent = 'Enable Auto Mode';
            btn.classList.remove('active');
            disableAutoMode();
            showToast('Auto mode disabled');
        }
    }

    // Enable auto mode
    function enableAutoMode() {
        document.addEventListener('mouseover', handleHover);
    }

    // Disable auto mode
    function disableAutoMode() {
        document.removeEventListener('mouseover', handleHover);
        
        // Remove all highlights
        document.querySelectorAll('.sn-table-copier-highlight').forEach(table => {
            table.classList.remove('sn-table-copier-highlight');
        });
    }

    // Handle hover in auto mode
    function handleHover(e) {
        const table = e.target.closest('table');
        
        // Remove previous highlight
        if (highlightedTable && highlightedTable !== table) {
            highlightedTable.classList.remove('sn-table-copier-highlight');
            highlightedTable.removeEventListener('click', handleAutoClick);
        }
        
        if (table) {
            table.classList.add('sn-table-copier-highlight');
            table.addEventListener('click', handleAutoClick);
            highlightedTable = table;
        }
    }

    // Handle click in auto mode
    function handleAutoClick(e) {
        e.preventDefault();
        e.stopPropagation();
        copyTable(this);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt+T: Toggle panel
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            if (panel) {
                panel.remove();
                panel = null;
            } else {
                createPanel();
            }
        }
        
        // Alt+C: Copy highlighted table
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            const highlighted = document.querySelector('.sn-table-copier-highlight');
            if (highlighted) {
                copyTable(highlighted);
            } else {
                showToast('No table highlighted!');
            }
        }
        
        // Alt+A: Toggle auto mode
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            if (panel) {
                toggleAutoMode();
            } else {
                createPanel();
                toggleAutoMode();
            }
        }
        
        // Alt+F: Toggle format
        if (e.altKey && e.key === 'f') {
            e.preventDefault();
            setFormat(copyFormat === 'csv' ? 'html' : 'csv');
        }
    });

    // Auto-create panel on load
    setTimeout(() => {
        createPanel();
        showToast('Table Copier loaded! Format: CSV (Alt+F to change)', 3000);
    }, 1000);

})();