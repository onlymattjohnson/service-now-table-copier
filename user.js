// ==UserScript==
// @name         ServiceNow Table HTML Copier
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Quick copy HTML tables from ServiceNow with keyboard shortcuts and visual interface
// @author       You
// @match        https://*.service-now.com/*
// @match        https://*.servicenow.com/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
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
            min-width: 200px;
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
    `);

    let autoMode = false;
    let panel = null;
    let highlightedTable = null;

    // Create control panel
    function createPanel() {
        if (panel) return;
        
        panel = document.createElement('div');
        panel.className = 'sn-table-copier-panel';
        panel.innerHTML = `
            <button class="sn-table-copier-close" title="Close panel (Alt+T to reopen)">×</button>
            <h3>Table Copier</h3>
            <button class="sn-table-copier-btn" id="sn-detect-tables">Detect Tables</button>
            <button class="sn-table-copier-btn" id="sn-auto-mode">Enable Auto Mode</button>
            <button class="sn-table-copier-btn" id="sn-copy-first">Copy First Table</button>
            <div class="sn-table-copier-info" id="sn-info">
                <strong>Shortcuts:</strong><br>
                Alt+T: Toggle panel<br>
                Alt+C: Copy highlighted<br>
                Alt+A: Toggle auto mode
            </div>
            <div id="sn-table-list"></div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('sn-detect-tables').addEventListener('click', detectTables);
        document.getElementById('sn-auto-mode').addEventListener('click', toggleAutoMode);
        document.getElementById('sn-copy-first').addEventListener('click', copyFirstTable);
        panel.querySelector('.sn-table-copier-close').addEventListener('click', () => {
            panel.remove();
            panel = null;
        });
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
            Click any highlighted table to copy<br>
            <strong>Shortcuts:</strong><br>
            Alt+C: Copy highlighted<br>
            Alt+A: Toggle auto mode
        `;
        
        // Highlight all tables
        tables.forEach((tableInfo, index) => {
            const table = tableInfo.element;
            table.classList.add('sn-table-copier-highlight');
            table.dataset.tableIndex = index;
            
            // Add click handler
            table.addEventListener('click', function(e) {
                if (table.classList.contains('sn-table-copier-highlight')) {
                    e.preventDefault();
                    e.stopPropagation();
                    copyTable(table);
                }
            });
        });
        
        showToast(`Found ${tables.length} table(s) - Click any to copy`);
    }

    // Copy table HTML
    function copyTable(table) {
        const html = table.outerHTML;
        GM_setClipboard(html, 'text');
        
        // Visual feedback
        table.classList.add('sn-table-copier-copied');
        setTimeout(() => {
            table.classList.remove('sn-table-copier-copied');
        }, 500);
        
        showToast('Table HTML copied to clipboard!');
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
    });

    // Auto-create panel on load (optional - remove if you prefer manual activation)
    setTimeout(() => {
        createPanel();
        showToast('Table Copier loaded! Press Alt+T to toggle panel', 3000);
    }, 1000);

})();