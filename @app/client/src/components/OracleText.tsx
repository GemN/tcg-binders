import { parseOracleText } from "@/components/parseOracleText";

interface OracleTextProps {
  text: string;
}

export const OracleText = ({ text }: OracleTextProps) => {
  return (
    <p className="whitespace-pre-line text-[14px] leading-5 text-foreground">
      {parseOracleText(text).map((segment, index) =>
        segment.isItalic ? <i key={index}>{segment.text}</i> : segment.text
      )}
    </p>
  );
};
