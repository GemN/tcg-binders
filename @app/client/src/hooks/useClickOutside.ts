import { useCallback, useEffect } from "react";

interface OptionsClickOutside {
  skip: boolean;
}
const useClickOutside = (
  ref:
    | React.RefObject<HTMLElement | null>
    | React.RefObject<HTMLElement | null>[],
  onClickOutside: Function,
  { skip }: OptionsClickOutside
) => {
  const handleClick = useCallback(
    (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!ref) {
        return;
      }
      const refs = Array.isArray(ref) ? ref : [ref];
      const insideClick = refs.some(
        (refObj) => !refObj?.current || refObj.current.contains(target)
      );
      if (insideClick) {
        return;
      }
      onClickOutside();
    },
    [ref, onClickOutside]
  );
  useEffect(() => {
    if (!skip) {
      document.addEventListener("mousedown", handleClick);
      return () => {
        document.removeEventListener("mousedown", handleClick);
      };
    }
  }, [handleClick, skip]);
};

export default useClickOutside;
