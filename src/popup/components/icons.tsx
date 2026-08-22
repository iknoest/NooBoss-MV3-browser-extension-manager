import type { JSX } from "preact";

export interface IconProps {
  color?: string;
  className?: string;
  id?: string;
  onClick?: (e: MouseEvent) => void;
  style?: JSX.CSSProperties;
  title?: string;
  size?: number | string;
}

export function BigTiley({ color = "currentColor", className, id, onClick, style, title, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Tiley({ color = "currentColor", className, id, onClick, style, title, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M3 9h4V5H3v4zm0 5h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zM8 9h4V5H8v4zm5-4v4h4V5h-4zm5 9h4v-4h-4v4zM3 19h4v-4H3v4zm5 0h4v-4H8v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm0-14v4h4V5h-4z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Listy({ color = "currentColor", className, id, onClick, style, title, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M4 15h16v-2H4v2zm0 4h16v-2H4v2zm0-8h16V9H4v2zm0-6v2h16V5H4z" />
      <path d="M0 0h24v24H0V0z" fill="none" />
    </svg>
  );
}

export function Closey({ color = "currentColor", className, id, onClick, style, title, size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Cleary({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Edity({ color = "currentColor", className, id, onClick, style, title, size = 14 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Switchy({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Optioney({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Removy({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Chromey({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

export function Groupy({ color = "currentColor", className, id, onClick, style, title, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Copyy({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}

export function Launchy({ color = "currentColor", className, id, onClick, style, title, size = 16 }: IconProps) {
  return (
    <svg
      className={className}
      id={id}
      onClick={onClick}
      fill={color}
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
  );
}
