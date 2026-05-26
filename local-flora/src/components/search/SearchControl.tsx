import React, { useState } from "react";
import "./SearchControl.css";

/**
 * Defines the props for the SearchControl component.
 */
interface SearchControlProps {
  /**
   * A callback function that gets executed when the search form is submitted.
   * @param query The search string entered by the user.
   */
  onSearch: (query: string) => void;
}

/**
 * A floating search control component that allows users to input a location.
 */
const SearchControl: React.FC<SearchControlProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent page reload
    if (query.trim()) {
      onSearch(query.trim());
      console.log(`Search submitted for: ${query.trim()}`);
    }
  };

  return (
    <form className="search-control" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder="Enter Postcode or Suburb..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="search-button" aria-label="Search">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
              stroke="#6c757d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default SearchControl;
