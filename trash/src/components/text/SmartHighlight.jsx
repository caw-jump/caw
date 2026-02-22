import { RoughNotation } from "react-rough-notation";

export default function SmartHighlight({ text, color = "#FFD700", type = "underline" }) {
    return (
        <RoughNotation
            type={type}
            show={true}
            color={color}
            strokeWidth={3}
            animationDuration={800}
        >
            <span className="font-bold text-white">{text}</span>
        </RoughNotation>
    );
}
