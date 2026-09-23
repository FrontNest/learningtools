import { useState, type InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput(props: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="password-input">
      <input {...props} type={revealed ? "text" : "password"} />
      <button
        type="button"
        className="password-reveal"
        aria-label="Hold to show password"
        title="Hold to show password"
        onPointerDown={() => setRevealed(true)}
        onPointerUp={() => setRevealed(false)}
        onPointerLeave={() => setRevealed(false)}
        onPointerCancel={() => setRevealed(false)}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") setRevealed(true);
        }}
        onKeyUp={() => setRevealed(false)}
      >
        <span aria-hidden="true">&#128065;</span>
      </button>
    </div>
  );
}