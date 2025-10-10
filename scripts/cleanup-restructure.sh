#!/bin/bash

# Cleanup Script for Restructuring
# This script removes old folders after verifying the new structure is working

set -e  # Exit on error

echo "🧹 Codebase Restructuring - Cleanup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify build is passing
echo "Step 1: Verifying build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed! Cannot proceed with cleanup.${NC}"
    exit 1
fi

# Step 2: List folders to be removed
echo ""
echo "Step 2: Folders to be removed:"
echo "  - src/config/"
echo "  - src/middleware/"
echo "  - src/utils/"
echo "  - src/validators/"
echo "  - src/types/"
echo "  - src/models/"

# Step 3: Ask for confirmation
echo ""
read -p "⚠️  Are you sure you want to delete these folders? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${YELLOW}Cleanup cancelled.${NC}"
    exit 0
fi

# Step 4: Create backup
echo ""
echo "Step 3: Creating backup..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
for dir in config middleware utils validators types models; do
    if [ -d "src/$dir" ]; then
        cp -r "src/$dir" "$BACKUP_DIR/"
        echo "  - Backed up src/$dir/ to $BACKUP_DIR/"
    fi
done
echo -e "${GREEN}✅ Backup created in $BACKUP_DIR/${NC}"

# Step 5: Remove old folders
echo ""
echo "Step 4: Removing old folders..."
for dir in config middleware utils validators types models; do
    if [ -d "src/$dir" ]; then
        rm -rf "src/$dir"
        echo -e "${GREEN}  ✅ Removed src/$dir/${NC}"
    else
        echo -e "${YELLOW}  ⚠️  src/$dir/ not found${NC}"
    fi
done

# Step 6: Verify build still passes
echo ""
echo "Step 5: Re-verifying build after cleanup..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build still successful after cleanup!${NC}"
else
    echo -e "${RED}❌ Build failed after cleanup! Restoring from backup...${NC}"
    for dir in config middleware utils validators types models; do
        if [ -d "$BACKUP_DIR/$dir" ]; then
            cp -r "$BACKUP_DIR/$dir" "src/"
            echo "  - Restored src/$dir/"
        fi
    done
    echo -e "${YELLOW}⚠️  Folders restored. Please investigate the build error.${NC}"
    exit 1
fi

# Step 7: Success
echo ""
echo -e "${GREEN}=========================================="
echo "✅ Cleanup Complete!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "  - Old folders removed: 6"
echo "  - Backup location: $BACKUP_DIR/"
echo "  - Build status: ✅ Passing"
echo ""
echo "Next steps:"
echo "  1. Run tests: npm test"
echo "  2. Start dev server: npm run dev"
echo "  3. If everything works, you can delete: $BACKUP_DIR/"
echo ""
