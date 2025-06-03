// ==UserScript==
// @name         ServiceNow Table to CSV Copier
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Copy tables from ServiceNow as CSV or HTML with table navigation
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
            position: relative !important;
        }
        
        .sn-table-copier-selected {
            outline: 4px solid #2196F3 !important;
            outline-offset: 3px !important;
        }
        
        .sn-table-copier-copied {
            outline: 4px solid #4CAF50 !important;
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
            min-width: 280px;
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
        
        .sn-table-copier-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }
        
        .sn-table-copier-btn.active {
            background: #ff9800;
        }
        
        .sn-table-navigation {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        }
        
        .sn-nav-btn {
            padding: 5px 10px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            min-width: 35px;
        }
        
        .sn-nav-btn:hover:not(:disabled) {
            background: #1976D2;
        }
        
        .sn-nav-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }
        
        .sn-table-info {
            flex: 1;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        
        .sn-copy-btn {
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .sn-copy-btn:hover {
            background: #45a049;
            transform: scale(1.1);
        }
        
        .sn-copy-btn:active {
            transform: scale(0.95);
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
        
        .sn-table-details {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
        }
    `);

    let panel = null;
    let copyFormat = 'csv'; // Default to CSV
    let detectedTables = [];
    let selectedTableIndex = -1;

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
            <div id="sn-navigation-container" style="display: none;">
                <div class="sn-table-navigation">
                    <button class="sn-nav-btn" id="sn-prev-table" title="Previous table">‹</button>
                    <div class="sn-table-info">
                        <div id="sn-table-counter">No table selected</div>
                        <div class="sn-table-details" id="sn-table-details"></div>
                    </div>
                    <button class="sn-nav-btn" id="sn-next-table" title="Next table">›</button>
                    <button class="sn-copy-btn" id="sn-copy-selected" title="Copy selected table">📋</button>
                </div>
            </div>
            <div class="sn-table-copier-info" id="sn-info">
                <strong>Shortcuts:</strong><br>
                Alt+T: Toggle panel<br>
                Alt+C: Copy selected<br>
                Alt+F: Toggle format<br>
                ← →: Navigate tables
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('sn-detect-tables').addEventListener('click', detectTables);
        document.getElementById('sn-format-csv').addEventListener('click', () => setFormat('csv'));
        document.getElementById('sn-format-html').addEventListener('click', () => setFormat('html'));
        document.getElementById('sn-prev-table').addEventListener('click', () => navigateTable(-1));
        document.getElementById('sn-next-table').addEventListener('click', () => navigateTable(1));
        document.getElementById('sn-copy-selected').addEventListener('click', copySelectedTable);
        panel.querySelector('.sn-table-copier-close').addEventListener('click', () => {
            panel.remove();
            panel = null;
            clearHighlights();
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
        const textarea = document.createElement('textarea');
        textarea.className = 'sn-clipboard-helper';
        textarea.value = text;
        document.body.appendChild(textarea);
        
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        
        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Copy command failed');
            }
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
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
                let text = cell.textContent.trim();
                text = text.replace(/\n/g, ' ');
                text = text.replace(/"/g, '""');
                
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
                id: table.id || '',
                className: table.className || ''
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
                        id: table.id || '',
                        className: table.className || ''
                    });
                });
            } catch (e) {
                console.log('Cannot access iframe:', e);
            }
        });
        
        return tables;
    }

    // Clear all highlights
    function clearHighlights() {
        document.querySelectorAll('.sn-table-copier-highlight, .sn-table-copier-selected').forEach(table => {
            table.classList.remove('sn-table-copier-highlight', 'sn-table-copier-selected');
        });
    }

    // Highlight selected table
    function highlightSelectedTable() {
        clearHighlights();
        
        if (selectedTableIndex >= 0 && selectedTableIndex < detectedTables.length) {
            const table = detectedTables[selectedTableIndex].element;
            table.classList.add('sn-table-copier-selected');
            
            // Scroll table into view
            table.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Update UI
            updateNavigationUI();
        }
    }

    // Update navigation UI
    function updateNavigationUI() {
        const counter = document.getElementById('sn-table-counter');
        const details = document.getElementById('sn-table-details');
        const prevBtn = document.getElementById('sn-prev-table');
        const nextBtn = document.getElementById('sn-next-table');
        
        if (selectedTableIndex >= 0 && detectedTables.length > 0) {
            const table = detectedTables[selectedTableIndex];
            counter.textContent = `Table ${selectedTableIndex + 1} of ${detectedTables.length}`;
            
            let detailText = `${table.rows} rows × ${table.cols} cols`;
            if (table.id) detailText += ` | ID: ${table.id}`;
            if (table.frame !== 'main') detailText += ` | In ${table.frame}`;
            details.textContent = detailText;
            
            prevBtn.disabled = selectedTableIndex === 0;
            nextBtn.disabled = selectedTableIndex === detectedTables.length - 1;
        } else {
            counter.textContent = 'No table selected';
            details.textContent = '';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // Navigate between tables
    function navigateTable(direction) {
        if (detectedTables.length === 0) return;
        
        selectedTableIndex += direction;
        selectedTableIndex = Math.max(0, Math.min(selectedTableIndex, detectedTables.length - 1));
        
        highlightSelectedTable();
    }

    // Detect tables
    function detectTables() {
        detectedTables = findAllTables();
        
        if (detectedTables.length === 0) {
            showToast('No tables found!');
            document.getElementById('sn-navigation-container').style.display = 'none';
            return;
        }
        
        // Show navigation
        document.getElementById('sn-navigation-container').style.display = 'block';
        
        // Select first table
        selectedTableIndex = 0;
        highlightSelectedTable();
        
        showToast(`Found ${detectedTables.length} table(s)`);
    }

    // Copy selected table
    function copySelectedTable() {
        if (selectedTableIndex < 0 || selectedTableIndex >= detectedTables.length) {
            showToast('No table selected!');
            return;
        }
        
        const table = detectedTables[selectedTableIndex].element;
        copyTable(table);
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

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt+T: Toggle panel
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            if (panel) {
                panel.remove();
                panel = null;
                clearHighlights();
            } else {
                createPanel();
            }
        }
        
        // Alt+C: Copy selected table
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            if (panel && selectedTableIndex >= 0) {
                copySelectedTable();
            } else {
                showToast('No table selected!');
            }
        }
        
        // Alt+F: Toggle format
        if (e.altKey && e.key === 'f') {
            e.preventDefault();
            setFormat(copyFormat === 'csv' ? 'html' : 'csv');
        }
        
        // Arrow keys for navigation (when panel is open)
        if (panel && detectedTables.length > 0) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateTable(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateTable(1);
            }
        }
    });

    // Auto-create panel on load
    setTimeout(() => {
        createPanel();
        showToast('Table Copier loaded! Click "Detect Tables" to start', 3000);
    }, 1000);

})();