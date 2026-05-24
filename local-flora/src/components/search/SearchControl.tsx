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
      <input
        type="text"
        placeholder="Enter Postcode or Suburb..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
};

export default SearchControl;
