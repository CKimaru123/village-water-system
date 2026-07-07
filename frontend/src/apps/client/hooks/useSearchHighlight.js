import Highlighter from "react-highlight-words";
import { useSearch } from "../context/SearchContext";

export const useSearchHighlight = (text) => {
  const { searchTerm } = useSearch();

  if (!searchTerm) return text;

  return (
    <Highlighter
      searchWords={[searchTerm]}
      autoEscape
      textToHighlight={text}
      highlightStyle={{
        backgroundColor: "yellow",
        color: "black",
        fontWeight: "bold",
      }}
    />
  );
};
