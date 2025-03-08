import { Button } from "@/components/button/Button";
import { ReactNode } from "react";

type PlaygroundHeader = {
  logo?: ReactNode;
  title?: ReactNode;
  height: number;
  onConnectClicked: () => void;
};

export const Header = ({ logo, title, height }: PlaygroundHeader) => {
  return (
    <div
      className={`flex gap-4 py-4 px-4 text-foreground justify-between items-center shrink-0 border-b border-white/20`}
      style={{
        height: height + "px",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:gap-3 md:basis-2/3">
        <div className="flex md:basis-1/2">
          <a href="https://www.cartesia.ai" target="_blank">
            {logo ?? <LKLogo />}
          </a>
        </div>
        <div className="md:basis-1/2 md:text-center text-xs md:text-base font-semibold">
          {title}
        </div>
      </div>
      <div className="flex md:basis-1/3 justify-end items-center gap-2">
        <a href="https://github.com/livekit/agents" target="_blank">
          <Button state="secondary" size="small">
            <div className="flex gap-2">
              <span>Learn more</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M9.33329 4L13.3333 7.99999L9.33329 12M12.6666 7.99999H2.66663"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
            </div>
          </Button>
        </a>
      </div>
    </div>
  );
};

const LKLogo = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_101_119699)">
      <path
        d="M19.2006 12.7998H12.7996V19.2008H19.2006V12.7998Z"
        fill="currentColor"
      />
      <path
        d="M25.6014 6.40137H19.2004V12.8024H25.6014V6.40137Z"
        fill="currentColor"
      />
      <path
        d="M25.6014 19.2002H19.2004V25.6012H25.6014V19.2002Z"
        fill="currentColor"
      />
      <path d="M32 0H25.599V6.401H32V0Z" fill="currentColor" />
      <path d="M32 25.5986H25.599V31.9996H32V25.5986Z" fill="currentColor" />
      <path
        d="M6.401 25.599V19.2005V12.7995V6.401V0H0V6.401V12.7995V19.2005V25.599V32H6.401H12.7995H19.2005V25.599H12.7995H6.401Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_101_119699">
        <rect width="32" height="32" fill="white" />
      </clipPath>
    </defs>
  </svg>
);
