import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../App";

afterEach(cleanup);

describe("theme toggle", () => {
  it("starts light and toggles both ways using the keyboard", async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByRole("button", { name: "Dark theme", pressed: false });
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.tab();
    expect(document.activeElement).toBe(toggle);
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Dark theme", pressed: true })).toBe(toggle);
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.keyboard("{Enter}");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("preserves search, filters, results and every statistic in both themes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "sweetgrass");
    await user.selectOptions(screen.getByLabelText("Genre"), "Nonfiction");
    await user.selectOptions(screen.getByLabelText("Status"), "unread");

    const stats = screen.getByRole("region", { name: "Reading stats" });
    const initialStats = stats.textContent;
    for (const label of ["Total: 1", "Read: 0", "Unread: 1", "Favorites: 1", "Average rating: 5.0"]) {
      expect(within(stats).getByLabelText(label)).toBeTruthy();
    }

    for (const theme of ["dark", "light"]) {
      await user.click(screen.getByRole("button", { name: "Dark theme" }));
      expect(document.documentElement.dataset.theme).toBe(theme);
      expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("sweetgrass");
      expect((screen.getByLabelText("Genre") as HTMLSelectElement).value).toBe("Nonfiction");
      expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe("unread");
      expect(screen.getByRole("heading", { name: "1 books shown" })).toBeTruthy();
      expect(screen.getByRole("article", { name: "Braiding Sweetgrass by Robin Wall Kimmerer" })).toBeTruthy();
      expect(stats.textContent).toBe(initialStats);
    }

    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "no matching title");
    const emptyStats = stats.textContent;
    for (const theme of ["dark", "light"]) {
      await user.click(screen.getByRole("button", { name: "Dark theme" }));
      expect(document.documentElement.dataset.theme).toBe(theme);
      expect(screen.getByRole("status").textContent).toContain(
        "Try a different search term, genre, or reading status."
      );
      expect(stats.textContent).toBe(emptyStats);
      for (const label of ["Total: 0", "Read: 0", "Unread: 0", "Favorites: 0", "Average rating: 0.0"]) {
        expect(within(stats).getByLabelText(label)).toBeTruthy();
      }
    }
  });

  it("restores the document theme on unmount and starts light on a fresh mount", async () => {
    const originalTheme = document.documentElement.getAttribute("data-theme");
    const user = userEvent.setup();
    const app = render(<App />);
    await user.click(screen.getByRole("button", { name: "Dark theme" }));
    app.unmount();
    expect(document.documentElement.getAttribute("data-theme")).toBe(originalTheme);

    render(<App />);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: "Dark theme", pressed: false })).toBeTruthy();
  });
});
