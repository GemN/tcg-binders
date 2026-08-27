import { createElement, useState } from "react";

interface HeaderProbeProps {
  binderName: string;
}

export const HeaderProbe = ({ binderName }: HeaderProbeProps) => {
  const [displayedName, setDisplayedName] = useState(binderName);

  return createElement(
    "button",
    {
      "data-testid": "header-probe",
      onClick: () => setDisplayedName("locally saved"),
      type: "button",
    },
    displayedName
  );
};

export const DetailProbe = () => {
  const [requiresReload, setRequiresReload] = useState(false);

  return createElement(
    "button",
    {
      "data-testid": "detail-probe",
      onClick: () => setRequiresReload(true),
      type: "button",
    },
    requiresReload ? "reload required" : "ready"
  );
};
