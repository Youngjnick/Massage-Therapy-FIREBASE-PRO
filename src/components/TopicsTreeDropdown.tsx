import * as React from 'react';

// --- MUI TreeView logic temporarily commented out ---
/*
// Build a tree from the fileList, including leaves for files
function buildTree(paths: string[], onSelect: any): any[] {
  const root: Record<string, any> = {};
  for (const path of paths) {
    const parts = path.replace(/\.json$/, '').split('/');
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      node.children = node.children || {};
      if (!node.children[part]) {
        node.children[part] = {};
      }
      // Only mark as leaf if it's the last part and not a folder
      if (i === parts.length - 1) {
        node.children[part].isLeaf = true;
        node.children[part].filePath = path;
      }
      node = node.children[part];
    }
  }
  function toTreeItems(obj: any, prefix = ''): any[] {
    return Object.entries(obj.children || {}).map(([key, value]) => {
      const id = prefix ? `${prefix}/${key}` : key;
      const val = value as Record<string, any>;
      // If it's a leaf (file), render as selectable leaf node
      if (val.isLeaf) {
        return (
          <TreeItem
            key={id}
            itemId={id}
            label={formatLabel(key)}
            onClick={() => onSelect(val.filePath)}
          />
        );
      }
      // If it's a folder, render children (may include files and folders)
      return (
        <TreeItem key={id} itemId={id} label={formatLabel(key)}>
          {toTreeItems(val, id)}
        </TreeItem>
      );
    });
  }
  return toTreeItems(root);
}
*/
// --- End MUI TreeView logic ---

interface TopicsTreeDropdownProps {
  onSelect: (filePath: string) => void;
}

const TopicsTreeDropdown: React.FC<TopicsTreeDropdownProps> = ({ onSelect }) => {
  // All topic selection UIs are commented out for now.
  // Placeholder UI while dropdown is commented out
  return <div style={{ color: '#888' }}>Topic selector temporarily disabled</div>;
};

export default TopicsTreeDropdown;
