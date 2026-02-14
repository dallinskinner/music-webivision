/**
 * Artist search bar with autocomplete
 */

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useArtistSearch } from '../hooks/useArtistSearch';
import './SearchBar.css';

interface SearchBarProps {
  onArtistSelect: (artistName: string) => void;
  disabled?: boolean;
}

export function SearchBar({ onArtistSelect, disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, error, search, clearSuggestions } = useArtistSearch();

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    search(value);
    setShowDropdown(true);
  };

  // Handle artist selection
  const handleSelectArtist = (artistName: string) => {
    setQuery(artistName);
    setShowDropdown(false);
    clearSuggestions();
    onArtistSelect(artistName);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectArtist(suggestions[selectedIndex].name);
        } else if (query.trim()) {
          handleSelectArtist(query.trim());
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="search-bar-container">
      <input
        ref={inputRef}
        type="text"
        className="search-bar"
        placeholder="SEARCH ARTIST..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {showDropdown && (
        <div ref={dropdownRef} className="search-dropdown">
          {isLoading && (
            <div className="search-dropdown-item search-loading">
              <span className="loading-spinner">◐</span> SEARCHING...
            </div>
          )}

          {error && (
            <div className="search-dropdown-item search-error">
              ⚠ {error}
            </div>
          )}

          {!isLoading && !error && suggestions.length === 0 && query.trim() && (
            <div className="search-dropdown-item search-no-results">
              NO RESULTS FOUND
            </div>
          )}

          {!isLoading &&
            !error &&
            suggestions.map((artist, index) => (
              <div
                key={artist.mbid || artist.name}
                className={`search-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectArtist(artist.name)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="artist-info">
                  <div className="artist-name">{artist.name}</div>
                  <div className="artist-listeners">
                    {parseInt(artist.listeners).toLocaleString()} listeners
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
