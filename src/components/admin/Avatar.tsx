"use client";

import { useAuth, useTheme } from "@payloadcms/ui";
import Link from "next/link";
import { Icon } from "./icons";
import { Dropdown } from "./Popover";

const THEMES = [
  { value: "light", icon: "sun", label: "Enable light theme" },
  { value: "dark", icon: "moon", label: "Enable dark theme" },
  { value: "auto", icon: "desktop", label: "Enable system theme" },
] as const;

/** The avatar and its menu (Profile, theme, Sign out), as the source panel's user menu. */
export default function Avatar() {
  const { user } = useAuth<{ name?: string; email?: string }>();
  const { autoMode, theme, setTheme } = useTheme();
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();
  const current = autoMode ? "auto" : theme;

  return (
    <Dropdown
      className="fi-user-menu"
      trigger={
        <span className="fi-avatar" aria-label="User menu">
          {initial}
        </span>
      }
    >
      {(close) => (
        <>
          <div className="fi-menu">
            <Link href="/admin/account" className="fi-menu__item" onClick={close}>
              <Icon name="profile" />
              Profile
            </Link>
          </div>
          <div className="fi-menu fi-theme-switcher">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                className={current === option.value ? "is-active" : undefined}
                // Payload accepts "auto" at runtime (system theme), its type lists only light and dark.
                onClick={() => setTheme(option.value as "light")}
              >
                <Icon name={option.icon} />
              </button>
            ))}
          </div>
          <div className="fi-menu">
            <a href="/admin/logout" className="fi-menu__item">
              <Icon name="signOut" />
              Sign out
            </a>
          </div>
        </>
      )}
    </Dropdown>
  );
}
