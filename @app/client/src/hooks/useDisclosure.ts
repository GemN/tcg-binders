import { useCallback, useState } from "react";

interface UseDisclosureReturn {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  handleToggle: () => void;
  setOpen: (open: boolean) => void;
}
export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, handleOpen, handleClose, handleToggle, setOpen: setIsOpen };
}
