# USD Invoice Template Fixes - Progress Tracker

## Steps from Approved Plan

### 1. CSS Section Updates [x]
   - Update `.title-row` padding for centering
   - Add border-right to `.party-box` for continuous line
   - Adjust `.ship-value` for center-left alignment  
   - Increase `.description-cell` line-height
   - Add `.quantity-stack` for tight spacing
   - Remove bank internal lines
   - Fix `.origin-text` font/line-height
   - Add `.auth-sign` for bottom-right label

### 2. HTML Structure Edits [x]
   - BANK DETAILS: Remove internal horizontal lines, make clean stacked box
   - Quantity cell: Wrap with `.quantity-stack` class for vertical tight stack
   - Sign box: Add 'Authorized Signatory' with `.auth-sign`
   - Ensure all headers/totals bolded
   - Party box border continuity

### 3. Test PDF Generation [ ]
   - Run backend service to generate sample USD invoice PDF
   - Compare with reference `usd tax invoice.pdf`

### 4. Final Verification & Completion [ ]

**Current Status:** Starting implementation...

**Template File:** `backend/src/templates/usdInvoice.hbs`

