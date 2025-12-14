#!/usr/bin/env python3
"""
Extension Verification Script
This script checks if all required files are present and valid.
"""

import os
import json
import sys

def check_extension():
    """Verify the extension files are complete and valid"""
    
    print("Microsoft Certificate Validator - Extension Verification")
    print("=" * 60)
    print()
    
    errors = []
    warnings = []
    
    # Check for required files
    required_files = [
        'manifest.json',
        'background.js',
        'content.js',
        'popup.html',
        'popup.js',
        'icons/icon16.png',
        'icons/icon48.png',
        'icons/icon128.png'
    ]
    
    print("Checking required files...")
    for file in required_files:
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"  [OK] {file} ({size} bytes)")
        else:
            print(f"  [ERROR] {file} is missing!")
            errors.append(f"Missing file: {file}")
    
    print()
    
    # Validate manifest.json
    print("Validating manifest.json...")
    try:
        with open('manifest.json', 'r') as f:
            manifest = json.load(f)
        
        # Check required fields
        required_fields = ['manifest_version', 'name', 'version', 'permissions', 'background']
        for field in required_fields:
            if field in manifest:
                print(f"  [OK] Field '{field}' present")
            else:
                print(f"  [ERROR] Field '{field}' missing!")
                errors.append(f"Missing manifest field: {field}")
        
        # Check manifest version
        if manifest.get('manifest_version') == 3:
            print(f"  [OK] Manifest version 3 (correct)")
        else:
            print(f"  [ERROR] Manifest version is {manifest.get('manifest_version')}, expected 3")
            errors.append("Incorrect manifest version")
        
        # Check icons
        if 'icons' in manifest:
            for size, path in manifest['icons'].items():
                if os.path.exists(path):
                    print(f"  [OK] Icon {size}x{size} at {path}")
                else:
                    print(f"  [ERROR] Icon {size}x{size} missing at {path}")
                    errors.append(f"Missing icon: {path}")
        
    except json.JSONDecodeError as e:
        print(f"  [ERROR] Invalid JSON: {e}")
        errors.append(f"Invalid manifest.json: {e}")
    except Exception as e:
        print(f"  [ERROR] Error reading manifest: {e}")
        errors.append(f"Error reading manifest: {e}")
    
    print()
    
    # Check file sizes
    print("Checking file sizes...")
    for file in required_files:
        if os.path.exists(file):
            size = os.path.getsize(file)
            if size == 0:
                print(f"  [WARNING] {file} is empty!")
                warnings.append(f"Empty file: {file}")
            elif size < 100 and not file.endswith('.png'):
                print(f"  [WARNING] {file} seems unusually small ({size} bytes)")
                warnings.append(f"Small file: {file}")
    
    print()
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if not errors and not warnings:
        print("[SUCCESS] Extension appears to be complete and valid!")
        print()
        print("You can now load this extension in Chrome:")
        print("1. Open chrome://extensions/")
        print("2. Enable 'Developer mode'")
        print("3. Click 'Load unpacked'")
        print("4. Select this directory")
        return 0
    else:
        if errors:
            print(f"\n[ERROR] Found {len(errors)} error(s):")
            for error in errors:
                print(f"  - {error}")
        
        if warnings:
            print(f"\n[WARNING] Found {len(warnings)} warning(s):")
            for warning in warnings:
                print(f"  - {warning}")
        
        if errors:
            print("\n[FAILED] Extension has errors and may not load in Chrome.")
            return 1
        else:
            print("\n[CAUTION] Extension has warnings but should still work.")
            return 0

if __name__ == '__main__':
    sys.exit(check_extension())
