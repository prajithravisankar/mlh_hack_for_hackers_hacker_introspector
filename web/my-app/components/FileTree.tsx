"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Folder, FolderOpen, File, Check } from "lucide-react";
import { FileNode } from "@/lib/api";

// Re-export FileNode for backward compatibility
export type { FileNode } from "@/lib/api";

interface FileTreeProps {
  files: FileNode[];
  selectedFiles: string[];
  onSelectionChange: (files: string[]) => void;
  maxSelections?: number;
  isLoading?: boolean;
}

interface FileItemProps {
  node: FileNode;
  depth: number;
  selectedFiles: string[];
  onToggle: (path: string) => void;
  isSelectable: boolean;
}

// Individual file/folder item component
function FileItem({
  node,
  depth,
  selectedFiles,
  onToggle,
  isSelectable,
}: FileItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const isSelected = selectedFiles.includes(node.path);
  const isFolder = node.type === "folder";

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "file") {
      onToggle(node.path);
    }
  };

  const handleRowClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onToggle(node.path);
    }
  };

  const canSelect = node.type === "file" && (isSelected || isSelectable);

  return (
    <div>
      {/* File/Folder Row */}
      <motion.div
        onClick={handleRowClick}
        className={`
          flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded
          transition-colors duration-150
          ${
            isSelected
              ? "bg-zinc-200 dark:bg-zinc-700"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.1 }}
      >
        {/* Expand/Collapse Icon for Folders */}
        {isFolder ? (
          <motion.div
            initial={false}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="w-4 h-4 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        ) : (
          <div className="w-4 h-4" /> // Spacer for alignment
        )}

        {/* Checkbox (only for files) */}
        {node.type === "file" && (
          <div
            onClick={handleCheckboxClick}
            className={`
              w-4 h-4 rounded border flex items-center justify-center
              transition-all duration-150
              ${
                isSelected
                  ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                  : canSelect
                  ? "border-zinc-400 dark:border-zinc-500 hover:border-zinc-600 dark:hover:border-zinc-400"
                  : "border-zinc-300 dark:border-zinc-600 opacity-50 cursor-not-allowed"
              }
            `}
          >
            {isSelected && (
              <Check className="w-3 h-3 text-white dark:text-zinc-900" />
            )}
          </div>
        )}

        {/* Folder/File Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
          )
        ) : (
          <File className="w-4 h-4 text-zinc-500 dark:text-zinc-500 shrink-0" />
        )}

        {/* File/Folder Name */}
        <span
          className={`
            text-sm font-mono truncate
            ${
              isSelected
                ? "text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-700 dark:text-zinc-300"
            }
            ${!canSelect && node.type === "file" ? "opacity-50" : ""}
          `}
        >
          {node.name}
        </span>
      </motion.div>

      {/* Children (for folders) */}
      <AnimatePresence initial={false}>
        {isFolder && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <FileItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFiles={selectedFiles}
                onToggle={onToggle}
                isSelectable={isSelectable}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main FileTree component
export default function FileTree({
  files,
  selectedFiles,
  onSelectionChange,
  maxSelections = 3,
  isLoading = false,
}: FileTreeProps) {
  const isSelectable = selectedFiles.length < maxSelections;

  const handleToggle = useCallback(
    (path: string) => {
      if (selectedFiles.includes(path)) {
        // Deselect
        onSelectionChange(selectedFiles.filter((p) => p !== path));
      } else if (selectedFiles.length < maxSelections) {
        // Select (if under limit)
        onSelectionChange([...selectedFiles, path]);
      }
    },
    [selectedFiles, onSelectionChange, maxSelections]
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Repository Files
          </span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            {selectedFiles.length}/{maxSelections} selected
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {selectedFiles.length > 0 && (
        <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex flex-wrap gap-1">
            {selectedFiles.map((path) => (
              <span
                key={path}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300"
              >
                {path.split("/").pop()}
                <button
                  onClick={() => handleToggle(path)}
                  className="ml-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mb-4" />
            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
              Loading file tree...
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <Folder className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
              No files found
            </p>
          </div>
        ) : (
          files.map((node) => (
            <FileItem
              key={node.path}
              node={node}
              depth={0}
              selectedFiles={selectedFiles}
              onToggle={handleToggle}
              isSelectable={isSelectable}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 text-center">
          Select up to {maxSelections} files to discuss
        </p>
      </div>
    </div>
  );
}
